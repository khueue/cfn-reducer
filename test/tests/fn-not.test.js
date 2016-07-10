'use strict';

var test = require('tape');

var CfnReducer = require('rfr')('/src/CfnReducer');

test('Fn::Not', function (t) {
	t.plan(1);

	var template = {
		thing: {
			'Fn::Not': [
				true,
			],
		},
	};

	var reducer = new CfnReducer(template, {});
	var reduced = reducer.reduce();

	var expected = {
		thing: false,
	};

	t.deepEqual(reduced, expected);
});

test('Fn::Not', function (t) {
	t.plan(1);

	var template = {
		thing: {
			'Fn::Not': [
				false,
			],
		},
	};

	var reducer = new CfnReducer(template, {});
	var reduced = reducer.reduce();

	var expected = {
		thing: true,
	};

	t.deepEqual(reduced, expected);
});

test('Fn::Not', function (t) {
	t.plan(1);

	var template = {
		thing: {
			'Fn::Not': [
				{
					something: 'complicated',
				},
			],
		},
	};

	var reducer = new CfnReducer(template, {});
	var reduced = reducer.reduce();

	var expected = template;

	t.deepEqual(reduced, expected);
});