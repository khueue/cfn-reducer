'use strict';

var test = require('tape');

var CfnReducer = require('rfr')('/src/CfnReducer');

test('Fn::Equals', function (t) {
	t.plan(1);

	var template = {
		'Fn::Equals': [
			'value',
			'value',
		],
	};

	var reducer = new CfnReducer(template);
	var reduced = reducer.reduce();

	var expected = true;

	t.deepEqual(reduced, expected);
});

test('Fn::Equals', function (t) {
	t.plan(1);

	var template = {
		'Fn::Equals': [
			1,
			1,
		],
	};

	var reducer = new CfnReducer(template);
	var reduced = reducer.reduce();

	var expected = true;

	t.deepEqual(reduced, expected);
});

test('Fn::Equals', function (t) {
	t.plan(1);

	var template = {
		'Fn::Equals': [
			'value',
			'other-value',
		],
	};

	var reducer = new CfnReducer(template);
	var reduced = reducer.reduce();

	var expected = false;

	t.deepEqual(reduced, expected);
});

test('Fn::Equals', function (t) {
	t.plan(1);

	var template = {
		'Fn::Equals': [
			'value',
			{
				'Ref': 'SomeRef',
			},
		],
	};

	var reducer = new CfnReducer(template);
	var reduced = reducer.reduce();

	var expected = template;

	t.deepEqual(reduced, expected);
});
