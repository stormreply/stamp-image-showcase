import awsMock from 'aws-sdk-mock';
import aws from 'aws-sdk';
import { S3Event } from 'aws-lambda';
import lambdaTester from 'lambda-tester';
import { handler } from '../../lambda/stamp-image';
import fs from 'fs';
import path from 'path';
import { State } from 'gm';
import { PassThrough } from 'stream';

jest.mock('gm', () => {
    const subClass = jest.fn(() =>
        jest.fn((buffer: Buffer) => {
            const toBuffer = jest.fn();
            toBuffer.mockImplementation(
                (format: string, callback: (err: Error | null, buffer: Buffer) => void): PassThrough => {
                    console.log(`gm mock toBuffer called with ${format}`);
                    if (buffer.length > 0) {
                        callback(null, buffer);
                    } else {
                        callback(new Error('Empty buffer'), buffer);
                    }
                    const bufferStream = new PassThrough();
                    bufferStream.end(buffer);
                    return bufferStream;
                },
            );

            const state: State = {
                // eslint-disable-next-line
                // @ts-ignore
                composite: jest.fn(() => state),
                gravity: jest.fn(() => state),
                geometry: jest.fn(() => state),
                toBuffer,
            };
            return state;
        }),
    );
    return { subClass };
});

const mockAwsS3GetObject = (file: Buffer): void => {
    awsMock.mock('S3', 'getObject', (params: aws.S3.GetObjectRequest, callback: Function) => {
        console.log('S3 getObject mock called', params);
        callback(null, {
            Body: file,
            ContentType: 'image/png',
        });
        return file;
    });
};

const mockAwsS3PutObject = (): void => {
    awsMock.mock('S3', 'putObject', (params: aws.S3.PutObjectRequest, callback: Function) => {
        console.log('S3 putObject mock called', params);
        callback(null, { pk: 'foo', sk: 'bar' });
    });
};

const getS3Event = (name: string, key: string): S3Event => {
    return {
        Records: [
            {
                eventVersion: '2.1',
                eventSource: 'aws:s3',
                awsRegion: 'eu-central-1',
                eventTime: '2020-04-22T12:02:42.663Z',
                eventName: 'ObjectCreated:Put',
                userIdentity: { principalId: 'AWS:XXXXXXXXXXXXXXXX:username' },
                requestParameters: { sourceIPAddress: '0.0.0.0' },
                responseElements: {
                    'x-amz-request-id': 'XXXXXXXXXXXXXXXX',
                    'x-amz-id-2':
                        'Fcfa66bpGBhk1un5CRmWqFUkkap5i1p3PX64FPBQkA/PkqwzzLgUqWt7vYZECqPdsCyxDF3RxSygbJk49IuUG74CfAgSmFWy',
                },
                s3: {
                    s3SchemaVersion: '1.0',
                    configurationId: 'MmZlNzBiNzMtYzkwNi00Yzg4LWFlYmQtNjUzZDlmOWE0Yzhm',
                    bucket: {
                        name,
                        ownerIdentity: { principalId: 'XXXXXXXXXXXXXXXX' },
                        arn: `arn:aws:s3:::${name}`,
                    },
                    object: {
                        key,
                        size: 1024,
                        eTag: 'ac598b93a978bb51537e1d69a2d76754',
                        sequencer: '005EA03264F56AE7D2',
                    },
                },
            },
        ],
    };
};

describe('stamp image handler', () => {
    beforeEach(() => {
        awsMock.setSDKInstance(aws);
    });

    afterEach(() => {
        awsMock.restore();
    });

    test('succesfully stamped image', () => {
        mockAwsS3GetObject(fs.readFileSync(path.join(__dirname, 'dummy.png')));
        mockAwsS3PutObject();

        return lambdaTester(handler)
            .event(getS3Event('testbucket', 'input/test.png'))
            .expectResult(() => {
                // do nothing
            });
    });

    test('failed stamped image', () => {
        mockAwsS3GetObject(Buffer.alloc(0));
        mockAwsS3PutObject();

        return lambdaTester(handler)
            .event(getS3Event('testbucket', 'input/test.png'))
            .expectError(() => {
                // do nothing
            });
    });

    test('no mime type', () => {
        return lambdaTester(handler)
            .event(getS3Event('testbucket', 'input/test'))
            .expectError(() => {
                // do nothing
            });
    });

    test('unsupported mime type', () => {
        return lambdaTester(handler)
            .event(getS3Event('testbucket', 'input/test.bmp'))
            .expectError(() => {
                // do nothing
            });
    });
});
