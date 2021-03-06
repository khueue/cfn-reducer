'use strict';

var stableStringify = require('json-stable-stringify');

function deepCopy(obj) {
	return JSON.parse(JSON.stringify(obj));
}

function deepEqual(obj1, obj2) {
	return stableStringify(obj1) === stableStringify(obj2);
}

function deepSort(obj) {
	return JSON.parse(stableStringify(obj));
}

var CfnReducer = function (config) {
	var self = this;

	config = config || {};

	if (!config.template) {
		throw new Error('Requires config.template');
	}

	self.template = deepCopy(config.template);
	self.template.Conditions = self.template.Conditions || {};
	self.template.Mappings = self.template.Mappings || {};
	self.template.Parameters = self.template.Parameters || {};
	self.template.Resources = self.template.Resources || {};
	self.template.Outputs = self.template.Outputs || {};

	self.stackParams = config.stackParams || {};

	self.subTemplates = config.subTemplates || {};

	self.settings = {
		// Resources:
		reduceConditionalResource: true,
		// Intrinsics:
		reduceFnAnd: true,
		reduceFnEquals: true,
		reduceFnFindInMap: true,
		reduceFnIf: true,
		reduceFnJoin: true,
		reduceFnNot: true,
		reduceFnOr: true,
		reduceFnSelect: true,
		// Other:
		tracer: undefined,
		sortKeys: false,
	};
	Object.assign(self.settings, config.settings || {});

	self.reduce = function () {
		self.resetStats();

		// Reduce until it cannot be reduced further.
		var wasReduced = false;
		do {
			var reduced = self.reduceNode(self.template);
			wasReduced = stableStringify(reduced) !== stableStringify(self.template);
			self.template = reduced;
		} while (wasReduced);

		// Reduce and integrate any sub-templates.
		self.integrateSubTemplates();

		// Run a final pass to figure out usage counts for Refs etc.
		self.resetStats();
		self.template = self.reduceNode(self.template);

		// Clean up things that were rendered obsolete.
		self.cleanUpConditions();
		self.cleanUpMappings();
		self.cleanUpResources();
		self.cleanUpOutputs();
		self.cleanUpParameters();

		if (self.settings.sortKeys) {
			self.template = deepSort(self.template);
		}

		return self.template;
	};

	self.resetStats = function () {
		self.stats = {
			refs: {},
			conditions: {},
			mappings: {},
		};
	};

	// XXX @todo Refactor this function.
	self.integrateSubTemplates = function () {
		for (var resourceName in self.template.Resources) {
			var resource = self.template.Resources[resourceName];
			if (resource.Type === 'AWS::CloudFormation::Stack') {
				var template = self.subTemplates[resource.Properties.TemplateURL];
				if (!template) {
					continue;
				}

				var conf = {};
				conf.template = template;
				conf.settings = self.settings;
				conf.subTemplates = self.subTemplates;
				conf.stackParams = resource.Properties.Parameters;
				var reducer = new CfnReducer(conf);
				var subTemplate = reducer.reduce();

				var key;

				// Copy over to main template.
				for (key in subTemplate.Conditions) {
					self.template.Conditions[key] = subTemplate.Conditions[key];
				}
				for (key in subTemplate.Mappings) {
					self.template.Mappings[key] = subTemplate.Mappings[key];
				}
				for (key in subTemplate.Outputs) {
					self.template.Outputs[key] = subTemplate.Outputs[key];
				}
				for (key in subTemplate.Parameters) {
					self.template.Parameters[key] = subTemplate.Parameters[key];
				}
				for (key in subTemplate.Resources) {
					self.template.Resources[key] = subTemplate.Resources[key];
				}

				// Delete old sub-template resource from main template.
				delete self.template.Resources[resourceName];
			}
		}
	};

	self.cleanUpOutputs = function () {
		if (!Object.keys(self.template.Outputs).length) {
			delete self.template.Outputs;
		}
	};

	self.cleanUpMappings = function () {
		for (var key in self.template.Mappings) {
			if (!self.stats.mappings[key]) {
				delete self.template.Mappings[key];
			}
		}
		if (!Object.keys(self.template.Mappings).length) {
			delete self.template.Mappings;
		}
	};

	self.cleanUpConditions = function () {
		for (var key in self.template.Conditions) {
			if (!self.stats.conditions[key]) {
				delete self.template.Conditions[key];
			}
		}
		if (!Object.keys(self.template.Conditions).length) {
			delete self.template.Conditions;
		}
	};

	self.cleanUpResources = function () {
		if (!Object.keys(self.template.Resources).length) {
			delete self.template.Resources;
		}
	};

	self.cleanUpParameters = function () {
		for (var key in self.template.Parameters) {
			if (!self.stats.refs[key]) {
				delete self.template.Parameters[key];
			}
		}
		if (!Object.keys(self.template.Parameters).length) {
			delete self.template.Parameters;
		}
	};

	self.reduceNode = function (node) {
		node = self.tryToReduceExpression(node);
		if (self.isArray(node)) {
			return self.reduceArray(node);
		} else if (self.isObject(node)) {
			return self.reduceObject(node);
		} else {
			return self.reduceScalar(node);
		}
	};

	self.reduceArray = function (items) {
		var newItems = [];
		items.forEach(function (item) {
			newItems.push(self.reduceNode(item));
		});
		return newItems;
	};

	self.reduceObject = function (object) {
		var newObject = {};
		var keys = Object.keys(object);
		keys.forEach(function (key) {
			// Skip keys that are explicitly set to null.
			if (object[key] !== null) {
				newObject[key] = self.reduceNode(object[key]);
			}
		});
		return newObject;
	};

	self.reduceScalar = function (scalar) {
		return scalar;
	};

	self.tryToReduceExpression = function (node) {
		if (self.isObject(node)) {
			if (self.looksIntrinsic(node)) {
				var intrinsic = Object.keys(node)[0];
				switch (intrinsic) {
				case 'Fn::And':
					return self.reduceFnAnd(node);
				case 'Fn::Equals':
					return self.reduceFnEquals(node);
				case 'Fn::FindInMap':
					return self.reduceFnFindInMap(node);
				case 'Fn::GetAtt':
					return self.reduceFnGetAtt(node);
				case 'Fn::If':
					return self.reduceFnIf(node);
				case 'Fn::Join':
					return self.reduceFnJoin(node);
				case 'Fn::Not':
					return self.reduceFnNot(node);
				case 'Fn::Or':
					return self.reduceFnOr(node);
				case 'Fn::Select':
					return self.reduceFnSelect(node);
				case 'Ref':
					return self.reduceRef(node);
				}
			}

			if (self.looksConditional(node)) {
				return self.reduceConditionalResource(node);
			}
		}
		return node;
	};

	self.looksIntrinsic = function (node) {
		return self.isObject(node) && Object.keys(node).length === 1;
	};

	self.looksConditional = function (node) {
		return self.isObject(node) && self.isString(node['Condition']);
	};

	self.reduceConditionalResource = function (node) {
		var newNode = node;

		var condName = node['Condition'];

		if (self.settings.reduceConditionalResource) {
			var condition = self.template.Conditions[condName];
			if (self.isBoolean(condition)) {
				if (condition) {
					delete newNode['Condition'];
				} else {
					// Mark the resource for deletion later.
					newNode = null;
				}
			}
		}

		self.trackCondition(condName);

		self.traceReduction(node, newNode);
		return newNode;
	};

	self.reduceFnAnd = function (node) {
		var newNode = node;

		if (self.settings.reduceFnAnd) {
			var args = node['Fn::And'];
			if (args[0] === true && args[1] === true) {
				newNode = true;
			} else if (args[0] === false || args[1] === false) {
				newNode = false;
			} else if (args[0] === true) {
				newNode = args[1];
			} else if (args[1] === true) {
				newNode = args[0];
			}
		}

		self.traceReduction(node, newNode);
		return newNode;
	};

	self.reduceFnEquals = function (node) {
		var newNode = node;

		if (self.settings.reduceFnEquals) {
			var args = node['Fn::Equals'];
			if (self.isScalar(args[0]) && self.isScalar(args[1])) {
				newNode = args[0] === args[1];
			}
		}

		self.traceReduction(node, newNode);
		return newNode;
	};

	self.reduceFnFindInMap = function (node) {
		var newNode = node;

		var args = node['Fn::FindInMap'];
		var map = args[0];
		var section = args[1];
		var key = args[2];

		if (self.settings.reduceFnFindInMap) {
			if (self.isString(map) && self.isString(section) && self.isString(key)) {
				if (!self.isDefined(self.template.Mappings[map])) {
					throw new Error('Could not find map: ' + map);
				}
				if (!self.isDefined(self.template.Mappings[map][section])) {
					throw new Error('Could not find map.section: ' + [
						map,
						section,
					].join('.'));
				}
				if (!self.isDefined(self.template.Mappings[map][section][key])) {
					throw new Error('Could not find map.section.key: ' + [
						map,
						section,
						key,
					].join('.'));
				}
				newNode = self.template.Mappings[map][section][key];
			}
		}

		self.trackMapping(map);

		self.traceReduction(node, newNode);
		return newNode;
	};

	self.reduceFnIf = function (node) {
		var newNode = node;

		var args = node['Fn::If'];
		var condName = args[0];

		if (self.settings.reduceFnIf) {
			var condition = self.template.Conditions[condName];
			if (self.isBoolean(condition)) {
				if (condition) {
					newNode = args[1];
				} else {
					newNode = args[2];
				}
			}
		}

		self.trackCondition(condName);

		self.traceReduction(node, newNode);
		return newNode;
	};

	self.reduceFnJoin = function (node) {
		var newNode = node;

		if (self.settings.reduceFnJoin) {
			var args = node['Fn::Join'];
			var separator = args[0];
			var parts = args[1];
			if (self.isArray(parts)) {
				if (parts.length === 0) {
					newNode = '';
				} else if (parts.length === 1) {
					newNode = parts[0];
				} else {
					var allStrings = parts.every(function (part) {
						return self.isString(part);
					});
					if (allStrings) {
						newNode = parts.join(separator);
					}
				}
			} else if (self.isString(parts)) {
				newNode = parts;
			}
		}

		self.traceReduction(node, newNode);
		return newNode;
	};

	self.reduceFnNot = function (node) {
		var newNode = node;

		if (self.settings.reduceFnNot) {
			var args = node['Fn::Not'];
			var condition = args[0];
			if (self.isBoolean(condition)) {
				newNode = !condition;
			}
		}

		self.traceReduction(node, newNode);
		return newNode;
	};

	self.reduceFnOr = function (node) {
		var newNode = node;

		if (self.settings.reduceFnOr) {
			var args = node['Fn::Or'];
			var trues = 0;
			var falses = 0;
			args.forEach(function (arg) {
				if (arg === true) {
					++trues;
				} else if (arg === false) {
					++falses;
				}
			});
			if (trues > 0) {
				newNode = true;
			} else if (falses === args.length) {
				newNode = false;
			}
		}

		self.traceReduction(node, newNode);
		return newNode;
	};

	self.reduceFnSelect = function (node) {
		var newNode = node;

		if (self.settings.reduceFnSelect) {
			var args = node['Fn::Select'];
			var index = args[0];
			var value = args[1];
			if (self.isScalar(index) && self.isString(value)) {
				var values = value.split(',');
				newNode = values[Number(index)];
			}
		}

		self.traceReduction(node, newNode);
		return newNode;
	};

	self.reduceFnGetAtt = function (node) {
		var newNode = node;

		self.traceReduction(node, newNode);
		return newNode;
	};

	self.reduceRef = function (node) {
		var newNode = node;

		var name = node['Ref'];
		if (self.isScalar(self.stackParams[name])) {
			newNode = self.stackParams[name];
		}

		self.trackRef(name);

		self.traceReduction(node, newNode);
		return newNode;
	};

	self.trackCondition = function (condName) {
		self.stats.conditions[condName] = self.stats.conditions[condName] || 0;
		++self.stats.conditions[condName];
	};

	self.trackMapping = function (mapName) {
		self.stats.mappings[mapName] = self.stats.mappings[mapName] || 0;
		++self.stats.mappings[mapName];
	};

	self.trackRef = function (refName) {
		self.stats.refs[refName] = self.stats.refs[refName] || 0;
		++self.stats.refs[refName];
	};

	self.traceReduction = function (oldNode, newNode) {
		if (self.settings.tracer && !deepEqual(oldNode, newNode)) {
			self.settings.tracer.info({
				message: 'Reducing oldNode to newNode',
				oldNode: oldNode,
				newNode: newNode,
			});
		}
	};

	self.isBoolean = function (obj) {
		return typeof obj === 'boolean';
	};

	self.isDefined = function (obj) {
		return typeof obj !== 'undefined';
	};

	self.isNumber = function (obj) {
		return typeof obj === 'number';
	};

	self.isString = function (obj) {
		return typeof obj === 'string';
	};

	self.isArray = function (obj) {
		return Array.isArray(obj);
	};

	self.isObject = function (obj) {
		return typeof obj === 'object' && obj !== null;
	};

	self.isScalar = function (obj) {
		return self.isString(obj) || self.isBoolean(obj) || self.isNumber(obj);
	};
};

module.exports = CfnReducer;
