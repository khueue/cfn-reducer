'use strict';

var stableStringify = require('json-stable-stringify');

var CfnReducer = function (config) {
	var self = this;

	config = config || {};

	if (!config.template) {
		throw new Error('Requires config.template');
	}

	self.template = JSON.parse(JSON.stringify(config.template));

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
		sortKeys: false,
	};
	Object.assign(self.settings, config.settings || {});

	self.reduce = function () {
		// Reduce until it cannot be reduced further.
		var wasReduced = false;
		do {
			var reduced = self.reduceNode(self.template);
			wasReduced = stableStringify(reduced) !== stableStringify(self.template);
			self.template = reduced;
		} while (wasReduced);

		// Clean up things that were rendered obsolete.
		// XXX @todo Implement these.
		// self.removeObsoleteConditions();
		// self.removeObsoleteMappings();
		self.removeObsoleteParameters();

		// Reduce and integrate any sub-templates.
		self.integrateSubTemplates();

		if (self.settings.sortKeys) {
			self.template = JSON.parse(stableStringify(self.template));
		}

		return self.template;
	};

	// XXX @todo Refactor this function.
	self.integrateSubTemplates = function () {
		function prefixKeys(obj, prefix) {
			for (var key in obj) {
				obj[prefix + key] = obj[key];
				delete obj[key];
			}
		}

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
				if (resource.Properties && resource.Properties.Parameters) {
					conf.stackParams = resource.Properties.Parameters;
				}
				var reducer = new CfnReducer(conf);
				var subTemplate = reducer.reduce();

				prefixKeys(subTemplate.Conditions, resourceName);
				prefixKeys(subTemplate.Mappings, resourceName);
				prefixKeys(subTemplate.Parameters, resourceName);
				prefixKeys(subTemplate.Resources, resourceName);

				var key;

				for (key in subTemplate.Conditions) {
					self.template.Conditions[key] = subTemplate.Conditions[key];
				}
				for (key in subTemplate.Mappings) {
					self.template.Mappings[key] = subTemplate.Mappings[key];
				}
				for (key in subTemplate.Parameters) {
					self.template.Parameters[key] = subTemplate.Parameters[key];
				}
				for (key in subTemplate.Resources) {
					self.template.Resources[key] = subTemplate.Resources[key];
				}

				for (key in subTemplate.Resources) {
					delete self.template.Resources[resourceName];
				}
			}
		}
	};

	self.removeObsoleteParameters = function () {
		if (self.template.Parameters) {
			for (var param in self.template.Parameters) {
				if (self.stackParams[param]) {
					delete self.template.Parameters[param];
				}
			}
			if (!Object.keys(self.template.Parameters).length) {
				delete self.template.Parameters;
			}
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
					if (self.settings.reduceFnAnd) {
						return self.reduceFnAnd(node);
					}
					break;
				case 'Fn::Equals':
					if (self.settings.reduceFnEquals) {
						return self.reduceFnEquals(node);
					}
					break;
				case 'Fn::FindInMap':
					if (self.settings.reduceFnFindInMap) {
						return self.reduceFnFindInMap(node);
					}
					break;
				case 'Fn::If':
					if (self.settings.reduceFnIf) {
						return self.reduceFnIf(node);
					}
					break;
				case 'Fn::Join':
					if (self.settings.reduceFnJoin) {
						return self.reduceFnJoin(node);
					}
					break;
				case 'Fn::Not':
					if (self.settings.reduceFnNot) {
						return self.reduceFnNot(node);
					}
					break;
				case 'Fn::Or':
					if (self.settings.reduceFnOr) {
						return self.reduceFnOr(node);
					}
					break;
				case 'Fn::Select':
					if (self.settings.reduceFnSelect) {
						return self.reduceFnSelect(node);
					}
					break;
				case 'Ref':
					return self.reduceRef(node);
				}
			}
			if (self.looksConditional(node)) {
				if (self.settings.reduceConditionalResource) {
					return self.reduceConditionalResource(node);
				}
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
		if (self.isBoolean(self.template.Conditions[condName])) {
			if (self.template.Conditions[condName]) {
				delete newNode['Condition'];
			} else {
				// This will mark the resource for deletion later.
				newNode = null;
			}
		}

		self.traceReduction(node, newNode);
		return newNode;
	};

	self.reduceFnAnd = function (node) {
		var newNode = node;

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

		self.traceReduction(node, newNode);
		return newNode;
	};

	self.reduceFnEquals = function (node) {
		var newNode = node;

		var args = node['Fn::Equals'];
		if (self.isScalar(args[0]) && self.isScalar(args[1])) {
			newNode = args[0] === args[1];
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

		self.traceReduction(node, newNode);
		return newNode;
	};

	self.reduceFnIf = function (node) {
		var newNode = node;

		var args = node['Fn::If'];
		var condName = args[0];
		if (self.isBoolean(self.template.Conditions[condName])) {
			if (self.template.Conditions[condName]) {
				newNode = args[1];
			} else {
				newNode = args[2];
			}
		}

		self.traceReduction(node, newNode);
		return newNode;
	};

	self.reduceFnJoin = function (node) {
		var newNode = node;

		var args = node['Fn::Join'];
		var separator = args[0];
		var parts = args[1];
		var allStrings = parts.every(function (part) {
			return self.isString(part);
		});
		if (allStrings) {
			newNode = parts.join(separator);
		}

		self.traceReduction(node, newNode);
		return newNode;
	};

	self.reduceFnNot = function (node) {
		var newNode = node;

		var args = node['Fn::Not'];
		var condition = args[0];
		if (self.isBoolean(condition)) {
			newNode = !condition;
		}

		self.traceReduction(node, newNode);
		return newNode;
	};

	self.reduceFnOr = function (node) {
		var newNode = node;

		var args = node['Fn::Or'];
		var someIsTrue = args.some(function (arg) {
			return arg === true;
		});
		if (someIsTrue) {
			newNode = true;
		}

		self.traceReduction(node, newNode);
		return newNode;
	};

	self.reduceFnSelect = function (node) {
		var newNode = node;

		var args = node['Fn::Select'];
		var index = args[0];
		var value = args[1];
		if (self.isString(value)) {
			newNode = value.split(',')[index];
		}

		self.traceReduction(node, newNode);
		return newNode;
	};

	self.reduceRef = function (node) {
		var newNode = node;

		var name = node['Ref'];
		if (self.isDefined(self.stackParams[name])) {
			newNode = self.stackParams[name];
		}

		self.traceReduction(node, newNode);
		return newNode;
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

	self.traceReduction = function (oldNode, newNode) {
		if (self.settings.tracer && stableStringify(oldNode) !== stableStringify(newNode)) {
			self.settings.tracer.info({
				message: 'Reducing oldNode to newNode',
				oldNode: oldNode,
				newNode: newNode,
			});
		}
	};
};

module.exports = CfnReducer;
