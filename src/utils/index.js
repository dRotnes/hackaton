const OrderUtils = require('./orders');

const HTTP_STATUS_MAPPING = {
    BAD_REQUEST: 400,
    SERVER_ERROR: 500,
    SUCCESS: 200,
}

module.exports = {
    OrderUtils: OrderUtils,
    HTTP_STATUS_MAPPING: HTTP_STATUS_MAPPING,
}