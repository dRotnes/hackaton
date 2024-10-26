const { OrderUtils, HTTP_STATUS_MAPPING } = require('../utils');

// Receives the file reference and parses into a array of objects
async function receiveOrderFile(req, res, next) {
    const { path } = req.file;
    const { currentStock } = req.body;

    try {
        // Parse the order file and return it
        const resp = await OrderUtils.parseOrderFromFile(path);
        await OrderUtils.calculateNecessaryStockPerOrder(resp, currentStock);

        res.status(200).send('');
        console.log(stock)
        next();
    }
    catch (error) {
        res.locals.status = HTTP_STATUS_MAPPING.SERVER_ERROR;
        next(error);
    }
}
async function getStockValues(req, res, next){
    try {
        const resp = await OrderUtils.getStock();

        res.status(200).send(resp);
        next();
    }
    catch (error) {
        res.locals.status = HTTP_STATUS_MAPPING.SERVER_ERROR;
        next(error);
    }
}

module.exports = {
    receiveOrderFile: receiveOrderFile,
    getStockValues: getStockValues,
}   