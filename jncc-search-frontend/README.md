# jncc-search-frontend

The JNCC search page used by the JNCC website, resource hub, and microsites. This repo contains the nodejs lambda code which performs an elasticsearch query and returns an HTML page (to be integrated on AWS with Cloudfront, an API gateway, and S3 for static file hosting).

AWS SAM is used at dev time to run a local lambda/api gateway instance.

Files/folders:
- app - Code for the application's Lambda function.
- static-assets - Contains css/js/images files to be statically hosted.
- error-pages - Contains HTML error pages to be statically hosted.
- deployment - Contains CodeBuild yaml files for build/deployment.
- template.yaml - A SAM template that defines AWS resources for local dev.
- requirements.txt - For creating a python venv to run AWS SAM in (easiest way to run it).

## Prerequisites

* Node.js - [Install Node.js 22](https://nodejs.org/en/), including the NPM package management tool.
* Docker - [Install Docker community edition](https://hub.docker.com/search/?type=edition&offering=community)

## Use the SAM CLI to build and test locally

Create a .env file using the .env.example template. Set env to `localdev` to use local example data. 

Setup and activate a python venv to run aws sam
  
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt

Build your application with the `sam build` command. This will create a deployment package and save it in `.aws-sam/build`

    sam build

Run the API gateway locally to initiate requests to the lambda via the browser. Note that you'll need to restart this if your credentials change.

    sam local start-api --static-dir <path to static-assets dir>

NOTE: SAM starts in .aws-sam/build/ so you need to specify the path to the static-assets directory relative to that i.e. `--static-dir ../../static-assets`.

The site should then be accessible via http://localhost:3000/. You'll need to do a `sam build` every time you make a change as there's currently no --watch flag.
