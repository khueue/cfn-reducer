'use strict';

var test = require('tape');

var CfnReducer = require('rfr')('/src/CfnReducer');

test('conditional resource - cannot evaluate', function (t) {
	t.plan(1);

	var template = {
		Conditions: {
			'MyCondition': {
				'something': 'complex',
			},
		},
		thing: {
			'Condition': 'MyCondition',
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

	var template = {
		Conditions: {
			'MyCondition': true,
		},
		thing: {
			'Condition': 'MyCondition',
		},
	};

	var reducer = new CfnReducer({
		template: template,
	});
	var reduced = reducer.reduce();

	var expected = {
		Conditions: {
			'MyCondition': true,
		},
		thing: {
		},
	};

	t.deepEqual(reduced, expected);
});

test('conditional resource - false', function (t) {
	t.plan(1);

	var template = {
		Conditions: {
			'MyCondition': false,
		},
		thing: {
			'Condition': 'MyCondition',
		},
	};

	var reducer = new CfnReducer({
		template: template,
	});
	var reduced = reducer.reduce();

	var expected = {
		Conditions: {
			'MyCondition': false,
		},
	};

	t.deepEqual(reduced, expected);
});
