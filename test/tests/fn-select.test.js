'use strict';

var test = require('tape');

var CfnReducer = require('rfr')('/src/CfnReducer');

test('Fn::Select', function (t) {
	t.plan(1);

	var template = {
		Resources: {
			thing: {
				'Fn::Select': [
					0,
					'value0,value1',
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
			thing: 'value0',
		},
	};

	t.deepEqual(reduced, expected);
});

test('Fn::Select', function (t) {
	t.plan(1);

	var template = {
		Resources: {
			thing: {
				'Fn::Select': [
					1,
					'value0,value1',
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
			thing: 'value1',
		},
	};

	t.deepEqual(reduced, expected);
});

test('Fn::Select', function (t) {
	t.plan(1);

	var template = {
		Resources: {
			thing: {
				'Fn::Select': [
					1,
					{
						something: 'complicated',
					},
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

test('Fn::Select', function (t) {
	t.plan(1);

	var template = {
		Resources: {
			thing: {
				'Fn::Select': [
					{
						Ref: 'ref-for-index',
					},
					'value0,value1',
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

test('Fn::Select - toggled off', function (t) {
	t.plan(1);

	var template = {
		Resources: {
			thing: {
				'Fn::Select': [
					0,
					'value0,value1',
				],
			},
		},
	};

	var reducer = new CfnReducer({
		template: template,
		settings: {
			reduceFnSelect: false,
		},
	});
	var reduced = reducer.reduce();

	var expected = template;

	t.deepEqual(reduced, expected);
});
