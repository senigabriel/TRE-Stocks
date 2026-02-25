import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { MoversTable } from './shared/dynamodb';
import { dynamoWritePolicy } from './shared/iam';

export class IngestionStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const moversTable = new MoversTable(this, 'MoversTable');

    const ingestionLambda = new lambda.Function(this, 'IngestionLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset('../lambdas/ingestion'),
      environment: {
        TABLE_NAME: moversTable.table.tableName,
	MASSIVE_API_KEY: process.env.MASSIVE_API_KEY ?? 'PLACEHOLDER',
      },
    });

//event bridge rule
	new events.Rule(this, 'DailyStockIngestionRule', {
  	schedule: events.Schedule.cron({
    	minute: '0',
    	hour: '22', // 10 PM UTC ≈ market closed in US
  	}),
  	targets: [new targets.LambdaFunction(ingestionLambda)],
	});

    ingestionLambda.addToRolePolicy(
      dynamoWritePolicy(moversTable.table)
    );
  }
}

