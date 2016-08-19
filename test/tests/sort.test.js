'use strict';

var test = require('tape');

var CfnReducer = require('rfr')('/src/CfnReducer');

test('sort keys', function (t) {
	t.plan(1);

	var template = {
		b: {
			'Ref': 'my-param-b',
		},
		a: {
			'Ref': 'my-param-a',
		},
	};

	var reducer = new CfnReducer({
		template: template,
		settings: {
			sortKeys: true,
		},
	});
	var reduced = reducer.reduce();

	var expected = {
		a: {
			'Ref': 'my-param-a',
		},
		b: {
			'Ref': 'my-param-b',
		},
	};

	t.equals(JSON.stringify(reduced), JSON.stringify(expected));
});
