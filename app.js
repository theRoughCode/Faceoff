// grab the packages we need
const express = require('express');
const app = express();
const path = require('path');
const routes = require('./routes');

// Import the Anagrammatix game file.
var faceoff = require('./helpers/faceoff');

// Enable hiding of sensitive information
require('dotenv').config();
const port = process.env.PORT || 8080;

//  Connect all our routes to our application
app.use('/', routes);

app.use(express.static(path.join(__dirname, '/')));
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.static(path.join(__dirname, '/views')));

// set the view engine to ejs
app.set('view engine', 'ejs');

// Turn on that server!
const server = require('http').createServer(app).listen(port, () => console.log('Server started! At http://localhost:' + port));

// Create a Socket.IO server and attach it to the http server
var io = require('socket.io').listen(server);

// Listen for Socket.IO Connections. Once connected, start the game logic.
io.sockets.on('connection', function (socket) {
    console.log('client connected');
    faceoff.initGame(io, socket);
});
