# Local development

NB Trying to start localstack with an openvpn service running will cause the following error:
   ERROR: could not find an available, non-overlapping IPv4 address pool

## Install sam local

   npm install -g aws-sam-local

## Run test data server

Edit /test/local-file-server.py and set web_dir to poin to the location of the test files.
   
   python.py ./test/local-file-server.py

## localstak

info here: https://github.com/localstack/localstack
Start localstack in a new terminal

    cd ./test
    x-terminal-emulator -e docker-compose up

## S3

Create S3 bucket

    aws --endpoint-url=http://localhost:4572  s3 mb s3://test-bucket


List bucket contents

    aws --endpoint-url=http://localhost:4572 s3 ls s3://test-bucket  

Delete doc id f11866b1289748758b57ae42de2d6c37 from a bucket

    aws --endpoint-url=http://localhost:4572 s3 rm s3://test-bucket/f11866b1289748758b57ae42de2d6c37




## Elsastic search

Create index

    curl -X PUT "http://localhost:4571/test-index"

    curl -vX POST http://localhost:4571/test-index/_mapping/_doc -d @es_mapping.json --header "Content-Type: application/json"



## SQS

Create Queue

    aws --endpoint-url=http://localhost:4576 sqs create-queue --queue-name test-search-queue

Gives

{
    "QueueUrl": "http://localhost:4576/queue/test-search-queue"
}


list queues

    aws --endpoint-url=http://localhost:4576 sqs list-queues

Get arn

    aws --endpoint-url=http://localhost:4576 sqs get-queue-attributes --queue-url http://localhost:4576/queue/test-search-queue --attribute-names QueueArn

Gives:
{
    "Attributes": {
        "QueueArn": "arn:aws:sqs:elasticmq:000000000000:test-search-queue"
    }
}

Get message from queue

    aws --endpoint-url=http://localhost:4576 sqs receive-message --queue-url "http://localhost:4576/queue/test-search-queue"

Purge queue

    aws --endpoint-url=http://localhost:4576 sqs purge-queue --queue-url "http://localhost:4576/queue/test-search-queue"

## lambda

Check network

    docker inspect localstack -f "{{json .NetworkSettings.Networks }}"

Should be "localstack_default"

package elastic lambda ingester

zip jar

Invoke sam local

    x-terminal-emulator sam local invoke AwsLambdaSqsLocal log-file ./output.log -e event.json docker-network localstack_default

   aws --endpoint=http://localhost:4574 lambda create-function --function-name jncc-website-search-ingester-java \
   --zip-file fileb://elasticsearch-lambda-ingester-0.6.0.zip --handler "search.ingester.Ingester" --runtime java8 \
   --environment Variables="{ES_DOCTYPE="_doc",ES_ENDPOINT="http://localhost:4571/test-index",ES_MAX_PAYLOAD_SIZE=10485760}" --role=none

Bind function to queue.

   aws --endpoint=http://localhost:4574 lambda create-event-source-mapping --function-name jncc-website-search-ingester-java \
         --event-source-arn arn:aws:sqs:elasticmq:000000000000:test-search-queue


https://www.stevejgordon.co.uk/running-aws-s3-simple-storage-service-using-docker-for-net-core-developers

https://gugsrs.com/localstack-sqs-sns/

https://stackoverflow.com/questions/13782198/how-to-do-a-put-request-with-curl

