const AWS = require('aws-sdk')
const env = require('../env')

const endpoint = new AWS.Endpoint(env.ES_ENDPOINT)
const creds = new AWS.EnvironmentCredentials('AWS')

exports.queryElasticsearch = async function (payload) {
    console.log(`Sending ES query with payload: ${JSON.stringify(payload)}`)
    var req = new AWS.HttpRequest(endpoint)
            
    req.method = 'POST';
    req.path = `/${env.ES_INDEX}/_search`
    req.region = env.ES_REGION
    req.headers['host'] = endpoint.host
    req.headers['content-type'] = "application/json"
    req.body = JSON.stringify(payload)

    var signer = new AWS.Signers.V4(req , 'es')
    signer.addAuthorization(creds, new Date())

    return new Promise((resolve, reject) => {
        var client = new AWS.HttpClient();
        client.handleRequest(req, null, (httpResp) => {
            console.log(`Got response from elasticsearch ${httpResp.statusCode} ${httpResp.statusMessage}`)
            if (httpResp.statusCode != 200) {
                reject({
                    statusCode: httpResp.statusCode,
                    body: httpResp.statusMessage
                })
            }
            var respBody = ''
            httpResp.on('data', function (chunk) {
                respBody += chunk
            });
            httpResp.on('end', () => {
                resolve({
                    statusCode: 200,
                    body: JSON.stringify(JSON.parse(respBody), null, 4)
                })
            })
        }, function(err) {
            console.err(`ES request failed with error ${JSON.stringify(err)}`)
            reject({
                statusCode: 500,
                body: 'Something went wrong!'
            })
        })
    })
}