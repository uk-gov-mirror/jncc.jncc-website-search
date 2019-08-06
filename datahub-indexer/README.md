# Local development

## Localstack

Start localstack

    cd localstack
    docker-compose up

## lambda

    aws lambda create-function --function-name test-function --zip-file fileb://function.zip --handler handler.handler --runtime python3.7 --role arn:aws:iam::000000000000:role/irrelevant --endpoint http://localhost:4574

## DynamoDB admin

In a different terminal, add a GUI to your local dynamodb to make setting up the tables/records easier. See https://www.npmjs.com/package/dynamodb-admin

    npm install dynamodb-admin -g
    set DYNAMO_ENDPOINT=http://localhost:4569
    dynamodb-admin

Set up a table and records in http://localhost:8001

## datahub-indexer

In another terminal, run the indexer

    dotnet restore
    dotnet build

To run the indexer against all assets in the db

    dotnet run

To run the indexer against a single asset

    dotnet run --assetId id-here