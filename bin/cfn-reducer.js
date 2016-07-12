#!/usr/bin/env node

'use strict';

var TRACE_REDUCTIONS = false;
var INDENT_STRING = '\t';

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

var options = {};
options.stackParams = stackParams;

if (TRACE_REDUCTIONS) {
	var bunyan = require('bunyan');
	var logger = bunyan.createLogger({
		name: 'cfn-reducer',
		streams: [
			{
				stream: process.stderr,
				level: 'info',
			},
		],
	});
	options.tracer = logger;
}

var reducer = new CfnReducer(template, options);
var reduced = reducer.reduce();

var output = JSON.stringify(reduced, null, INDENT_STRING);
console.log(output);
