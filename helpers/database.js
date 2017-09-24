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

function getRanking(roomId, callback) {
  firebase.getRanking(roomId)
    .then(snapshot => {
      if (snapshot.val()) return callback(snapshot.val());
      else return callback(null);
    })
    .catch(err => console.error(`Failed to get players.`));
}

function listenToRanking(roomId, callback) {
  firebase.listenToRanking(roomId, players => {
    if(!players) return null;
    players.sort((a, b) => {
      return ((a.score < b.score) ? 1 :
             (a.score > b.score) ? -1 : 0);
    });
    return callback(players);
  });
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
  getRanking,
  updateScore,
  listenToRanking
}
