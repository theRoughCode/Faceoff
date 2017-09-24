const routes = require('express').Router();
const azure = require("../helpers/azure.js");
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer();

routes.get('/', function(req, res){
  res.render('index3');
});

routes.get('/fb', function(req, res){
	res.render('index');
});

routes.post('/azureblob', upload.single("testblob"),  function(req, res)
{
	azure.sendBlob(req, res);
});

module.exports = routes;
