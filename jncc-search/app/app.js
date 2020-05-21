var AWS = require('aws-sdk');
var ejs = require('ejs');

var endpoint = new AWS.Endpoint('https://search-jncc-website-live-search-tzyc2xtacuslckr7ltc47dpvcu.eu-west-1.es.amazonaws.com');
var creds = new AWS.EnvironmentCredentials('AWS');

const sortOptions = {
    RELEVANCE: 'relevance',
    TITLE_ASC: 'title_asc',
    TITLE_DESC: 'title_desc',
    DATE_ASC: 'date_asc',
    DATE_DESC: 'date_desc'
}

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
    var response = {
        statusCode: 500,
        body: `Oops something went wrong`
    }
    var htmlBody = ''

    // default values
    var queryTerms = ''
    var sortOption = sortOptions.RELEVANCE
    var pageStart = 0
    var pageSize = 10

    try {
        console.log('Starting jncc-search lambda');

        if (event.queryStringParameters) {
            console.log("Received query string parameters: " + JSON.stringify(event.queryStringParameters));
            if (event.queryStringParameters.q) {
                queryTerms = event.queryStringParameters.q;
            }
            if (event.queryStringParameters.s) {
                sortOption = event.queryStringParameters.s;
            }
            if (event.queryStringParameters.q) {
                pageStart = event.queryStringParameters.p * pageSize;
            }
        }

        var payload = buildEsPageQuery(queryTerms, sortOption, pageStart, pageSize)
        response = await queryElasticsearch(payload)

        var pages = JSON.parse(response.body).hits.hits

        ejs.renderFile('index.ejs', {pages: pages}, (err, html) => {
            if (err) {
                console.log(err)
                return err
            }
            htmlBody = html
        });
    } catch (err) {
        console.log(err)
        return err
    }

    response.headers = {
        'Content-Type': 'text/html'
    }
    response.body = htmlBody

    return response
};

function buildEsPageQuery(queryTerms, sortOption, pageStart, pageSize) {
    var query = {
        "query": {
            "bool": {
                "should": [
                    { "term": { "title": queryTerms } },
                    { "term": { "content": queryTerms } }
                ],
                "must_not": [
                    { "exists": { "field": "resource_type" } },
                    { "exists": { "field": "file_extension" } }
                ],
                "minimum_should_match" : 1
            }
        },
        "from": pageStart,
        "size": pageSize,
        "highlight": {
            "pre_tags": ["<b>"],
            "post_tags": ["</b>"],
            "fields": {
                "title": {},
                "content": {}
            }
        }
    }
    query = addSortOrderToQuery(sortOption, query)

    return query
}

function buildEsResourceQuery(queryTerms, sortOption, pageStart, pageSize) {
    var query = {
        "query": {
            "bool": {
                "should": [
                    { "term": { "title": queryTerms } },
                    { "term": { "content": queryTerms } }
                ],
                "filter": [
                    { "exists": { "field": "resource_type" } }
                ],
                "minimum_should_match" : 1
            }
        },
        "from": pageStart,
        "size": pageSize,
        "highlight": {
            "pre_tags": ["<b>"],
            "post_tags": ["</b>"],
            "fields": {
                "title": {},
                "content": {}
            }
        },
        "aggs" : {
            "file_types" : {
                "terms" : { "field" : "file_extension" }
            },
            "other": {
                "missing" : { "field" : "file_extension" }
            }
        }
    }
    query = addSortOrderToQuery(sortOption, query)

    return query
}

function addSortOrderToQuery(sortOption, query) {
    switch (sortOption) {
        case sortOptions.RELEVANCE:
            query.querysort = '_source'
            break
        case sortOptions.TITLE_ASC:
            query.sort = [ { "title.raw": "asc" } ]
            break
        case sortOptions.TITLE_DESC:
            query.sort = [ { "title.raw": "desc" } ]
            break
        case sortOptions.DATE_ASC:
            query.sort = [ { "published_date": "asc" } ]
            break
        case sortOptions.DATE_DESC:
            query.sort = [ { "published_date": "desc" } ]
            break
    }
    console.warn(`Sort option ${sortOption} was not recognised, query not changed`)
    return query
}

async function queryElasticsearch(payload) {
    return new Promise((resolve, reject) => {
        console.log(`Sending ES query with payload: ${JSON.stringify(payload)}`)
        var req = new AWS.HttpRequest(endpoint);
                
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
            console.err(`ES request failed with error ${JSON.stringify(err)}`)
            reject({
                statusCode: 500,
                body: 'Something went wrong!'
            });
        });
    });
}