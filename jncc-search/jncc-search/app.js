var AWS = require('aws-sdk');

var endpoint = new AWS.Endpoint('https://search-jncc-website-live-search-tzyc2xtacuslckr7ltc47dpvcu.eu-west-1.es.amazonaws.com');
var creds = new AWS.EnvironmentCredentials('AWS');

let response;

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */
exports.lambdaHandler = async (event, context) => {
    try {
        console.log('Starting jncc-search lambda');

        var response = await new Promise((resolve, reject) => {
            var req = new AWS.HttpRequest(endpoint);
            
            var queryString = '';
            if (event.queryStringParameters && event.queryStringParameters.q) {
                console.log("Received name: " + event.queryStringParameters.q);
                queryString = event.queryStringParameters.q;
            }

            var payload = {
                "query": {
                    "bool": {
                        "should": [
                            { "term": { "title": queryString } },
                            { "term": { "content": queryString } }
                        ],
                        "must_not": [
                            { "exists": { "field": "resource_type" } },
                            { "exists": { "field": "file_extension" } }
                        ],
                        "minimum_should_match" : 1
                    }
                },
                "sort": [
                    { "title.raw": "asc" }
                ],
                "from": 0,
                "size": 10
            }
            
            req.method = 'POST';
            req.path = '/beta/_search';
            req.region = 'eu-west-1';
            req.headers['host'] = endpoint.host;
            req.headers['content-type'] = "application/json";
            req.body = JSON.stringify(payload);
        
            var signer = new AWS.Signers.V4(req , 'es');  // es: service code
            signer.addAuthorization(creds, new Date());
        
            var client = new AWS.HttpClient();
            client.handleRequest(req, null, function(httpResp) {
                console.log(httpResp.statusCode + ' ' + httpResp.statusMessage);
                var respBody = '';
                httpResp.on('data', function (chunk) {
                    respBody += chunk;
                });
                httpResp.on('end', () => {
                resolve({
                    statusCode: 200,
                    body: JSON.stringify(JSON.parse(respBody), null, 4)
                });
                });
            }, function(err) {
                reject({
                statusCode: 500,
                body: 'Something went wrong!'
                });
            });
        });
    } catch (err) {
        console.log(err);
        return err;
    }

    return response
};
