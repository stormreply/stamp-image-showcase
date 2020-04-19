#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { StampImageStack } from '../lib';

const app = new cdk.App();
new StampImageStack(app, 'StampImage');
