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

function buildEsPageQuery(queryTerms, sortOption, pageStart, pageSize) {
    var requestBody = esb.requestBodySearch()
        .query(
            esb.boolQuery()
                .should(getSearchTermQueries(queryTerms))
                .mustNot([
                    esb.existsQuery('resource_type'),
                    esb.existsQuery('file_extension')
                ])
                .minimumShouldMatch(1)
        )
        .from(pageStart)
        .size(pageSize)
        .highlight(esb.highlight()
            .preTags('<b>')
            .postTags('</b>')
            .field('content')
        )
        .sort(getSortQuery(sortOption))

    return requestBody.toJSON()
}

function buildEsResourceQuery(queryTerms, filters, sortOption, pageStart, pageSize) {

    var requestBody = esb.requestBodySearch()
        .query(
            esb.boolQuery()
                .must([
                    esb.boolQuery()
                        .should(getSearchTermQueries(queryTerms))
                        .minimumShouldMatch(1),
                    esb.boolQuery()
                        .should(getFileFilterQueries(filters))
                        .minimumShouldMatch(1)
                ])
                .filter(esb.existsQuery('resource_type'))
                
        )
        .aggs([
            esb.termsAggregation('file_types', 'file_extension'),
            esb.missingAggregation('other', 'file_extension')
        ])
        .from(pageStart)
        .size(pageSize)
        .highlight(esb.highlight()
            .preTags('<b>')
            .postTags('</b>')
            .field('content')
        )
        .sort(getSortQuery(sortOption))

    return requestBody.toJSON()
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