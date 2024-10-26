const { OrderUtils, HTTP_STATUS_MAPPING } = require('../utils');

// Receives the file reference and parses into a array of objects
async function receiveOrderFile(req, res, next) {
    const { path } = req.file;
    const { currentStock } = req.body;

    try {
        // Parse the order file and return it
        const resp = await OrderUtils.parseOrderFromFile(path);
        const stockChanges = await OrderUtils.calculateNecessaryStockPerOrder(resp, currentStock);

        res.locals.status = HTTP_STATUS_MAPPING.SUCCESS;
        res.locals.data = stockChanges;
        next();
    }
    catch (error) {
        res.locals.status = HTTP_STATUS_MAPPING.SERVER_ERROR;
        next(error);
    }
}

module.exports = {
    receiveOrderFile: receiveOrderFile,
}   