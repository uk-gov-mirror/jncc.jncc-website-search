# Opensearch Checker

Python tool to take in data dumps from dynamoDB and opensearch and check that the datahub resources have all been indexed in opensearch.

To get the dynamoDB dump:

    aws dynamodb scan --table-name <table_name> --query 'Items[*].{"asset_id": id.S, "resources": data.L[*].M.title.S, "timestamp_utc": timestamp_utc.S}' --profile <profile> --region <region> > dynamodb_output.json

To get the opensearch dump (you'll need to run this on the EC2 in the private VPC):

    curl -X GET "<opensearch_endpoint>/<index_name>/_search?pretty" -H 'Content-Type: application/json' -d '
    {
        "size": 10000,
        "query": { 
            "bool": {
            "filter": [ 
                { "term":  { "site.keyword": "datahub" }}
            ]
            }
        },
        "_source": [
            "asset_id",
            "title",
            "site",
            "timestamp_utc"
        ]
    }
    ' > opensearch_output.json

Then give both files to the checker:

    python check_opensearch_docs.py --dynamodb_file dynamodb_output.json --opensearch_file opensearch_output.json  --output_file comparison_output.json

