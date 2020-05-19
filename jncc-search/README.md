# jncc-search

JNCC Search microsite - a node.js lambda function hooked up to an HTTP gateway that returns a search page used by the JNCC Website and microsites.

## deploy

    zip jncc-search.zip index.js
    aws lambda update-function-code --function-name jncc-search --region eu-west-1 --zip-file fileb://jncc-search.zip
