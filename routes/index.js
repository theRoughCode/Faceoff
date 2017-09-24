const routes = require('express').Router();
const azure = require("../helpers/azure.js");
const database = require("../helpers/database.js");
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer();

routes.get('/', function(req, res){
  res.render('index3');
});

routes.get('/fbconnected', function(req, res) {
	res.render('index3');
});

routes.get('/fb', function(req, res){
	res.render('index');
});

routes.post('/azureblob', upload.single("testblob"),  function(req, res) {
	azure.sendBlob(req, res);
});

routes.get('/room/:roomid', function(req, res) {
  database.getRanking(req.params.roomid, data => res.send(data));
});

routes.get('/video/:url', function(req, res) {
  database.addVideo(req.params.url);
  database.getVideos(videos => res.send(videos));
});

module.exports = routes;
