require('dotenv').config();

module.exports = {
    get ES_INDEX()    { return process.env.ES_INDEX },
    get ES_ENDPOINT() { return process.env.ES_ENDPOINT },
    get ES_REGION() { return process.env.ES_REGION },
    get ES_PAGE_SIZE() { return process.env.ES_PAGE_SIZE }
  }