var firebase = require("firebase");

// Initialize Firebase
var config = {
  apiKey: "AIzaSyAxizNRcmQSL3IcXVzQTctSGO17o4CwaSQ",
  authDomain: "faceoff-1.firebaseapp.com",
  databaseURL: "https://faceoff-1.firebaseio.com",
  projectId: "faceoff-1",
  storageBucket: "",
  messagingSenderId: "786169093542"
};
firebase.initializeApp(config);

var db = firebase.database();
/*
 * roomId: {{ hostName: *, players: { sessionId: { playerName: *, playerScore: *, isHost: * }} }}
 */
 var roomsRef = db.ref('rooms');

 /*
  * sessionId: {{ roomId: * }}
  */
 var playersRef = db.ref('players');

/*
 * Set host by roomID
 * @param hostData {{ hostName: *, hostScore: *, sessionId: * }}
 */
function setHost(roomId, hostData, callback) {
  const data = {
    "hostName": hostData.hostName,
    "players": {},
    "ranking": [{
      "name": hostData.hostName,
      "score": hostData.hostScore,
      "sessionId": hostData.sessionId
    }]
  };
  data.players[hostData.sessionId] = {
    "playerName": hostData.hostName,
    "playerScore": hostData.hostScore,
    "isHost": true
  };
  return roomsRef.child(roomId).set(data);
}

/*
 * Set playerData by roomID
 * @param playerData {{ playerName: *, playerScore: *, sessionId: * }}
 */
function setPlayer(roomId, playerData) {
  const data = {
    "playerName": playerData.playerName,
    "playerScore": playerData.playerScore,
    "isHost": false
  };
  return roomsRef.child(`${roomId}/players/${playerData.sessionId}`).set(data);
}

/*
 * Retrieve player's room by sessionId
 */
function getPlayerRoom(sessionId) {
  return playersRef.child(sessionId).once('value');
}

/*
 * Set player's room' by sessionId
 * @param sessionId
 */
function setPlayerRoom(roomId, sessionId) {
  return playersRef.child(sessionId).set(roomId);
}

/*
 * Set playerScore by roomID, playerId
 * @param playerData {{ playerName: *, playerScore: *, sessionId: * }}
 */
function setPlayerScore(roomId, playerData) {
  return roomsRef.child(`${roomId}/players/${playerData.sessionId}/playerScore`).set(playerData.playerScore);
}

/*
 * Retrieve rankings by roomId
 */
function getRanking(roomId) {
  return roomsRef.child(`${roomId}/ranking`).once('value');
}

/*
 * Set ranking by roomID
 * @param ranking [{ name : *, score : * }]
 */
function setRanking(roomId, ranking) {
  return roomsRef.child(`${roomId}/ranking`).set(ranking);
}

/*
 * Add player and their room
 */
function addPlayer(sessionId, roomId) {
  return playersRef.child(sessionId).set(roomId);
}

/*
 * Retrieve players by roomID
 */
function getPlayersList(roomId, callback) {
  return callback(roomsRef.child(`${roomId}/players`).once('value'));
}

function removeRoom(roomID) {
  roomsRef.child(`${roomId}`).set(null);
}

module.exports = {
  setHost,
  setPlayer,
  setPlayerRoom,
  setPlayerScore,
  getPlayerRoom,
  getPlayersList,
  addPlayer,
  getRanking,
  setRanking
}
