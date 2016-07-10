'use strict';

var CfnReducer = function (template, stackParams) {
	var self = this;

	self.template = JSON.parse(JSON.stringify(template));

	self.reduce = function () {
		var wasReduced = false;
		do {
			var reduced = self.reduceNode(self.template);
			wasReduced = JSON.stringify(reduced) !== JSON.stringify(self.template);
			self.template = reduced;
		} while (wasReduced);
		return self.template;
	};

	self.reduceNode = function (node) {
		node = self.tryToReduceExpression(node);
		if (Array.isArray(node)) {
			return self.reduceArray(node);
		} else if (typeof node === 'object') {
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
		Object.keys(object).forEach(function (key) {
			newObject[key] = self.reduceNode(object[key]);
		});
		return newObject;
	};

	self.reduceScalar = function (scalar) {
		return scalar;
	};

	self.tryToReduceExpression = function (node) {
		if (self.mightBeReducible(node)) {
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
		return node;
	};

	self.mightBeReducible = function (node) {
		return typeof node === 'object' && Object.keys(node).length === 1;
	};

	self.reduceFnAnd = function (node) {
		var args = node['Fn::And'];
		if (args[0] === true && args[1] === true) {
			return true;
		} else if (args[0] === false || args[1] === false) {
			return false;
		} else if (args[0] === true) {
			return args[1];
		} else if (args[1] === true) {
			return args[0];
		}
		return node;
	};

	self.reduceFnEquals = function (node) {
		var args = node['Fn::Equals'];
		if (self.isScalar(args[0]) && self.isScalar(args[1])) {
			return args[0] === args[1];
		}
		return node;
	};

	self.reduceFnFindInMap = function (node) {
		var args = node['Fn::FindInMap'];
		return self.template.Mappings[args[0]][args[1]][args[2]];
	};

	self.reduceFnIf = function (node) {
		var args = node['Fn::If'];
		var condName = args[0];
		if (typeof self.template.Conditions[condName] === 'boolean') {
			if (self.template.Conditions[condName]) {
				return args[1];
			} else {
				return args[2];
			}
		}
		return node;
	};

	self.reduceFnJoin = function (node) {
		var args = node['Fn::Join'];
		var separator = args[0];
		var parts = args[1];
		var allStrings = parts.every(function (part) {
			return typeof part === 'string';
		});
		if (allStrings) {
			return parts.join(separator);
		}
		return node;
	};

	self.reduceFnNot = function (node) {
		var args = node['Fn::Not'];
		var condition = args[0];
		if (typeof condition === 'boolean') {
			return !condition;
		}
		return node;
	};

	self.reduceFnOr = function (node) {
		var args = node['Fn::Or'];
		var someIsTrue = args.some(function (arg) {
			return arg === true;
		});
		if (someIsTrue) {
			return true;
		}
		return node;
	};

	self.reduceFnSelect = function (node) {
		var args = node['Fn::Select'];
		var index = args[0];
		var value = args[1];
		if (typeof value === 'string') {
			return value.split(',')[index];
		}
		return node;
	};

	self.reduceRef = function (node) {
		var name = node['Ref'];
		if (typeof stackParams[name] !== 'undefined') {
			return stackParams[name];
		}
		return node;
	};

	self.isScalar = function (obj) {
		switch (typeof obj) {
		case 'string':
		case 'number':
		case 'boolean':
			return true;
		}
		return false;
	};
};

module.exports = CfnReducer;
