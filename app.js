// grab the packages we need
const fs = require('fs');
const express = require('express');
const app = express();
const path = require('path');
const routes = require('./routes');
const favicon = require('serve-favicon');
const logger = require('morgan');
const compression = require('compression');

const http = require('http');
const hs = require('https');
const sockio = require('socket.io');

// Import the Anagrammatix game file.
var faceoff = require('./helpers/faceoff');

// Enable hiding of sensitive information
require('dotenv').config();
const port = process.env.PORT || 8000;
const p2 = 9000;

//  Connect all our routes to our application
app.use(compression());
app.use(favicon(__dirname + '/resources/logo.ico'));
app.use(logger('dev'));
app.use('/', routes);

app.use(express.static(path.join(__dirname, '/')));
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.static(path.join(__dirname, '/views')));

// set the view engine to ejs
app.set('view engine', 'ejs');

// Turn on that server!
// var pkey = fs.readFileSync('server.key', 'utf8');
// var cert = fs.readFileSync('server.crt', 'utf8');
// var cred = {key: pkey, cert: cert};
const server = http.createServer(app).listen(port, () => console.log('Server started! At port:' + port));
// const s2 = hs.createServer(cred, app).listen(p2, () => console.log('Https Server listening on:' + p2));

// Create a Socket.IO server and attach it to the http server
var io = sockio.listen(server);
// var ios = sockio.listen(s2);

// Listen for Socket.IO Connections. Once connected, start the game logic.
io.sockets.on('connection', function (socket) {
    console.log('client connected');
    faceoff.initGame(io, socket);
});

// ios.sockets.on('connection', function (socket) {
//     console.log('client connected');
//     faceoff.initGame(io, socket);
// });
