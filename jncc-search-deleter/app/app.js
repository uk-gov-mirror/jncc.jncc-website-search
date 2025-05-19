import { deleteById, deleteBySite } from 'search/esService.js'

export async function lambdaHandler(event) {
    console.log('Starting jncc-search-deleter lambda')

    var response = null
    if (event.id && event.index) {
        response = await deleteById(event.id, event.index)
    } else if (event.site && event.index) {
        response = await deleteBySite(event.site, event.index)
    } else {
        throw new Error('Expecting an id or site, and an index to be provided')
    }

    if (response && response.statusCode == 200) {
        console.log(`Delete query was successful`)
    } else {
        throw new Error(`Something's gone wrong: ${JSON.stringify(response.errorMessage)}`)
    }

    console.log('Done')
}
