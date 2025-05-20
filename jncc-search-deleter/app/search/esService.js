import { defaultProvider } from '@aws-sdk/credential-provider-node'; // V3 SDK.
import { Client } from '@opensearch-project/opensearch';
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';
import { default as env } from '../env.js';

const client = new Client({
    ...AwsSigv4Signer({
        region: env.ES_REGION,
        service: 'es', 

        getCredentials: () => {
            const credentialsProvider = defaultProvider();
            return credentialsProvider();
        },
    }),
    node: `https://${env.ES_ENDPOINT}`,
})

export async function deleteById (id, index) {
    console.log(`Sending delete request for assets with id=${id}`)

    return client.delete_by_query({index: index, body: {
        query: {
            term: {
                'asset_id.keyword': id
            }
        }
    }})
}

export async function deleteBySite (site, index) {
    console.log(`Sending delete request for assets with site=${site}`)

    return client.delete_by_query({index: index, body: {
        query: {
            term: {
                'site.keyword': site
            }
        }
    }})
}
