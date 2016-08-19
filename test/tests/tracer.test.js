'use strict';

var test = require('tape');

var CfnReducer = require('rfr')('/src/CfnReducer');

test('tracer on', function (t) {
	t.plan(2);

	var traces = [];

	var tracer = {
		info: function (obj) {
			traces.push(obj);
		},
	};

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
		settings: {
			tracer: tracer,
		},
	});
	var reduced = reducer.reduce();

	var expected = {
		Resources: {
			thing: 'my-value',
		},
	};

	t.assert(traces.length === 1);

	t.deepEqual(reduced, expected);
});
