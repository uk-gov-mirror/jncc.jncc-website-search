const esService = require('search/esService')

exports.lambdaHandler = async (event) => {
    console.log('Starting jncc-search-deleter lambda')

    if (event.id) {
        response = esService.deleteById(event.id)
    } else if (event.site) {
        response = esService.deleteBySite(event.site)
    } else {
        throw new Error('No id or site parameter provided')
    }

    console.log(`${JSON.stringify(response)}`)

    if (response && response.statusCode == 200) {
        console.log(`Delete query was successful`)
    } else {
        throw new Error(`Something's gone wrong`)
    }

    console.log('Done')
}
