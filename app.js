var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(80);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  socket.emit('news', { text: 'Hello world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
  socket.on('hello', function (data) {
    console.log(data);
    socket.emit('hello', data);
  });
});
