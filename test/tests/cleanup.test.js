'use strict';

var test = require('tape');

var CfnReducer = require('rfr')('/src/CfnReducer');

test('cleanup parameters', function (t) {
	t.plan(1);

	var parameters = {
		'MyParam1': {
			'something': 'complex',
		},
		'MyParam2': {
			'something': 'complex',
		},
	};

	var template = {
		Parameters: parameters,
		Resources: {
			thing: {
				'Ref': 'MyParam2',
			},
		},
	};

	var reducer = new CfnReducer({
		template: template,
		stackParams: {
			'MyParam1': 'my-value',
		},
	});
	var reduced = reducer.reduce();

	var expected = {
		Parameters: {
			'MyParam2': {
				'something': 'complex',
			},
		},
		Resources: {
			thing: {
				'Ref': 'MyParam2',
			},
		},
	};

	t.deepEqual(reduced, expected);
});

test('cleanup parameters', function (t) {
	t.plan(1);

	var parameters = {
		'MyParam1': {
			'something': 'complex',
		},
		'MyParam2': {
			'something': 'complex',
		},
	};

	var template = {
		Parameters: parameters,
		Resources: {
			thing: {},
		},
	};

	var reducer = new CfnReducer({
		template: template,
		stackParams: {
			'MyParam1': 'my-value',
			'MyParam2': 'my-value',
		},
	});
	var reduced = reducer.reduce();

	var expected = {
		Resources: {
			thing: {},
		},
	};

	t.deepEqual(reduced, expected);
});
