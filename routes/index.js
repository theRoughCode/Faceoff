const routes = require('express').Router();

routes.get('/', function(req, res){
  res.render('index3');
});

routes.get('/fb', function(req, res){
  res.render('index');
});

module.exports = routes;
