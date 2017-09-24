var firebase = require('./firebase');

// TODO: deal with users leaving rooms

function addRoom(roomId, hostName, hostScore, sessionId) {
  firebase.getPlayerRoom(sessionId)
    .then(snapshot => {
        firebase.addPlayer(sessionId, roomId)
          .catch(err => console.error(`Failed to add host: ${hostName}`));
        if (snapshot.val()) firebase.removeRoom(snapshot.val());
      })
      .catch(err => console.error(`Failed to remove room: ${roomId}`));
  firebase.setHost(roomId, {
    "hostName": hostName,
    "hostScore": hostScore,
    "sessionId": sessionId
  }).catch(err => console.error(`Failed to add host: ${hostName}`));
}

function addPlayer(roomId, playerName, playerScore, sessionId) {
  firebase.setPlayer(roomId, {
    "playerName": playerName,
    "playerScore": playerScore,
    "sessionId": sessionId
  })
  .then(() => firebase.getRanking(roomId))
  .then(snapshot => {
    const ranking = snapshot.val();
    ranking.push({
      "name": playerName,
      "score": playerScore,
      "sessionId": sessionId
    });
    return firebase.setRanking(roomId, ranking);
  })
  .then(() => firebase.setPlayerRoom(roomId, sessionId))
  .catch(err => console.error(`Failed to add player: ${playerName}`));
}

function getPlayers(roomId, callback) {
  firebase.getPlayers(roomId, promise => promise
    .then(snapshot => {
      if (snapshot.val()) return callback(snapshot.val());
      else return callback(null);
    })
    .catch(err => console.error(`Failed to get players.`)))
}

function updateScore(roomId, playerName, playerScore, sessionId) {
  firebase.setPlayerScore(roomId, {
    "playerName": playerName,
    "playerScore": playerScore,
    "sessionId": sessionId
  }).catch(err => console.error(`Failed to update score for ${playerName}.`))
}

module.exports = {
  addRoom,
  addPlayer,
  getPlayers,
  updateScore
}
