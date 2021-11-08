const esService = require('search/esService')

exports.lambdaHandler = async (event) => {
    console.log('Starting jncc-search-deleter lambda')

    var response = null
    if (event.id) {
        response = await esService.deleteById(event.id)
    } else if (event.site) {
        response = await esService.deleteBySite(event.site)
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
