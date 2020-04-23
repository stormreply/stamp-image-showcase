import * as cdk from '@aws-cdk/core';

import { StampImageLamnbda } from './stamp-image';

export class StampImageStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // 1. Create lambda function for stamping images
        new StampImageLamnbda(this, 'Function', {
            functionName: 'StampImageFunction',
            handler: 'app.handler',
            timeout: cdk.Duration.seconds(60),
            memorySize: 1024,
        });
    }
}
