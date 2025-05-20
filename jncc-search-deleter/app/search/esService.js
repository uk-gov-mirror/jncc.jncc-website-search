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

    return client.delete({
        index: index,
        id: id,
    });
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

// function deleteByQuery(body, index) {
//     var req = new AWS.HttpRequest(endpoint)
            
//     req.method = 'POST';
//     req.path = `/${index}/_delete_by_query`
//     req.region = env.ES_REGION
//     req.headers['host'] = endpoint.host
//     req.headers['content-type'] = "application/json"
//     req.body = JSON.stringify(body)

//     console.log(`Request body: ${req.body}`)

//     var signer = new AWS.Signers.V4(req , 'es')
//     signer.addAuthorization(creds, new Date())

//     return new Promise((resolve, reject) => {
//         var client = new AWS.HttpClient();
//         client.handleRequest(req, null, (httpResp) => {
//             console.log(`Got response from opensearch ${httpResp.statusCode} ${httpResp.statusMessage}`)
//             if (httpResp.statusCode != 200) {
//                 reject({
//                     statusCode: httpResp.statusCode,
//                     body: httpResp.statusMessage
//                 })
//             }
//             var respBody = ''
//             httpResp.on('data', function (chunk) {
//                 respBody += chunk
//             });
//             httpResp.on('end', () => {
//                 resolve({
//                     statusCode: 200,
//                     body: JSON.stringify(JSON.parse(respBody), null, 4)
//                 })
//             })
//         }, function(err) {
//             console.err(`Request failed with error ${JSON.stringify(err)}`)
//             reject({
//                 statusCode: 500,
//                 body: 'Something went wrong!'
//             })
//         })
//     })
// }