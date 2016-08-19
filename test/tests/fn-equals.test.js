'use strict';

var test = require('tape');

var CfnReducer = require('rfr')('/src/CfnReducer');

test('Fn::Equals', function (t) {
	t.plan(1);

	var template = {
		Resources: {
			thing: {
				'Fn::Equals': [
					'value',
					'value',
				],
			},
		},
	};

	var reducer = new CfnReducer({
		template: template,
	});
	var reduced = reducer.reduce();

	var expected = {
		Resources: {
			thing: true,
		},
	};

	t.deepEqual(reduced, expected);
});

test('Fn::Equals', function (t) {
	t.plan(1);

	var template = {
		Resources: {
			thing: {
				'Fn::Equals': [
					1,
					1,
				],
			},
		},
	};

	var reducer = new CfnReducer({
		template: template,
	});
	var reduced = reducer.reduce();

	var expected = {
		Resources: {
			thing: true,
		},
	};

	t.deepEqual(reduced, expected);
});

test('Fn::Equals', function (t) {
	t.plan(1);

	var template = {
		Resources: {
			thing: {
				'Fn::Equals': [
					'value',
					'other-value',
				],
			},
		},
	};

	var reducer = new CfnReducer({
		template: template,
	});
	var reduced = reducer.reduce();

	var expected = {
		Resources: {
			thing: false,
		},
	};

	t.deepEqual(reduced, expected);
});

test('Fn::Equals', function (t) {
	t.plan(1);

	var template = {
		Resources: {
			thing: {
				'Fn::Equals': [
					'value',
					{
						'Ref': 'SomeRef',
					},
				],
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

test('Fn::Equals - toggled off', function (t) {
	t.plan(1);

	var template = {
		Resources: {
			thing: {
				'Fn::Equals': [
					'value',
					'other-value',
				],
			},
		},
	};

	var reducer = new CfnReducer({
		template: template,
		settings: {
			reduceFnEquals: false,
		},
	});
	var reduced = reducer.reduce();

	var expected = template;

	t.deepEqual(reduced, expected);
});
