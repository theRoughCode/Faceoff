const routes = require('express').Router();

routes.get('/', function(req, res){
  res.render('index3', {
    template:"../views/partials/game.ejs",
    users: [
      {
        name: 'Player 1',
        score: 214,
      },
      {
        name: 'Player 2',
        score: 217,
      },
      {
        name: 'Player 3',
        score: 234,
      },
      {
        name: 'Player 4',
        score: 400,
      }
    ]
  });
});

routes.get('/fb', function(req, res){
  res.render('index');
});

module.exports = routes;
