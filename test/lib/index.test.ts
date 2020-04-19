import { SynthUtils } from '@aws-cdk/assert';

import * as cdk from '@aws-cdk/core';

import { StampImageStack } from '../../lib';

test('Stack Snapshot', () => {
    const app = new cdk.App();

    // WHEN

    const stack = new StampImageStack(app, 'MyTestStack');

    // THEN

    expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});
