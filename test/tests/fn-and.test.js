'use strict';

var test = require('tape');

var CfnReducer = require('rfr')('/src/CfnReducer');

test('Fn::And', function (t) {
	t.plan(1);

	var template = {
		'Fn::And': [
			true,
			'value',
		],
	};

	var reducer = new CfnReducer({
		template: template,
	});
	var reduced = reducer.reduce();

	var expected = 'value';

	t.deepEqual(reduced, expected);
});

test('Fn::And', function (t) {
	t.plan(1);

	var template = {
		'Fn::And': [
			'value',
			true,
		],
	};

	var reducer = new CfnReducer({
		template: template,
	});
	var reduced = reducer.reduce();

	var expected = 'value';

	t.deepEqual(reduced, expected);
});

test('Fn::And', function (t) {
	t.plan(1);

	var template = {
		'Fn::And': [
			false,
			'value',
		],
	};

	var reducer = new CfnReducer({
		template: template,
	});
	var reduced = reducer.reduce();

	var expected = false;

	t.deepEqual(reduced, expected);
});

test('Fn::And', function (t) {
	t.plan(1);

	var template = {
		'Fn::And': [
			'value',
			false,
		],
	};

	var reducer = new CfnReducer({
		template: template,
	});
	var reduced = reducer.reduce();

	var expected = false;

	t.deepEqual(reduced, expected);
});

test('Fn::And', function (t) {
	t.plan(1);

	var template = {
		'Fn::And': [
			true,
			true,
		],
	};

	var reducer = new CfnReducer({
		template: template,
	});
	var reduced = reducer.reduce();

	var expected = true;

	t.deepEqual(reduced, expected);
});

test('Fn::And', function (t) {
	t.plan(1);

	var template = {
		'Fn::And': [
			true,
			false,
		],
	};

	var reducer = new CfnReducer({
		template: template,
	});
	var reduced = reducer.reduce();

	var expected = false;

	t.deepEqual(reduced, expected);
});

test('Fn::And', function (t) {
	t.plan(1);

	var template = {
		'Fn::And': [
			false,
			true,
		],
	};

	var reducer = new CfnReducer({
		template: template,
	});
	var reduced = reducer.reduce();

	var expected = false;

	t.deepEqual(reduced, expected);
});

test('Fn::And', function (t) {
	t.plan(1);

	var template = {
		'Fn::And': [
			'value',
			'value',
		],
	};

	var reducer = new CfnReducer({
		template: template,
	});
	var reduced = reducer.reduce();

	var expected = template;

	t.deepEqual(reduced, expected);
});

test('Fn::And - toggled off', function (t) {
	t.plan(1);

	var template = {
		'Fn::And': [
			true,
			true,
		],
	};

	var reducer = new CfnReducer({
		template: template,
		settings: {
			reduceFnAnd: false,
		},
	});
	var reduced = reducer.reduce();

	var expected = template;

	t.deepEqual(reduced, expected);
});
