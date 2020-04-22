import * as async from 'async';
import * as fs from 'fs';
import * as lambda from 'aws-lambda';
import aws from 'aws-sdk';
import * as gm from 'gm';
import * as util from 'util';

import 'source-map-support/register';

const downloadTemporaryFile = (s3client: aws.S3, Bucket: string, Key: string, callback: Function): void => {
    const filename = '/tmp/' + Key;
    console.info(`Downloading file ${Bucket}/${Key}`);
    const outputStream = fs.createWriteStream(filename);
    const inputStream = s3client
        .getObject({
            Bucket,
            Key,
        })
        .createReadStream();
    console.info(`Writing file to ${filename}`);
    inputStream.pipe(outputStream);
    // Then monitor the events
    inputStream
        .on('end', function () {
            console.info(`Successfully downloaded file ${Bucket}/${Key} to ${filename}`);
            callback(null, filename);
        })
        .on('error', function (err) {
            console.error(`Unable to download file ${Bucket}/${Key} and to ${filename} due to an error: ${err}`);
            callback(err);
        });
};

const getObjectOutput = (
    s3client: aws.S3,
    Bucket: string,
    Key: string,
    callback: (err: aws.AWSError, data: aws.S3.GetObjectOutput) => void,
): void => {
    console.info(`Downloading file ${Bucket}/${Key}`);
    s3client.getObject(
        {
            Bucket,
            Key,
        },
        callback,
    );
};

const stampImage = (
    response: aws.S3.GetObjectOutput,
    stampFilename: string,
    imageType: string,
    callback: Function,
): void => {
    const { Body, ContentType } = response;
    console.info(`Stamping image (${imageType}) with ${stampFilename}`);
    gm.subClass({ imageMagick: true })(Body as Buffer)
        // eslint-disable-next-line
        // @ts-ignore
        .composite(stampFilename)
        .gravity('SouthEast')
        .geometry('+50+50')
        .toBuffer(imageType, (err: Error, buffer: Buffer) => {
            if (err) {
                console.error(`Unable to stamp image (${imageType}) with ${stampFilename} due to an error: ${err}`);
                callback(err);
            } else {
                console.info(`Successfully stamped image (${imageType}) with ${stampFilename}`);
                callback(null, ContentType, buffer);
            }
        });
};

const uploadObject = (
    s3client: aws.S3,
    Bucket: string,
    Key: string,
    ContentType: string,
    Body: Buffer,
    callback: (err: aws.AWSError, data: aws.S3.PutObjectOutput) => void,
): void => {
    console.info(`Uploading file ${Bucket}/${Key} (${ContentType})`);
    s3client.putObject(
        {
            Bucket,
            Key,
            Body,
            ContentType,
        },
        callback,
    );
};

export const handler: lambda.S3Handler = async (event) => {
    // Read options from the event.
    console.info('Reading options from event:\n', util.inspect(event, { depth: 5 }));

    const bucket = event.Records[0].s3.bucket.name;

    // Object key may have spaces or unicode non-ASCII characters.
    const source = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    const target = source.replace(/^(input)/, 'output');

    // Infer the image type.
    const typeMatch = source.match(/\.([^.]*)$/);
    if (!typeMatch) {
        return Promise.reject('Could not determine the image type.');
    }
    const imageType = typeMatch[1];
    if (imageType != 'jpg' && imageType != 'png') {
        return Promise.reject('Unsupported image type: ${imageType}');
    }

    // get reference to S3 client
    const s3client = new aws.S3();

    return new Promise<void>((resolve, reject) => {
        async.parallel(
            {
                inputFile: async.apply(getObjectOutput, s3client, bucket, source),
                stampFile: async.apply(downloadTemporaryFile, s3client, bucket, 'storm.png'),
            },
            (err, results) => {
                if (err) {
                    reject(`Unable to download ${bucket}/${source} and ${bucket}/storm.png due to an error: ${err}`);
                } else {
                    // Download the image from transform, and upload to a different S3 bucket.
                    return async.waterfall(
                        [
                            async.apply(stampImage, results.inputFile, results.stampFile, imageType),
                            async.apply(uploadObject, s3client, bucket, target),
                        ],
                        (err) => {
                            if (err) {
                                reject(
                                    `Unable to watermark ${bucket}/${source} and upload to ${bucket}/${target} due to an error: ${err}`,
                                );
                            } else {
                                console.info(
                                    `Successfully watermarked ${bucket}/${source} and uploaded to ${bucket}/${target}`,
                                );
                                resolve();
                            }
                        },
                    );
                }
            },
        );
    });
};
