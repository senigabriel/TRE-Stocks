import { App } from 'aws-cdk-lib';
import { StorageStack } from '../lib/storage-stack';
import { IngestionStack } from '../lib/ingestion-stack';
import { ApiStack } from '../lib/api-stack';
import { FrontendStack } from '../lib/frontend-stack';

const app = new App();

const storageStack = new StorageStack(app, 'StorageStack');

new IngestionStack(app, 'IngestionStack', {
  moversTable: storageStack.moversTable,
});

new ApiStack(app, 'TreStocksApiStack', {
  moversTable: storageStack.moversTable,
});

new FrontendStack(app, 'TreStocksFrontendStack');
