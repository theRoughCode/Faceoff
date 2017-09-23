const routes = require('express').Router();

routes.get('/', function(req, res){
  res.render('index');
});

module.exports = routes;
