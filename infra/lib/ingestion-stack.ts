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
      },
    });

    ingestionLambda.addToRolePolicy(
      dynamoWritePolicy(moversTable.table)
    );
  }
}
