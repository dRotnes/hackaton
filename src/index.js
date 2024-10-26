const express = require('express');
const routes = require('./routes');

const app = express();
const port = 3000;

// Use the routes
app.use('/', routes);

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});


// Here comes thee logic of the application
