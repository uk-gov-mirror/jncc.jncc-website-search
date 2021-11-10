const esService = require('search/esService')

exports.lambdaHandler = async (event) => {
    console.log('Starting jncc-search-deleter lambda')

    var response = null
    if (event.id && event.index) {
        response = await esService.deleteById(event.id, event.index)
    } else if (event.site && event.index) {
        response = await esService.deleteBySite(event.site, event.index)
    } else {
        throw new Error('Expecting an id or site, and an index to be provided')
    }

    console.log(`${JSON.stringify(response.errorMessage)}`)

    if (response && response.statusCode == 200) {
        console.log(`Delete query was successful`)
    } else {
        throw new Error(`Something's gone wrong`)
    }

    console.log('Done')
}
