'use strict';

var test = require('tape');

var CfnReducer = require('rfr')('/src/CfnReducer');

test('Fn::Join', function (t) {
	t.plan(1);

	var template = {
		thing: {
			'Fn::Join': [
				'.',
				[
					'value0',
					'value1',
				],
			],
		},
	};

	var reducer = new CfnReducer(template);
	var reduced = reducer.reduce();

	var expected = {
		thing: 'value0.value1',
	};

	t.deepEqual(reduced, expected);
});

test('Fn::Join', function (t) {
	t.plan(1);

	var template = {
		thing: {
			'Fn::Join': [
				'.',
				[
					'value0',
					'value1',
					{
						something: 'complicated',
					},
				],
			],
		},
	};

	var reducer = new CfnReducer(template);
	var reduced = reducer.reduce();

	var expected = template;

	t.deepEqual(reduced, expected);
});
