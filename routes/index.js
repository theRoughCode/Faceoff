const routes = require('express').Router();

routes.get('/', function(req, res){
  res.render('index3', {
    template:`../views/partials/intro.ejs`
  });
});

routes.get('/:template', function(req, res){
  res.render('index3', {
    template:`../views/partials/${req.params.template}.ejs`
  });
});

routes.get('/fb', function(req, res){
  res.render('index');
});

module.exports = routes;
