import * as cdk from '@aws-cdk/core';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as lambda from '@aws-cdk/aws-lambda';

import * as path from 'path';

export class StampImageStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const handler = new lambda.Function(this, 'Function', {
            runtime: lambda.Runtime.NODEJS_12_X,
            code: lambda.Code.asset(path.join(__dirname, '../.aws-sam/build/StampImageFunction')),
            handler: 'app.handler',
        });

        const api = new apigateway.RestApi(this, 'Api', {
            restApiName: 'Stamp Image',
            description: 'This service stamps images.',
        });

        const lambdaIntegration = new apigateway.LambdaIntegration(handler, {
            requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
        });

        api.root.addMethod('GET', lambdaIntegration);
    }
}
