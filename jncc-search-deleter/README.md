# jncc-search-deleter

Nodejs lambda function used by the JNCC resource hub and microsites to run delete queries against the AWS Opensearch cluster.

## Prerequisites

* Node.js - [Install Node.js 12](https://nodejs.org/en/), including the NPM package management tool.
* Docker - [Install Docker community edition](https://hub.docker.com/search/?type=edition&offering=community)

## Use the SAM CLI to build and test locally

Create a .env file using the .env.example template

Setup and activate a python venv to run aws sam
  
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt

Build your application with the `sam build` command. This will create a deployment package and save it in `.aws-sam/build`

    sam build

Run the API gateway locally to initiate requests to the lambda via the browser. Note that you'll need to restart this if your credentials change.

    sam local start-api --static-dir <path to static-assets dir>

The site should then be accessible via http://localhost:3000/. You'll need to do a `sam build` every time you make a change as there's currently no --watch flag.

