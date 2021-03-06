// grab the packages we need
const express = require('express');
const app = express();
const path = require('path');
const routes = require('./routes');
const favicon = require('serve-favicon');
const logger = require('morgan');
const compression = require('compression');

// Import the Anagrammatix game file.
var faceoff = require('./helpers/faceoff');

//  Connect all our routes to our application
//app.all('*', ensureSecure);
app.use(compression());
app.use(favicon(__dirname + '/resources/logo.ico'));
app.use(logger('dev'));
app.use('/', routes);

app.use(express.static(path.join(__dirname, '/')));
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.static(path.join(__dirname, '/views')));

// set the view engine to ejs
app.set('view engine', 'ejs');

// Redirect Function
 function ensureSecure(req, res, next) {
 	if(req.secure) {
 		return next();
 	}
 	res.redirect('https://' + req.hostname + req.url);
 }

module.exports = app;
