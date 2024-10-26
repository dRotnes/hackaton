const express = require('express');
const routes = require('./routes');
const cors = require('cors');

const app = express();
const port = 3000;

// Use the routes
app.use(cors());
app.use(cors({
    origin: 'http://localhost:3001',  // React app origin
    methods: ['POST', 'GET'],                  // Only POST requests allowed
}));


app.use('/', routes);

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});


// Here comes thee logic of the application
