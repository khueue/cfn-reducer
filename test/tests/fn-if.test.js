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
		Resources: {
			thing: {
				'Fn::If': [
					'my-cond',
					'on-true',
					'on-false',
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
			thing: 'on-true',
		},
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
		Resources: {
			thing: {
				'Fn::If': [
					'my-cond',
					'on-true',
					'on-false',
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
			thing: 'on-false',
		},
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
		Resources: {
			thing: {
				'Fn::If': [
					'my-cond',
					'on-true',
					'on-false',
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

test('Fn::If - toggled off', function (t) {
	t.plan(1);

	var conditions = {
		'my-cond': true,
	};

	var template = {
		Conditions: conditions,
		Resources: {
			thing: {
				'Fn::If': [
					'my-cond',
					'on-true',
					'on-false',
				],
			},
		},
	};

	var reducer = new CfnReducer({
		template: template,
		settings: {
			reduceFnIf: false,
		},
	});
	var reduced = reducer.reduce();

	var expected = template;

	t.deepEqual(reduced, expected);
});
