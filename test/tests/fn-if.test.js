'use strict';

var test = require('tape');

var CfnReducer = require('rfr')('/src/CfnReducer');

test('Fn::If', function (t) {
	t.plan(1);

	var conditions = {
		'my-cond': true,
	};

	var template = {
		Conditions: conditions,
		thing: {
			'Fn::If': [
				'my-cond',
				'on-true',
				'on-false',
			],
		},
	};

	var reducer = new CfnReducer(template);
	var reduced = reducer.reduce();

	var expected = {
		Conditions: conditions,
		thing: 'on-true',
	};

	t.deepEqual(reduced, expected);
});

test('Fn::If', function (t) {
	t.plan(1);

	var conditions = {
		'my-cond': false,
	};

	var template = {
		Conditions: conditions,
		thing: {
			'Fn::If': [
				'my-cond',
				'on-true',
				'on-false',
			],
		},
	};

	var reducer = new CfnReducer(template);
	var reduced = reducer.reduce();

	var expected = {
		Conditions: conditions,
		thing: 'on-false',
	};

	t.deepEqual(reduced, expected);
});

test('Fn::If', function (t) {
	t.plan(1);

	var conditions = {
		'my-cond': {
			something: 'complicated',
		},
	};

	var template = {
		Conditions: conditions,
		thing: {
			'Fn::If': [
				'my-cond',
				'on-true',
				'on-false',
			],
		},
	};

	var reducer = new CfnReducer(template);
	var reduced = reducer.reduce();

	var expected = template;

	t.deepEqual(reduced, expected);
});
