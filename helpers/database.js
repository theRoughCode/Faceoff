var firebase = require('./firebase');

function addRoom(roomId, hostName, hostScore, sessionId) {
  firebase.setHost(roomId, {
    "hostName": hostName,
    "hostScore": hostScore,
    "sessionId": sessionId
  }, promise => promise.catch(err => console.error(`Failed to add host: ${hostName}`)));
}

function addPlayer(roomId, playerName, playerScore, sessionId) {
  firebase.setPlayer(roomId, {
    "playerName": playerName,
    "playerScore": playerScore,
    "sessionId": sessionId
  }, promise => promise.catch(err => console.error(`Failed to add player: ${playerName}`)));
}

function getPlayers(roomId, callback) {
  firebase.getPlayers(roomId, promise => promise
    .then(snapshot => {
      if (snapshot.val()) return callback(snapshot.val());
      else return callback(null);
    })
    .catch(err => console.error(`Failed to get players.`)))
}

module.exports = {
  addRoom,
  addPlayer,
  getPlayers
}
