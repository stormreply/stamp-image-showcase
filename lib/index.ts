import * as cdk from '@aws-cdk/core';

import { StampImageLamnbda, StampImageBucket } from './stamp-image';

export class StampImageStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // 1. Create lambda function for stamping images
        const handler = new StampImageLamnbda(this, 'Function', {
            functionName: 'StampImageFunction',
            handler: 'app.handler',
            timeout: cdk.Duration.seconds(60),
            memorySize: 1024,
        });

        // 2. Create s3 bucket as image source and target
        new StampImageBucket(this, 'Bucket', {
            handler,
        });
    }
}
