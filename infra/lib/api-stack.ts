import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import { MoversTable } from './shared/dynamodb';

interface ApiStackProps extends StackProps {
  moversTable: MoversTable;
}

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const moversTable = props.moversTable;

    const readMoversLambda = new lambda.Function(this, 'ReadMoversLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset('../lambdas/read-movers'),
      environment: {
        TABLE_NAME: moversTable.table.tableName,
      },
    });

    moversTable.table.grantReadData(readMoversLambda);

const api = new apigw.RestApi(this, 'MoversApi', {
  restApiName: 'Stock Movers API',
  defaultCorsPreflightOptions: {
    allowOrigins: apigw.Cors.ALL_ORIGINS, // tighten later
    allowMethods: ['GET'],
  },
});

    const movers = api.root.addResource('movers');
	movers.addMethod(
  'GET',
  new apigw.LambdaIntegration(readMoversLambda),
  {
    authorizationType: apigw.AuthorizationType.NONE,
    apiKeyRequired: false,
  }
);
  }
}
