cfn-reducer
===========

Reduces your way too complex CloudFormation templates into something you can put
under version control.


## Why?

Because before you start using Troposphere, your CloudFormation templates can turn
to unreadable, unverifiable JSON spaghetti. Passing parameters into your template
can help you flatten out all the messy logic within the template, letting you generate
specific files for different purposes (like staging/production) and put these under
version control.


## Install

```bash
$ npm install cfn-reducer
```


## Usage: Command Line

The command line reducer accepts a path to a CloudFormation template and optional
key-value pairs of stack parameters. Output goes to stdout and can be redirected
to a file.

```bash
$ ./node_modules/bin/cfn-reducer \
	MyTemplate.template \
		MyParam1=some-value-1 \
		MyParam2=some-value-2 \
	> MyReducedTemplate.template
```


## Usage: Programmatically

```js
var fs = require('fs');
var CfnReducer = require('cfn-reducer');

// Load your template into an object.
var file = 'MyTemplate.template';
var template = JSON.parse(fs.readFileSync(file));

// Specify necessary parameters.
var stackParams = {
	MyParam1: 'some-value-1',
	MyParam2: 'some-value-2',
};

// Run the reducer.
var options = {
	stackParams: stackParams,
};
var reducer = new CfnReducer(template, options);
var reduced = reducer.reduce();

// Show me the magic!
var output = JSON.stringify(reduced, null, '\t');
console.log(output);
```


## Reductions Made

*Needs to be fleshed out.* Take a look at the `test` folder for now, and keep in mind
that all transformations are done recursively, until nothing more can be reduced.

### Replacements

- **Ref** - Substitutes all Refs that refer to parameters explicitly passed in.

### Simplifications

The following intrinsics will be simplified as much as possible.

- **Fn::And**
- **Fn::Equals**
- **Fn::FindInMap**
- **Fn::If**
- **Fn::Join**
- **Fn::Not**
- **Fn::Or**
- **Fn::Select**


## Todo

- Remove obsolete Conditions.
- Remove obsolete Mappings.
- Make CLI API more flexible.
- Integrate substacks.
