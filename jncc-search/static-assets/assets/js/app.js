jQuery(document).ready(function() {
    var queryParams = {
        queryTerms: [],
        view: 'pages',
        sort: 'relevance',
        page: 0,
        filters: []
    }

    initialisePage(queryParams);

    $('#main-search-form').on('submit', function(e){
        e.preventDefault(); // don't let it actually submit
        e.returnValue = false;
        queryParams.queryTerms = $('#search-input').val().trim().split(' ');
        queryParams.page = 0;
        queryParams.filters = [];
        refreshSearch(queryParams);
    });
    $('#sort-select').on('change', function(e){
        e.preventDefault();
        e.returnValue = false;
        queryParams.sort = this.value;
        queryParams.page = 0;
        refreshSearch(queryParams);
    });
    $('#filter-form').find(':checkbox').on('change', function(e){
        e.preventDefault();
        e.returnValue = false;
        queryParams.page = 0;
        if (this.checked && queryParams.filters.indexOf(this.value) < 0) {
            queryParams.filters.push(this.value);
        } else if (!this.checked && queryParams.filters.indexOf(this.value) > -1) {
            queryParams.filters.splice(queryParams.filters.indexOf(this.value), 1);
        }
        refreshSearch(queryParams);
    });
});

function initialisePage(queryParams) {
    var queryTerms = getQueryVariable('q');
    if (queryTerms) {
        queryParams.queryTerms = queryTerms.split('+');
        var searchInputValue = decodeURIComponent(queryParams.queryTerms.join(' '));
        $('#search-input').val(searchInputValue);
    }

    var view = getQueryVariable('v');
    if (view) {
        queryParams.view = view;
    }

    var sort = getQueryVariable('s');
    if (sort) {
        queryParams.sort = sort;
        $('#sort-select').val(queryParams.sort);
    }

    var page = getQueryVariable('p');
    if (page) {
        queryParams.page = page;
    }

    var filters = getQueryVariable('f');
    if (filters) {
        queryParams.filters = filters.split(',');
        for (var i = 0; i < queryParams.filters.length; i++) {
            $('#'+queryParams.filters[i]).prop('checked', true);
        }
    }
}

function refreshSearch(queryParams, key, value) {
    var params = []

    if (queryParams.queryTerms && queryParams.queryTerms.length > 0) {
        params['q'] = queryParams.queryTerms.join('+')
    }
    if (queryParams.view) {
        params['v'] = queryParams.view
    }
    if (queryParams.sort) {
        params['s'] = queryParams.sort
    }
    if (queryParams.filters && queryParams.filters.length > 0) {
        params['f'] = queryParams.filters.join(',')
    }
    if (queryParams.page) {
        params['p'] = queryParams.page
    }
    
    params[key] = value

    if (key !== 'p') {
        params['p'] = 0
    } else if (key === 'q' || key === 'v') {
        params['f'] = null
    }

    var queryStringParams = updateQueryStringParameters(params)
    window.location = queryStringParams;
}

function updateQueryStringParameters(params) {         
    var uri = '';
    for (var key in params) {
        if (params[key]) {
            uri = uri + "&" + key + "=" + params[key];
        }        
    };
    uri = uri.replace('&','?') // replace first &
    
    return uri;
}

// https://css-tricks.com/snippets/javascript/get-url-variables/
function getQueryVariable(variable)
{
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
            var pair = vars[i].split("=");
            if(pair[0] == variable){return pair[1];}
    }
    return(false);
}