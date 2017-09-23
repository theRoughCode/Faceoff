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
var roomsRef = db.ref('rooms');

/*
 * roomId: {{ hostName: *, players: { sessionId: { playerName: *, playerScore: *, isHost: * }} }}
 */

/*
 * Set host by roomID
 * @param hostData {{ hostName: *, hostScore: *, sessionId: * }}
 */
function setHost(roomId, hostData, callback) {
  roomsRef.child(`${roomId}/hostName`).set(hostData.hostName).then(() => {
    const data = {
      "playerName": hostData.hostName,
      "playerScore": hostData.hostScore,
      "isHost": true
    };
    return callback(roomsRef.child(`${roomId}/players/${hostData.sessionId}`).set(data));
  })
}

/*
 * Set playerData by roomID
 * @param playerData {{ playerName: *, playerScore: *, sessionId: * }}
 */
function setPlayer(roomId, playerData, callback) {
  const data = {
    "playerName": playerData.playerName,
    "playerScore": playerData.playerScore,
    "isHost": false
  };
  return callback(roomsRef.child(`${roomId}/players/${playerData.sessionId}`).set(data));
}

/*
 * Retrieve players by roomID
 */
function getPlayers(roomId, callback) {
  return roomsRef.child(`${roomId}/players`).once('value');
}

module.exports = {
  setHost,
  setPlayer,
  getPlayers
}
