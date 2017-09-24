var firebase = require('./firebase');

// TODO: deal with users leaving rooms

function addRoom(roomId, hostName, hostScore, sessionId, numPlayers) {
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
    "sessionId": sessionId,
    "numPlayers": numPlayers
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
    ranking[sessionId] = {
      "name": playerName,
      "score": playerScore
    };
    return firebase.setRanking(roomId, ranking);
  })
  .then(() => firebase.setPlayerRoom(roomId, sessionId))
  .catch(err => console.error(`Failed to add player: ${playerName}`));
}

function getPlayersList(roomId) {
  return firebase.getPlayersList(roomId);
}

function getRanking(roomId, callback) {
  firebase.getRanking(roomId)
    .then(snapshot => {
      console.log(snapshot.val());
      if (snapshot.val()) return callback(snapshot.val());
      else return callback(null);
    })
    .catch(err => console.error(`Failed to get players.`));
}

function listenToRanking(roomId, callback) {
  firebase.listenToRanking(roomId, callback);
}

function updateScore(roomId, playerName, playerScore, sessionId) {
  firebase.eliminatePlayer(roomId, sessionId)
  .then(() => {
    const data = {
      "playerName": playerName,
      "playerScore": playerScore,
      "sessionId": sessionId
    };
    return firebase.setPlayerScore(roomId, data);
  }).catch(err => console.error(`Failed to eliminate ${playerName}.`));
}

function getVideos(callback) {
  firebase.getVideos().then(snapshot => {
    return callback(snapshot.val());
  });
}

function addVideo(url) {
  firebase.addVideo(url);
}

module.exports = {
  addRoom,
  addPlayer,
  getPlayersList,
  getRanking,
  updateScore,
  listenToRanking,
  updateScore,
  getVideos,
  addVideo
}
