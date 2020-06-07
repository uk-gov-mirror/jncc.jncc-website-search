const esb = require('elastic-builder')

const sortOptions = {
    RELEVANCE: 'relevance',
    TITLE_ASC: 'title_asc',
    TITLE_DESC: 'title_desc',
    DATE_ASC: 'date_asc',
    DATE_DESC: 'date_desc'
}

const viewOptions = {
    PAGES: 'pages',
    RESOURCES: 'resources'
}

function buildEsPageQuery(queryParams) {
    var requestBody = esb.requestBodySearch()
        .query(
            esb.boolQuery()
                .should(getSearchTermQueries(queryParams.queryTerms))
                .mustNot([
                    esb.existsQuery('resource_type'),
                    esb.existsQuery('file_extension')
                ])
                .minimumShouldMatch(1)
        )
        .from(getPageStartIndex(queryParams.page, queryParams.pageSize))
        .size(queryParams.pageSize)
        .highlight(esb.highlight()
            .preTags('<b>')
            .postTags('</b>')
            .field('content')
            .numberOfFragments(2)
            .scoreOrder('_score')
        )
        .sort(getSortQuery(queryParams.sort))

    return requestBody.toJSON()
}

function buildEsResourceQuery(queryParams) {

    var requestBody = esb.requestBodySearch()
        .query(
            esb.boolQuery()
                .must([
                    esb.boolQuery()
                        .should(getSearchTermQueries(queryParams.queryTerms))
                        .minimumShouldMatch(1)
                ])
                .filter(esb.existsQuery('resource_type'))
        )
        .postFilter( // post filter so that the aggregation counts aren't affected
            esb.boolQuery()
                .should(getFileFilterQueries(queryParams.filters))
                .minimumShouldMatch(1)
        )
        .aggs([
            esb.termsAggregation('file_types', 'file_extension'),
            esb.missingAggregation('other', 'file_extension')
        ])
        .from(getPageStartIndex(queryParams.page, queryParams.pageSize))
        .size(queryParams.pageSize)
        .highlight(esb.highlight()
            .preTags('<b>')
            .postTags('</b>')
            .field('content')
            .numberOfFragments(2)
            .scoreOrder('_score')
        )
        .sort(getSortQuery(queryParams.sort))

    return requestBody.toJSON()
}

function getPageStartIndex(page, pageSize) {
    if (page > 1) {
        return (page-1)*pageSize
    }

    return 0;
}

function getSearchTermQueries(queryTerms) {
    var termQueries = []
    queryTerms.forEach(term => {
        termQueries.push(esb.termQuery('title', term))
        termQueries.push(esb.termQuery('content', term))
    })

    return termQueries
}

function getFileFilterQueries(filters) {
    var queryFilters = []
    filters.forEach(filter => {
        if (filter === 'other') {
            // assets with no files
            queryFilters.push(esb.boolQuery()
                .mustNot(esb.existsQuery('file_extension')))
        } else {
            queryFilters.push(esb.termQuery('file_extension', filter))
        }
    })

    return queryFilters
}

function getSortQuery(sortOption) {
    switch (sortOption) {
        case sortOptions.RELEVANCE:
            return new esb.sort('_score')
        case sortOptions.TITLE_ASC:
            return new esb.sort('title.raw', "asc")
        case sortOptions.TITLE_DESC:
            return new esb.sort('title.raw', "desc")
        case sortOptions.DATE_ASC:
            return new esb.sort('published_date', "asc")
        case sortOptions.DATE_DESC:
            return new esb.sort('published_date', "desc")
        default:
            console.warn(`Sort option ${sortOption} was not recognised, query not changed`)
            return new esb.sort('_score')
    }
}

module.exports = {
    sortOptions: sortOptions,
    viewOptions: viewOptions,
    buildEsPageQuery: buildEsPageQuery,
    buildEsResourceQuery: buildEsResourceQuery
}