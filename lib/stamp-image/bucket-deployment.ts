import * as s3 from '@aws-cdk/aws-s3';
import * as s3deploy from '@aws-cdk/aws-s3-deployment';
import * as cdk from '@aws-cdk/core';

import * as path from 'path';

export interface StampImageBucketDeploymentProps {
    destinationBucket: s3.Bucket;
    source: string;
}

export class StampImageBucketDeployment extends s3deploy.BucketDeployment {
    constructor(scope: cdk.Construct, id: string, props: StampImageBucketDeploymentProps) {
        const { destinationBucket, source } = props;
        super(scope, id, {
            sources: [s3deploy.Source.asset(path.join(__dirname, `../../buckets/${source}`))],
            destinationBucket,
        });
    }
}
