const express = require('express');
const multer = require('multer');
const path = require('path');
const Controller  = require('../controllers');

const routes = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../assets')); 
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage });

// Hello world
routes.get('/', (req, res) => {
    res.send('Hello World!');
});

/**
 * Route to receive a new order from the frontend
 * 
 * body is a .txt file
 */
routes.route('/orders/new').post(
    receiveAndSaveFile,
    Controller.receiveOrderFile,
);

/**
 * Route to receive a new order from the frontend
 * 
 * body is a .txt file
 */
routes.route('/orders/get').get(
    Controller.getStockValues,
);

routes.use((req,res) => {
    res.status(res.locals.status).send(res.locals.data);
});

module.exports = routes;

// Private
async function receiveAndSaveFile(req, res, next) {
    console.log('RECEIVED');
    // Call multer's single upload function
    upload.single('file')(req, res, (err) => {
        console.log('yeah');
        if (err) {
            return res.status(500).send(err.message);
        }
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }
        next();
    });
}