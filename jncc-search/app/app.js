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
    var view = esQueryBuilder.viewOptions.PAGES
    var queryTerms = []
    var sortOption = esQueryBuilder.sortOptions.RELEVANCE
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
            if (event.queryStringParameters.s) {
                sortOption = event.queryStringParameters.s
                console.log(`Sort option: ${sortOption}`)
            }
            if (event.queryStringParameters.p) {
                pageStart = event.queryStringParameters.p * 
                console.log(`Page start: ${pageStart}`)
            }
        }

        if (event.multiValueQueryStringParameters) {
            console.log(`Received multi value parameters`)
            if (event.multiValueQueryStringParameters.q) {
                queryTerms = event.multiValueQueryStringParameters.q
                console.log(`Query terms: ${JSON.stringify(queryTerms)}`)
            }
            if (event.multiValueQueryStringParameters.f) {
                filters = event.multiValueQueryStringParameters.f
                console.log(`Filters: ${JSON.stringify(filters)}`)
            }
        }

        var payload = null
        if (view == esQueryBuilder.viewOptions.RESOURCES) {
            payload = esQueryBuilder.buildEsResourceQuery(queryTerms, filters, sortOption, pageStart, env.ES_PAGE_SIZE)
        } else {
            payload = esQueryBuilder.buildEsPageQuery(queryTerms, sortOption, pageStart, env.ES_PAGE_SIZE)
        }
        
        var hits = null
        await esService.queryElasticsearch(payload).then(
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

