'use strict';

var test = require('tape');

var CfnReducer = require('rfr')('/src/CfnReducer');

test('Fn::Or', function (t) {
	t.plan(1);

	var template = {
		Resources: {
			thing: {
				'Fn::Or': [
					{
						something: 'complicated',
					},
					true,
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

test('Fn::Or', function (t) {
	t.plan(1);

	var template = {
		Resources: {
			thing: {
				'Fn::Or': [
					{
						something: 'complicated',
					},
					false,
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

test('Fn::Or', function (t) {
	t.plan(1);

	var template = {
		Resources: {
			thing: {
				'Fn::Or': [
					{
						something: 'complicated',
					},
					true,
				],
			},
		},
	};

	var reducer = new CfnReducer({
		template: template,
		settings: {
			reduceFnOr: false,
		},
	});
	var reduced = reducer.reduce();

	var expected = template;

	t.deepEqual(reduced, expected);
});
