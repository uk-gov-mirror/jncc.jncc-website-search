const AWS = require('aws-sdk')
const env = require('../env')

const endpoint = new AWS.Endpoint(env.ES_ENDPOINT)
const creds = new AWS.EnvironmentCredentials('AWS')

exports.deleteById = async function (id, index) {
    console.log(`Sending delete request for assets with id=${id}`)

    var body = {
        query: {
            match: {
                asset_id: id
            }
        }
    }

    return deleteByQuery(body, index)
}

exports.deleteBySite = async function (site, index) {
    console.log(`Sending delete request for assets with site=${site}`)

    var body = {
        query: {
            match: {
                site: site
            }
        }
    }
    
    return deleteByQuery(body, index)
}

function deleteByQuery(body, index) {
    var req = new AWS.HttpRequest(endpoint)
            
    req.method = 'POST';
    req.path = `/${index}/_delete_by_query`
    req.region = env.ES_REGION
    req.headers['host'] = endpoint.host
    req.headers['content-type'] = "application/json"
    req.body = JSON.stringify(body)

    console.log(`Request body: ${req.body}`)

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