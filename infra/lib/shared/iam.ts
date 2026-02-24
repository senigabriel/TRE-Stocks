import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

export function dynamoWritePolicy(table: Table): PolicyStatement {
  return new PolicyStatement({
    actions: ['dynamodb:PutItem'],
    resources: [table.tableArn],
  });
}

export function dynamoReadPolicy(table: Table): PolicyStatement {
  return new PolicyStatement({
    actions: ['dynamodb:Query', 'dynamodb:Scan'],
    resources: [table.tableArn],
  });
}
