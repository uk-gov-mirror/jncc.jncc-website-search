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

const views = {
    PAGES: 'pages',
    RESOURCES: 'resources'
}

const pageSize = 10

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
    var view = views.PAGES
    var queryTerms = ''
    var sortOption = sortOptions.RELEVANCE
    var pageStart = 0
    var filters = []

    try {
        console.log('Starting jncc-search lambda')

        if (event.queryStringParameters) {
            console.log("Received query string parameters")
            if (event.queryStringParameters.v) {
                view = event.queryStringParameters.v
                console.log(`View: ${view}`)
            }
            if (event.queryStringParameters.q) {
                queryTerms = event.queryStringParameters.q
                console.log(`Query terms: ${queryTerms}`)
            }
            if (event.queryStringParameters.s) {
                sortOption = event.queryStringParameters.s
                console.log(`Sort option: ${sortOption}`)
            }
            if (event.queryStringParameters.p) {
                pageStart = event.queryStringParameters.p * pageSize
                console.log(`Page start: ${pageStart}`)
            }
        }

        if (event.multiValueQueryStringParameters && event.multiValueQueryStringParameters.f) {
            console.log("Received multi value parameters")
            filters = event.multiValueQueryStringParameters.f
            console.log("Filters: " + JSON.stringify(filters))
        }

        var payload = null
        if (view == views.RESOURCES) {
            payload = await buildEsResourceQuery(queryTerms, filters, sortOption, pageStart, pageSize)
        } else {
            payload = await buildEsPageQuery(queryTerms, sortOption, pageStart, pageSize)
        }
        
        var hits = null
        await queryElasticsearch(payload).then(
            response => {
                hits = JSON.parse(response.body).hits
                console.log(`Successfully got response with ${hits.total} results`)
            },
            err => {
                console.error(`Resource search query failed with error ${err}`)
            })

        // populate the template
        ejs.renderFile('index.ejs', {view: view, hits: hits}, (err, html) => {
            if (err) {
                console.error(`HTML template rendering failed with error ${err}`)
                throw new Error()
            }
            htmlBody = html
        });
    } catch (err) {
        console.error(`Could not generate search results page, got error ${err}`)
        htmlBody = `Oops something went wrong`
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
    addSortOrderToQuery(sortOption, query)

    return query
}

function buildEsResourceQuery(queryTerms, filters, sortOption, pageStart, pageSize) {
    var query = {
        "query": {
            "bool": {
                "must": [
                    {
                        "bool": {
                            "should": [
                                { "term": { "title": queryTerms } },
                                { "term": { "content": queryTerms } }
                            ],
                            "minimum_should_match" : 1
                        }
                    }
                ],
                "filter": [
                    { "exists": { "field": "resource_type" } }
                ]
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
    addFiltersToQuery(filters, query)
    addSortOrderToQuery(sortOption, query)

    return query
}

function addFiltersToQuery(filters, query) {
    var queryFilters = []
    filters.forEach(filter => {
        if (filter === 'other') {
            // assets with no files
            queryFilters.push({
                "bool": {
                    "must_not": {
                        "exists": {
                            "field": "file_extension"
                        }
                    }
                }
            })
        } else {
            queryFilters.push({
                "term": {
                    "file_extension": filter
                }
            })
        }
    })

    if (filters.length > 0) {
        query.query.bool.must.push({
            "bool": {
                "should": queryFilters,
                "minimum_should_match" : 1
            }
        })
    }
}

function addSortOrderToQuery(sortOption, query) {
    switch (sortOption) {
        case sortOptions.RELEVANCE:
            query.sort = '_score'
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
        default:
            console.warn(`Sort option ${sortOption} was not recognised, query not changed`)
    }
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
            console.log(`Got response from elasticsearch ${httpResp.statusCode} ${httpResp.statusMessage}`);
            if (httpResp.statusCode != 200) {
                reject({
                    statusCode: httpResp.statusCode,
                    body: httpResp.statusMessage
                })
            }
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
            })
        })
    })
}