import argparse
import json


def resource_exists_in_opensearch(resource_title, asset_id, opensearch_docs):
    for doc in opensearch_docs:
        if asset_id == doc['_source']['asset_id'] and doc['_source']['title'].startswith(resource_title):
            return True
        
    return False

def main(dynamodb_file, opensearch_file, output_file):
    with open(dynamodb_file) as f:
        dynamodb_input = json.load(f)

    with open(opensearch_file) as f:
        opensearch_docs = json.load(f)['hits']['hits']

    indexed_resources_count = 0
    missing_resources_count = 0
    asset_statuses = []
    assets_to_reindex = []

    for asset in dynamodb_input:
        indexed_resources = []
        missing_resources = []

        for resource in asset['resources']:
            if resource_exists_in_opensearch(resource, asset['asset_id'], opensearch_docs):
                indexed_resources.append(resource)
            else:
                missing_resources.append(resource)

        asset_info = {
            'asset_id': asset['asset_id'],
            'all_resources_indexed': True if not missing_resources else False,
            'resource_count': len(indexed_resources) + len(missing_resources),
            'indexed_resources': indexed_resources,
            'missing_resources': missing_resources
        }
        asset_statuses.append(asset_info)

        indexed_resources_count += len(indexed_resources)
        missing_resources_count += len(missing_resources)

        if missing_resources:
            assets_to_reindex.append(asset_info['asset_id'])

    output = {
        'total_assets_count': len(asset_statuses),
        'total_resources_count': indexed_resources_count + missing_resources_count,
        'indexed_resources_count': indexed_resources_count,
        'missing_resources_count': missing_resources_count,
        'missing_assets_count': len(assets_to_reindex),
        'assets_to_reindex': assets_to_reindex,
        'all_assets': asset_statuses
    }

    with open(output_file, 'w') as f:
        json.dump(output, f, indent=4)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Compare outputs from dynamodb and opensearch to check if all resources have made it into the search results')
    parser.add_argument('--dynamodb_file', type=str, help='The DynamoDB JSON file containing asset IDs and resource titles', required=True)
    parser.add_argument('--opensearch_file', type=str, help='The OpenSearch JSON file containing asset IDs and resource titles', required=True)
    parser.add_argument('--output_file', type=str, help='The output filepath', required=True)

    args = parser.parse_args()

    main(args.dynamodb_file, args.opensearch_file, args.output_file)