var AWS = require('aws-sdk');

var endpoint = new AWS.Endpoint('https://search-jncc-website-live-search-tzyc2xtacuslckr7ltc47dpvcu.eu-west-1.es.amazonaws.com');
var creds = new AWS.EnvironmentCredentials('AWS');

exports.handler = async (event) => {
  console.log('Starting jncc-search lambda');

  var response = await new Promise((resolve, reject) => {
    var req = new AWS.HttpRequest(endpoint);
    
    var query = '';
    if (event.queryStringParameters && event.queryStringParameters.q) {
        console.log("Received name: " + event.queryStringParameters.q);
        query = event.queryStringParameters.q;
    }
    
    req.method = 'GET';
    req.path = '/_search?q=' + query;
    req.region = 'eu-west-1';
    req.headers['host'] = endpoint.host;

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
  return response;
}