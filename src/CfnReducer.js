'use strict';

var CfnReducer = function (template, options) {
	var self = this;

	self.template = JSON.parse(JSON.stringify(template));

	options = options || {};

	self.stackParams = options.stackParams || {};
	self.settings = options.settings || {};
	self.tracer = options.tracer;

	self.reduce = function () {
		var wasReduced = false;
		do {
			var reduced = self.reduceNode(self.template);
			wasReduced = JSON.stringify(reduced) !== JSON.stringify(self.template);
			self.template = reduced;
		} while (wasReduced);

		self.removeObsoleteParameters();

		return self.template;
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
		if (self.settings.sortKeys) {
			keys.sort();
		}
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
		if (self.tracer && JSON.stringify(oldNode) !== JSON.stringify(newNode)) {
			self.tracer.info({
				message: 'Reducing oldNode to newNode',
				oldNode: oldNode,
				newNode: newNode,
			});
		}
	};
};

module.exports = CfnReducer;
