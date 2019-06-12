# Local development

## Run test data server

Edit /test/local-file-server.py and set web_dir to poin to the location of the test files.
   
   python.py ./test/local-file-server.py

localstak

info here: https://github.com/localstack/localstack
Start localstack

   cd ./test
   docker-compose up

Create Queue

   aws --endpoint-url=http://localhost:4576 sqs create-queue --queue-name test-search-queue

Gives

{
    "QueueUrl": "http://localhost:4576/queue/test-search-queue"
}

Create S3 bucket

   aws --endpoint-url=http://localhost:4572  s3 mb s3://test-bucket


List bucket contents

   aws --endpoint-url=http://localhost:4572 s3 ls s3://test-bucket  

Get message from queue

   aws --endpoint-url=http://localhost:4576 sqs receive-message --queue-url "http://localhost:4576/queue/test-search-queue"

Purce queue

   aws --endpoint-url=http://localhost:4576 sqs purge-queue --queue-url "http://localhost:4576/queue/test-search-queue"


https://www.stevejgordon.co.uk/running-aws-s3-simple-storage-service-using-docker-for-net-core-developers

https://gugsrs.com/localstack-sqs-sns/

aws --endpoint-url=http://localhost:4572 s3 ls s3://test-bucket

aws --endpoint-url=http://localhost:4572 s3 rm s3://test-bucket/f11866b1289748758b57ae42de2d6c37