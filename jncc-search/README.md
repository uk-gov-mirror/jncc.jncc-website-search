# jncc-search

The JNCC search page used by the JNCC website, resource hub, and microsites. This repo contains the nodejs lambda code which performs an elasticsearch query and returns an HTML page. It requires an API gateway to proxy to the lambda.

AWS SAM is used at dev time to run a local lambda/api gateway instance.

Files/folders:
- app - Code for the application's Lambda function, this is what needs to be zipped and deployed. 
- template.yaml - A SAM template that defines local AWS resources.

Embedded Javascript templates (EJS) is used for the HTML templating. The jncc-search specific CSS and Javascript are included inline in the template to make dev time a bit easier.

## Prerequisites

* SAM CLI - [Install the SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
* Node.js - [Install Node.js 12](https://nodejs.org/en/), including the NPM package management tool.
* Docker - [Install Docker community edition](https://hub.docker.com/search/?type=edition&offering=community)

## Use the SAM CLI to build and test locally

Build your application with the `sam build` command. This will create a deployment package and save it in `.aws-sam/build`

  sam build

Run the API locally to initiate requests to the lambda via the browser. Note that you'll need to restart this if your credentials change.

  sam local start-api

The site should then be accessible via http://localhost:3000/. You'll need to do a `sam build` everytime you make a change as there's currently no --watch flag. 

## Manual deployment to AWS

Zip the app folder (with the .env file) and push to the AWS lambda function. This codebase is small enough that you can directly update the lambda function without needing to push to S3 first.

  cd app
  zip -r jncc-search.zip .
  aws lambda update-function-code --function-name my-function-name --region my-region --zip-file fileb://jncc-search.zip
