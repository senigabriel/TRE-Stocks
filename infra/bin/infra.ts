#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { IngestionStack } from '../lib/ingestion-stack';

const app = new cdk.App();

new IngestionStack(app, 'TreStocksIngestionStack');
