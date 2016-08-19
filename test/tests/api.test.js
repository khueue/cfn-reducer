'use strict';

var test = require('tape');

var CfnReducer = require('rfr')('/src/CfnReducer');

test('invalid construction', function (t) {
	t.plan(1);

	var badCreate = function () {
		new CfnReducer();
	};

	t.throws(badCreate);
});
