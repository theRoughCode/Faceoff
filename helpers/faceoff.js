const database = require('./database');
const async = require('async');

var io;
var gameSocket;

/**
 * This function is called by index.js to initialize a new game instance.
 *
 * @param sio The Socket.IO library
 * @param socket The socket object for the connected client.
 */
exports.initGame = function(sio, socket){
    io = sio;
    gameSocket = socket;
    gameSocket.emit('connected', { message: "You are connected!" });

    // Host Events
    gameSocket.on('hostCreateNewGame', hostCreateNewGame);
    gameSocket.on('hostRoomFull', hostPrepareGame);
    gameSocket.on('hostCountdownFinished', hostStartGame);
    //gameSocket.on('hostNextRound', hostNextRound);
    gameSocket.on('addRoom', addRoom);
    gameSocket.on('populateTable', populateTable);

    // Player Events
    gameSocket.on('playerJoinGame', playerJoinGame);
    gameSocket.on('playerSmiled', playerSmiled);
    //gameSocket.on('playerAnswer', playerAnswer);
    //gameSocket.on('playerRestart', playerRestart);
}


/* *******************************
   *                             *
   *       HOST FUNCTIONS        *
   *                             *
   ******************************* */

/**
 * The 'Host Game' button was clicked and 'hostCreateNewGame' event occurred.
 */
function hostCreateNewGame(data) {
    console.log(`Host ${data.hostName} has created a new lobby!`);
    // Create a unique Socket.IO Room
    var thisGameId = ( Math.random() * 100000 ) | 0;

    // Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
    this.emit('newGameCreated', {gameId: thisGameId, mySocketId: this.id});

    // Join the Room and wait for the players
    this.join(thisGameId.toString());
};

/*
 * Two players have joined. Alert the host!
 * @param gameId The game ID / room ID
*/
function hostPrepareGame(gameId) {
    var data = {
        mySocketId : this.id,
        gameId : gameId
    };
    console.log("All Players Present. Preparing game...");
    io.sockets.in(data.gameId).emit('beginNewGame', data);
}

/*
 * The Countdown has finished, and the game begins!
 * @param gameId The game ID / room ID
 */
function hostStartGame(gameId) {
    database.getVideos(videos => {
      const vals = [];
      async.forEachOf(videos, (url, key, callback) => {
        vals.push(url);
        callback();
      }, err => {
        if(err) console.error(err);
        else {
          var rand = Math.random() * vals.length;
          var data = {
              mySocketId : this.id,
              gameId : gameId,
              url : vals[Math.round(rand)]
          };
          io.sockets.in(data.gameId).emit('playVideo', data);
        }
      });
    });
};

/**
 * A player answered correctly. Time for the next word.
 * @param data Sent from the client. Contains the current round and gameId (room)
 */
function hostNextRound(data) {
    if(data.round < wordPool.length ){
        // Send a new set of words back to the host and players.
        //sendWord(data.round, data.gameId);
    } else {
        // If the current round exceeds the number of words, send the 'gameOver' event.
        io.sockets.in(data.gameId).emit('gameOver',data);
    }
}

/**
 * Add new room to database
 * @param data Sent from the client. Contains the room and host info
 * { gameId : *, playerName : *, sessionId : * }
 */
function addRoom(data) {
    database.addRoom(data.gameId, data.playerName, 0, data.sessionId);
}

/**
 * Add new room to database
 * @param data Sent from the client. Contains the room and host info
 * { gameId : *, playerName : *, sessionId : * }
 */
function populateTable(gameId) {
    database.getRanking(gameId, players =>
      formatScores(players, arr =>
        io.sockets.in(gameId).emit('populateTable', arr)));
    database.listenToRanking(gameId, players =>
      formatScores(players, arr =>
        io.sockets.in(gameId).emit('populateTable', arr)));
}

function formatScores(players, callback) {
  async.map(players, (data, callback) => {
    callback(null, data);
  }, (err, res) => {
    if (err) return console.error('Failed to format scores');

    res.sort((a, b) => {
      return ((a.score < b.score) ? 1 :
             (a.score > b.score) ? -1 : 0);
    });
    return callback(res);
  });
}

/* *****************************
   *                           *
   *     PLAYER FUNCTIONS      *
   *                           *
   ***************************** */

/**
 * A player clicked the 'START GAME' button.
 * Attempt to connect them to the room that matches
 * the gameId entered by the player.
 * @param data Contains data entered via player's input - playerName and gameId.
 */
function playerJoinGame(data) {
    console.log('Player ' + data.playerName + 'attempting to join game: ' + data.gameId );

    // A reference to the player's Socket.IO socket object
    var sock = this;

    // Look up the room ID in the Socket.IO manager object.
    var room = io.sockets.adapter.rooms[data.gameId];

    // If the room exists...
    if( room != undefined ){
        // attach the socket id to the data object.
        data.mySocketId = sock.id;

        // Join the room
        sock.join(data.gameId);

        //console.log('Player ' + data.playerName + ' joining game: ' + data.gameId );

        // Emit an event notifying the clients that the player has joined the room.
        io.sockets.in(data.gameId).emit('playerJoinedRoom', data);

        database.addPlayer(data.gameId, data.playerName, 0, data.mySocketId);

    } else {
        // Otherwise, send an error message back to the player.
        this.emit('errorMsg',{message: "This room does not exist."} );
    }
}

/**
 * A player has tapped a word in the word list.
 * @param data gameId, playerName, sessionId, elapsedTime (in seconds)
 */
function playerSmiled(data) {
    database.updateScore(data.gameId, data.playerName, Math.round(data.elapsedTime), data.sessionId);
}

/**
 * The game is over, and a player has clicked a button to restart the game.
 * @param data
 */
function playerRestart(data) {
    // console.log('Player: ' + data.playerName + ' ready for new game.');

    // Emit the player's data back to the clients in the game room.
    data.playerId = this.id;
    io.sockets.in(data.gameId).emit('playerJoinedRoom',data);
}

/* *************************
   *                       *
   *      GAME LOGIC       *
   *                       *
   ************************* */
