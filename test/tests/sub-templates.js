'use strict';

var test = require('tape');

var CfnReducer = require('rfr')('/src/CfnReducer');

test('sub-templates', function (t) {
	t.plan(1);

	var template = {
		Parameters: {
			'MyParam': 'complex',
		},
		Resources: {
			MyThing: {
				'Ref': 'MyParam',
			},
			MySubTemplate: {
				Type: 'AWS::CloudFormation::Stack',
				Properties: {
					TemplateURL: 'MyTemplateUrl1',
				},
			},
		},
	};

	var subTemplate1 = {
		Parameters: {
			'MyParam': 'complex',
		},
		Conditions: {
			'MyIfCondition': 'complex',
			'MyResourceCondition': 'complex',
		},
		Resources: {
			MyThing1: {
				'Condition': 'MyResourceCondition',
			},
			MyThing2: {
				'Ref': 'MyParam',
			},
			MyThing3: {
				'Fn::If': [
					'MyIfCondition',
					'on-true',
					'on-false',
				],
			},
		},
	};

	var reducer = new CfnReducer({
		template: template,
		subTemplates: {
			'MyTemplateUrl1': subTemplate1,
		},
	});
	var reduced = reducer.reduce();

	var expected = {
		Parameters: {
			'MyParam': 'complex',
			'MySubTemplateMyParam': 'complex',
		},
		Conditions: {
			'MySubTemplateMyIfCondition': 'complex',
			'MySubTemplateMyResourceCondition': 'complex',
		},
		Resources: {
			MyThing: {
				'Ref': 'MyParam',
			},
			MySubTemplateMyThing1: {
				'Condition': 'MySubTemplateMyResourceCondition',
			},
			MySubTemplateMyThing2: {
				'Ref': 'MySubTemplateMyParam',
			},
			MySubTemplateMyThing3: {
				'Fn::If': [
					'MySubTemplateMyIfCondition',
					'on-true',
					'on-false',
				],
			},
		},
	};

	t.deepEqual(reduced, expected);
});
