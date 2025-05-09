// const AWS = require('aws-sdk')
// const env = require('../env')

// const endpoint = new AWS.Endpoint(env.ES_ENDPOINT)
// const creds = new AWS.EnvironmentCredentials('AWS')

const { defaultProvider } = require('@aws-sdk/credential-provider-node'); // V3 SDK.
const { Client } = require('@opensearch-project/opensearch');
const { AwsSigv4Signer } = require('@opensearch-project/opensearch/aws');
const { ES_ENDPOINT, ES_REGION } = require('../env');

const client = new Client({
  ...AwsSigv4Signer({
    region: ES_REGION,
    service: 'es', 

    getCredentials: () => {
      const credentialsProvider = defaultProvider();
      return credentialsProvider();
    },
  }),
  node: ES_ENDPOINT,
});

exports.queryElasticsearch = async function (payload) {
    console.log(`Sending ES query with payload: ${JSON.stringify(payload)}`)

    return new Promise((resolve, reject) => {
        client.search({
            index: env.ES_INDEX,
            body: payload
        }).then(
            response => {
                console.log(`Successfully got response with ${response.body.hits.total.value} results`)
                resolve({
                    statusCode: 200,
                    body: JSON.stringify(response.body, null, 4)
                })
            },
            err => {
                console.error(`Resource search query failed with error ${JSON.stringify(err)}`)
                reject({
                    statusCode: 500,
                    body: 'Something went wrong!'
                })
            }
        )
    })
}