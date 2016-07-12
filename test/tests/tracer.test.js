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
		tracer: tracer,
	};
	var reducer = new CfnReducer(template, options);
	var reduced = reducer.reduce();

	var expected = {
		thing: 'my-value',
	};

	t.assert(traces.length === 1);

	t.deepEqual(reduced, expected);
});
