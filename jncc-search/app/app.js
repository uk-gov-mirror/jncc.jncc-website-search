const ejs = require('ejs')
const esService = require('search/esService')
const esQueryBuilder = require('search/esQueryBuilder')

const env = require('env')

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
    var queryParams = {
        view: esQueryBuilder.viewOptions.PAGES,
        queryTerms: [],
        sort: esQueryBuilder.sortOptions.RELEVANCE,
        page: 1,
        pageSize: parseInt(env.ES_PAGE_SIZE),
        filters: []
    }

    try {
        console.log('Starting jncc-search lambda')

        if (event.queryStringParameters) {
            console.log("Received query string parameters")
            if (event.queryStringParameters.q) {
                queryParams.queryTerms = event.queryStringParameters.q.split(' ')
            }
            if (event.queryStringParameters.v) {
                queryParams.view = event.queryStringParameters.v
            }
            if (event.queryStringParameters.f) {
                queryParams.filters = event.queryStringParameters.f.split(',')
            }
            if (event.queryStringParameters.s) {
                queryParams.sort = event.queryStringParameters.s
            }
            if (event.queryStringParameters.p) {
                queryParams.page = parseInt(event.queryStringParameters.p)
            }
            console.log(`Query params: ${JSON.stringify(queryParams)}`)
        }

        var payload = null
        if (queryParams.view == esQueryBuilder.viewOptions.RESOURCES) {
            payload = esQueryBuilder.buildEsResourceQuery(queryParams)
        } else {
            payload = esQueryBuilder.buildEsPageQuery(queryParams)
        }
        
        var hits = null
        var aggs = null
        await esService.queryElasticsearch(payload).then(
            response => {
                responseBody = JSON.parse(response.body)
                hits = responseBody.hits
                if (responseBody.aggregations) {
                    aggs = responseBody.aggregations
                }
                console.log(`Successfully got response with ${hits.total} results`)
            },
            err => {
                console.error(`Resource search query failed with error ${JSON.stringify(err)}`)
            })

        // populate the template
        ejs.renderFile('index.ejs', {queryParams: queryParams, hits: hits, aggs: aggs}, (err, html) => {
            if (err) {
                console.error(`HTML template rendering failed with error ${err}`)
                throw new Error()
            }
            htmlBody = html
            response.statusCode = 200
        });
    } catch (err) {
        console.error(`Could not generate search results page, got error ${err}`)
        response.statusCode = 500
        htmlBody = `Oops something went wrong`
    }

    response.headers = {
        'Content-Type': 'text/html'
    }
    response.body = htmlBody

    return response
};

