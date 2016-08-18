'use strict';

var test = require('tape');

var CfnReducer = require('rfr')('/src/CfnReducer');

test('Fn::FindInMap', function (t) {
	t.plan(1);

	var mappings = {
		'my-map': {
			'my-section': {
				'my-key-1': 'my-value-1',
				'my-key-2': 'my-value-2',
				'my-key-3': 'my-value-3',
			},
		},
	};

	var template = {
		Mappings: mappings,
		thing: {
			'Fn::FindInMap': [
				'my-map',
				'my-section',
				'my-key-2',
			],
		},
	};

	var reducer = new CfnReducer({
		template: template,
	});
	var reduced = reducer.reduce();

	var expected = {
		Mappings: mappings,
		thing: 'my-value-2',
	};

	t.deepEqual(reduced, expected);
});
