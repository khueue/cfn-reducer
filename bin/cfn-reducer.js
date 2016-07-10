#!/usr/bin/env node

'use strict';

var fs = require('fs');

var CfnReducer = require('../src/CfnReducer');

var file = process.argv[2];
if (!file) {
	console.error('Usage: cfn-reducer <in.template> [Param1=Value1 ...]');
	process.exit(1);
}
var template = JSON.parse(fs.readFileSync(file));

var stackParams = {};

process.argv.slice(3).forEach(function (pair) {
	var parts = pair.split('=');
	stackParams[parts[0]] = parts[1];
});

var reducer = new CfnReducer(template, stackParams);
var reduced = reducer.reduce();

var output = JSON.stringify(reduced, null, '\t');
console.log(output);
