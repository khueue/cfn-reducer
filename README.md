cfn-reducer
===========

Reduces your way too complex CloudFormation templates into something you can understand
and verify *before* running it in production.


## Why?

Because before you start using Troposphere, your CloudFormation templates can turn
into unreadable, unverifiable JSON spaghetti. Passing parameters into your template
can help you flatten out all the messy logic within the template, letting you generate
specific files for different purposes (like staging/production) and put these under
version control. It can even integrate your sub-templates back into the template.


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

*Needs to be fleshed out.* Take a look at the `test` folder for now, and keep in mind
that all transformations are done recursively, until nothing more can be reduced.

### References

All stack parameters passed to the reducer will be inserted in place of their
corresponding Refs.

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

### Conditional Resources

A resource with a `Condition` that evaluates to `true` will have its `Condition` removed.
A resource with a `Condition` that evaluates to `false` will be removed altogether.

### Sub-Templates

Resources of type `AWS::CloudFormation::Stack` can be reduced and integrated back
into the main template. All things (conditions, mappings, outputs, resources) from the
sub-template will be prefixed with the resource's name when being integrated
back into the main template.

Sub-template integration is triggered when the `subTemplates` object is passed in,
containing the full template objects that `TemplateURL` references refer to.

### Clean Up

As a result of reductions and simplifications, certain parts of the template might
no longer be needed and are therefore be removed:

- `Parameters` that were passed in as `stackParams`.
- ***NOT IMPLEMENTED*** `Mappings` that have been resolved and are no longer referenced.
- ***NOT IMPLEMENTED*** `Conditions` that have been evaluated and inlined.


## Todo

- Remove obsolete Conditions.
- Remove obsolete Mappings.
- Feature-toggle all reductions.
