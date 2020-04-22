import * as lambda from '@aws-cdk/aws-lambda';
import * as sam from '@aws-cdk/aws-sam';
import * as cdk from '@aws-cdk/core';

import * as path from 'path';

export interface StampImageLamnbdaProps {
    functionName: string;
    handler: string;
    timeout: cdk.Duration;
    memorySize: number;
}

export class StampImageLamnbda extends lambda.Function {
    constructor(scope: cdk.Construct, id: string, props: StampImageLamnbdaProps) {
        const { functionName, handler, memorySize, timeout } = props;
        super(scope, id, {
            runtime: lambda.Runtime.NODEJS_10_X,
            code: lambda.Code.asset(path.join(__dirname, `../../.aws-sam/build/${functionName}`)),
            handler,
            memorySize,
            timeout,
        });

        const application = new sam.CfnApplication(this, 'Application', {
            location: {
                applicationId: 'arn:aws:serverlessrepo:us-east-1:145266761615:applications/image-magick-lambda-layer',
                semanticVersion: '1.0.0',
            },
        });

        const layerVersion = lambda.LayerVersion.fromLayerVersionArn(
            this,
            'LayerVersion',
            application.getAtt('Outputs.LayerVersion').toString(),
        );

        this.addLayers(layerVersion);
    }
}
