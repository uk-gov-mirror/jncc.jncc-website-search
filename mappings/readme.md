## Delete index
You'll need to reindex afterwards

    DELETE <es_endpoint>/<index_name>

## Add index with mappings
Add the contents of es_mappings.json to the body as application/json, then

    PUT <es_endpoint>/<index_name>

