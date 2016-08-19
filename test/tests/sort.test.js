'use strict';

var test = require('tape');

var CfnReducer = require('rfr')('/src/CfnReducer');

test('sort keys - toggled off', function (t) {
	t.plan(1);

	var template = {
		Resources: {
			b: {
				'Ref': 'my-param-b',
			},
			a: {
				'Ref': 'my-param-a',
			},
		},
	};

	var reducer = new CfnReducer({
		template: template,
		settings: {
			sortKeys: false,
		},
	});
	var reduced = reducer.reduce();

	var expected = template;

	t.equals(JSON.stringify(reduced), JSON.stringify(expected));
});

test('sort keys - toggled on', function (t) {
	t.plan(1);

	var template = {
		Resources: {
			b: {
				'Ref': 'my-param-b',
			},
			a: {
				'Ref': 'my-param-a',
			},
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
		Resources: {
			a: {
				'Ref': 'my-param-a',
			},
			b: {
				'Ref': 'my-param-b',
			},
		},
	};

	t.equals(JSON.stringify(reduced), JSON.stringify(expected));
});
