/* HTTP Server */

// Dependencies
	const app = require('../app');
	const http = require('http');
	const dotenv = require('dotenv');
	const sockio = require('socket.io');
var faceoff = require('./../helpers/faceoff');

// Hide sensitive data
	dotenv.config();
	const port = process.env.PORT || 8000;

// Create Server, Listen, and Error Handling
const server = http.createServer(app);
server.listen(port, () => console.log('Http Server listening on:' + port));
server.on('error', onError);

// Create Socket.IO Server 
	var io = sockio.listen(server);

	io.sockets.on('connection', function (socket) {
		console.log('client connected');
		faceoff.initGame(io, socket);
	});

function onError(err) {
	console.log('Error Listening:', port);
	console.log(err);
}