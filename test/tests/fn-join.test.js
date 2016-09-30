'use strict';

var test = require('tape');

var CfnReducer = require('rfr')('/src/CfnReducer');

test('Fn::Join', function (t) {
	t.plan(1);

	var template = {
		Resources: {
			thing: {
				'Fn::Join': [
					'.',
					[
						'value0',
						'value1',
					],
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
			thing: 'value0.value1',
		},
	};

	t.deepEqual(reduced, expected);
});

test('Fn::Join', function (t) {
	t.plan(1);

	var template = {
		Resources: {
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
		},
	};

	var reducer = new CfnReducer({
		template: template,
	});
	var reduced = reducer.reduce();

	var expected = template;

	t.deepEqual(reduced, expected);
});

test('Fn::Join', function (t) {
	t.plan(1);

	var template = {
		Resources: {
			thing: {
				'Fn::Join': [
					'.',
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
			thing: 'value0,value1',
		},
	};

	t.deepEqual(reduced, expected);
});

test('Fn::Join', function (t) {
	t.plan(1);

	var template = {
		Resources: {
			thing: {
				'Fn::Join': [
					'.',
					[],
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
			thing: '',
		},
	};

	t.deepEqual(reduced, expected);
});

test('Fn::Join', function (t) {
	t.plan(1);

	var template = {
		Resources: {
			thing: {
				'Fn::Join': [
					'.',
					[
						'value',
					],
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
			thing: 'value',
		},
	};

	t.deepEqual(reduced, expected);
});

test('Fn::Join', function (t) {
	t.plan(1);

	var template = {
		Resources: {
			thing: {
				'Fn::Join': [
					'.',
					{
						Ref: 'my-compound-ref',
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

test('Fn::Join - toggled off', function (t) {
	t.plan(1);

	var template = {
		Resources: {
			thing: {
				'Fn::Join': [
					'.',
					[
						'value0',
						'value1',
					],
				],
			},
		},
	};

	var reducer = new CfnReducer({
		template: template,
		settings: {
			reduceFnJoin: false,
		},
	});
	var reduced = reducer.reduce();

	var expected = template;

	t.deepEqual(reduced, expected);
});
