// grab the packages we need
const express = require('express');
const app = express();
const path = require('path');
const routes = require('./routes');

// Enable hiding of sensitive information
require('dotenv').config();
const port = process.env.PORT || 8080;

//  Connect all our routes to our application
app.use('/', routes);

// Turn on that server!
app.listen(port, () => console.log('Server started! At http://localhost:' + port));
app.use(express.static(path.join(__dirname, '/')));
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.static(path.join(__dirname, '/views')));

// set the view engine to ejs
app.set('view engine', 'ejs');
