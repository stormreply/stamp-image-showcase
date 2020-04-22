import * as lambda from '@aws-cdk/aws-lambda';
import * as s3 from '@aws-cdk/aws-s3';
import { S3EventSource } from '@aws-cdk/aws-lambda-event-sources';
import * as cdk from '@aws-cdk/core';

export interface StampImageBucketProps {
    handler: lambda.Function;
}

export class StampImageBucket extends s3.Bucket {
    constructor(scope: cdk.Construct, id: string, props: StampImageBucketProps) {
        super(scope, id, {
            encryption: s3.BucketEncryption.S3_MANAGED,
        });

        const { handler } = props;

        this.grantReadWrite(handler);

        handler.addEventSource(
            new S3EventSource(this, {
                events: [s3.EventType.OBJECT_CREATED],
                filters: [{ prefix: 'input/' }],
            }),
        );
    }
}
