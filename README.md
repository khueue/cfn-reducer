cfn-reducer
===========

Reduces your way too complex CloudFormation templates into something you can understand
and verify *before* running it in production.


## Why?

Because before you start using Troposphere, your CloudFormation templates can turn
into unreadable, unverifiable JSON spaghetti. Passing parameters into your template
can help you flatten out all the messy logic within the template, letting you generate
specific files for different purposes (like staging/production) and put these under
version control. It can even integrate your sub-templates back into the main template.


## Install

```bash
$ npm install cfn-reducer
```


## Usage

```js
var fs = require('fs');
var CfnReducer = require('cfn-reducer');

// Create a reducer for your template, with optional parameters and sub-templates.
var reducer = new CfnReducer({
	template: JSON.parse(fs.readFileSync('./Template.template')), // Required.
	stackParams: {
		Param1: 'Value1',
		Param2: 'Value2',
	},
	subTemplates: {
		'TemplateURLToSubTemplate1': JSON.parse(fs.readFileSync('./SubTemplate1.template')),
		'TemplateURLToSubTemplate2': JSON.parse(fs.readFileSync('./SubTemplate2.template')),
	},
});

// Run it and display the reduced template.
var reduced = reducer.reduce();
var output = JSON.stringify(reduced, null, '\t');
console.log(output);
```


## Reductions Made

Reductions are made recursively, until nothing more can be reduced.

### References

All stack parameters passed to the reducer will be inserted in place of their
corresponding `Ref`s.

### Simplifications

The following intrinsic functions will be simplified as much as possible:

- `Fn::And`
- `Fn::Equals`
- `Fn::FindInMap`
- `Fn::If`
- `Fn::Join`
- `Fn::Not`
- `Fn::Or`
- `Fn::Select`

`Fn::And` will be reduced to `true` if both conditions can be evaluated to `true`,
`Fn::FindInMap` will be replaced by its `Mappings` lookup, `Fn::Join` will be
replaced by its concatenation if all arguments can be evaluated to strings, etc.

### Conditional Resources

A resource with a `Condition` that evaluates to `true` will have its `Condition` removed.
A resource with a `Condition` that evaluates to `false` will be removed altogether.

### Sub-Templates

Resources of type `AWS::CloudFormation::Stack` can be reduced and integrated back
into the main template. All things (conditions, mappings, outputs, resources) in the
sub-template will be prefixed with the resource's name when being integrated
back into the main template.

Sub-template integration is triggered when the `subTemplates` object is passed in,
containing the full template objects that `TemplateURL` references refer to.

### Clean Up

As a result of reductions and simplifications, certain parts of the template might
no longer be needed and are therefore removed:

- `Parameters` that were passed in as `stackParams`.
- `Mappings` that have been resolved and are no longer referenced.
- `Conditions` that have been evaluated and inlined.

Top-level keys that have become empty are removed.


## Todo

- Refactor the code.
- Make name-prefixing more robust.
