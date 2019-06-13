# What am I

A thing to delete all records from an index by site.

Pass site and index to elasticsearch-delete-by-site.sh this runs the python script to do just that. 

Requires the following parameters

-i: Index name
-s: Site name

Requires the following environment variables

AWS_ACCESS_KEY_ID: Just that
AWS_SECRET_ACCESS_KEY: Just that
AWS_DEFAULT_REGION: pretty much what it says
AWS_ELASTICSEARCH_HOST: The elastic search host (not url) ie:  searchhost.a-region.es.amazonaws.com

