#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { IngestionStack } from '../lib/ingestion-stack';
// We’ll add these later
// import { ApiStack } from '../lib/api-stack';
// import { FrontendStack } from '../lib/frontend-stack';

const app = new cdk.App();

new IngestionStack(app, 'TreStocksIngestionStack');

// These will be enabled as we build them
// new ApiStack(app, 'TreStocksApiStack');
// new FrontendStack(app, 'TreStocksFrontendStack');
