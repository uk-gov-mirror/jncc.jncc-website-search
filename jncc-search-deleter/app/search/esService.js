const AWS = require('aws-sdk')
const env = require('../env')

const endpoint = new AWS.Endpoint(env.ES_ENDPOINT)
const creds = new AWS.EnvironmentCredentials('AWS')

exports.deleteById = async function (id) {
    console.log(`Sending DELETE request for doc with id=${id}`)
    var req = new AWS.HttpRequest(endpoint)
            
    req.method = 'DELETE';
    req.path = `/${env.ES_INDEX}/_doc/${id}`
    req.region = env.ES_REGION
    req.headers['host'] = endpoint.host

    var signer = new AWS.Signers.V4(req , 'es')
    signer.addAuthorization(creds, new Date())

    return new Promise((resolve, reject) => {
        var client = new AWS.HttpClient();
        client.handleRequest(req, null, (httpResp) => {
            console.log(`Got response from opensearch ${httpResp.statusCode} ${httpResp.statusMessage}`)
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
            console.err(`Request failed with error ${JSON.stringify(err)}`)
            reject({
                statusCode: 500,
                body: 'Something went wrong!'
            })
        })
    })
}

exports.deleteBySite = async function (site) {
    console.log(`Sending DELETE request for docs with site=${site}`)

    var body = {
        query: {
            match: {
                site: site
            }
        }
    }
    var req = new AWS.HttpRequest(endpoint)
            
    req.method = 'DELETE';
    req.path = `/${env.ES_INDEX}/_delete_by_query`
    req.region = env.ES_REGION
    req.headers['host'] = endpoint.host
    req.headers['content-type'] = "application/json"
    req.body = JSON.stringify(body)

    var signer = new AWS.Signers.V4(req , 'es')
    signer.addAuthorization(creds, new Date())

    return new Promise((resolve, reject) => {
        var client = new AWS.HttpClient();
        client.handleRequest(req, null, (httpResp) => {
            console.log(`Got response from opensearch ${httpResp.statusCode} ${httpResp.statusMessage}`)
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
            console.err(`Request failed with error ${JSON.stringify(err)}`)
            reject({
                statusCode: 500,
                body: 'Something went wrong!'
            })
        })
    })
}