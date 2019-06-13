#!/bin/bash

virtualenv venv
. ./venv/bin/activate
pip install -r requirements.txt
python clearExistingIndexContents.py -s "$site" -i "$index" --host "$AWS_ELASTICSEARCH_HOST"