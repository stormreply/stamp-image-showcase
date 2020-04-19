import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import lambdaTester from 'lambda-tester';
import { handler } from '../../lambda/stamp-image';

describe('This is a simple test', () => {
    test('Check the hello function', async () => {
        const evt = {};
        await lambdaTester(handler)
            .event(evt as APIGatewayEvent)
            .expectResult((result: APIGatewayProxyResult) => {
                expect(result.statusCode).toBe(200);
                expect(JSON.parse(result.body)).toEqual({
                    message: 'Go Serverless Webpack (Typescript) v1.0! Your function executed successfully!',
                    input: evt,
                });
            });
    });
});
