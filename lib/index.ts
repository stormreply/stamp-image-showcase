import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as sam from '@aws-cdk/aws-sam';
import * as s3 from '@aws-cdk/aws-s3';
import { S3EventSource } from '@aws-cdk/aws-lambda-event-sources';
import * as s3deploy from '@aws-cdk/aws-s3-deployment';

import * as path from 'path';

export class StampImageStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const bucket = new s3.Bucket(this, 'Bucket', {
            encryption: s3.BucketEncryption.S3_MANAGED,
        });

        new s3deploy.BucketDeployment(this, 'DeployWebsite', {
            sources: [s3deploy.Source.asset(path.join(__dirname, '../buckets/stamp-image'))],
            destinationBucket: bucket,
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

        const handler = new lambda.Function(this, 'Function', {
            runtime: lambda.Runtime.NODEJS_10_X,
            code: lambda.Code.asset(path.join(__dirname, '../.aws-sam/build/StampImageFunction')),
            handler: 'app.handler',
            layers: [layerVersion],
            timeout: cdk.Duration.seconds(60),
            memorySize: 1024,
        });

        handler.addEventSource(
            new S3EventSource(bucket, {
                events: [s3.EventType.OBJECT_CREATED],
                filters: [{ prefix: 'input/' }],
            }),
        );

        bucket.grantReadWrite(handler);
    }
}
