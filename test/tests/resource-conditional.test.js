'use strict';

var test = require('tape');

var CfnReducer = require('rfr')('/src/CfnReducer');

test('conditional resource - cannot evaluate', function (t) {
	t.plan(1);

	var conditions = {
		'MyCondition': {
			'something': 'complex',
		},
	};

	var template = {
		Conditions: conditions,
		Resources: {
			thing: {
				'Condition': 'MyCondition',
			},
		},
	};

	var reducer = new CfnReducer({
		template: template,
	});
	var reduced = reducer.reduce();

	var expected = template;

	t.deepEqual(reduced, expected);
});

test('conditional resource - true', function (t) {
	t.plan(1);

	var conditions = {
		'MyCondition': true,
	};

	var template = {
		Conditions: conditions,
		Resources: {
			thing: {
				'Condition': 'MyCondition',
			},
		},
	};

	var reducer = new CfnReducer({
		template: template,
	});
	var reduced = reducer.reduce();

	var expected = {
		Resources: {
			thing: {
			},
		},
	};

	t.deepEqual(reduced, expected);
});

test('conditional resource - false', function (t) {
	t.plan(1);

	var conditions = {
		'MyCondition': false,
	};

	var template = {
		Conditions: conditions,
		Resources: {
			thing: {
				'Condition': 'MyCondition',
			},
		},
	};

	var reducer = new CfnReducer({
		template: template,
	});
	var reduced = reducer.reduce();

	var expected = {
	};

	t.deepEqual(reduced, expected);
});

test('conditional resource - toggled off', function (t) {
	t.plan(1);

	var conditions = {
		'MyCondition': true,
	};

	var template = {
		Conditions: conditions,
		Resources: {
			thing: {
				'Condition': 'MyCondition',
			},
		},
	};

	var reducer = new CfnReducer({
		template: template,
		settings: {
			reduceConditionalResource: false,
		},
	});
	var reduced = reducer.reduce();

	var expected = template;

	t.deepEqual(reduced, expected);
});
