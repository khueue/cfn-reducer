'use strict';

var test = require('tape');

var CfnReducer = require('rfr')('/src/CfnReducer');

test('Ref', function (t) {
	t.plan(1);

	var template = {
		Resources: {
			thing: {
				'Ref': 'my-param',
			},
		},
	};

	var stackParams = {
		'my-param': 'my-value',
	};

	var reducer = new CfnReducer({
		template: template,
		stackParams: stackParams,
	});
	var reduced = reducer.reduce();

	var expected = {
		Resources: {
			thing: 'my-value',
		},
	};

	t.deepEqual(reduced, expected);
});

test('Ref', function (t) {
	t.plan(1);

	var template = {
		Resources: {
			thing: {
				'Ref': 'my-some-undefined-param',
			},
		},
	};

	var stackParams = {
		'my-param': 'my-value',
	};

	var reducer = new CfnReducer({
		template: template,
		stackParams: stackParams,
	});
	var reduced = reducer.reduce();

	var expected = template;

	t.deepEqual(reduced, expected);
});

test('Ref', function (t) {
	t.plan(1);

	var template = {
		Resources: {
			thing: {
				'Ref': 'my-param',
			},
		},
	};

	var stackParams = {
		'my-param': {
			'something': 'complex',
		},
	};

	var reducer = new CfnReducer({
		template: template,
		stackParams: stackParams,
	});
	var reduced = reducer.reduce();

	var expected = template;

	t.deepEqual(reduced, expected);
});
