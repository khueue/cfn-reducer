'use strict';

var test = require('tape');

var CfnReducer = require('rfr')('/src/CfnReducer');

test('Ref', function (t) {
	t.plan(1);

	var stackParams = {
		'my-param': 'my-value',
	};

	var template = {
		thing: {
			'Ref': 'my-param',
		},
	};

	var options = {
		stackParams: stackParams,
	};
	var reducer = new CfnReducer(template, options);
	var reduced = reducer.reduce();

	var expected = {
		thing: 'my-value',
	};

	t.deepEqual(reduced, expected);
});

test('Ref', function (t) {
	t.plan(1);

	var stackParams = {
		'my-param': 'my-value',
	};

	var template = {
		thing: {
			'Ref': 'my-some-undefined-param',
		},
	};

	var options = {
		stackParams: stackParams,
	};
	var reducer = new CfnReducer(template, options);
	var reduced = reducer.reduce();

	var expected = template;

	t.deepEqual(reduced, expected);
});
