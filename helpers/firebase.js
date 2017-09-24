const admin = require('firebase-admin');

// Enable hiding of sensitive information
require('dotenv').config();

var serviceAccount = {};
serviceAccount["type"] = process.env.TYPE;
serviceAccount["project_id"] = process.env.PROJECT_ID;
serviceAccount["private_key_id"] = process.env.PRIVATE_KEY_ID;
serviceAccount["private_key"] = process.env.PRIVATE_KEY;
serviceAccount["client_email"] = process.env.CLIENT_EMAIL;
serviceAccount["client_id"] = process.env.CLIENT_ID;
serviceAccount["auth_uri"] = process.env.AUTH_URI;
serviceAccount["token_uri"] = process.env.TOKEN_URI;
serviceAccount["auth_provider_x509_cert_url"] = process.env.FIREBASE_AUTH_CERT;
serviceAccount["client_x509_cert_url"] = process.env.FIREBASE_CLIENT_CERT;;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

var db = admin.database();
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
 * Listen to ranking by roomID
 * @param roomId
 */
function listenToRanking(roomId, callback) {
  roomsRef.child(`${roomId}/ranking`).on('value', snapshot => {
    return callback(snapshot.val());
  });
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
  setRanking,
  listenToRanking
}
