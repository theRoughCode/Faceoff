/* HTTPS Server */

// Dependencies
	const app = require('../app');
	const fs = require('fs');
	const hs = require('https');
	const dotenv = require('dotenv');
	const sockio = require('socket.io');
var faceoff = require('./../helpers/faceoff');

// Hide sensitive data
	dotenv.config();
	const p2 = process.env.PORT || 9000;

// Server Requirements
	var pkey = fs.readFileSync('server.key', 'utf8');
	var cert = fs.readFileSync('server.crt', 'utf8');
	var cred = {key: pkey, cert: cert};

// Server Create, Listen, Error Handling
const s2 = hs.createServer(cred, app);
s2.listen(p2, () => console.log('Https Server listening on: ' + p2));
s2.on('error', onError);

// Create Socket.IO Server
	var ios = sockio.listen(s2);

	ios.sockets.on('connection', function (socket) {
		console.log('client connected');
		faceoff.initGame(ios, socket);
	});

function onError(err) {
	console.log('Error Listening', p2, err);
}