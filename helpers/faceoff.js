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
    gameSocket.on('addRoom', addRoom);
    gameSocket.on('populateTable', populateTable);

    // Player Events
    gameSocket.on('playerJoinGame', playerJoinGame);
    gameSocket.on('playerSmiled', playerSmiled);
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
    console.log('hostCreateNewGame');
    console.log(data);
    this.emit('newGameCreated', {
      gameId: thisGameId,
      mySocketId: this.id,
      numPlayers: data.numPlayers
    });

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
 * Add new room to database
 * @param data Sent from the client. Contains the room and host info
 * { gameId : *, playerName : *, sessionId : * }
 */
function addRoom(data) {
    database.addRoom(data.gameId, data.playerName, 0, data.sessionId, data.numPlayers);
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
      formatScores(players, arr => {
        io.sockets.in(gameId).emit('populateTable', arr);

        isRoundOver(gameId, res => {
          if(!res.length) return io.sockets.in(gameId).emit('gameOver', arr);
          else if (res.length === 1) {
            var count = 0;
            for (var i = 0; i < arr.length; i++) {
              count++;
              if (arr[i].sessionId === res[0].sessionId) {
                arr[i].score = arr[0].score + 10;
                var winner = arr.splice(i, 1);
                arr.unshift(...winner);
                return io.sockets.in(gameId).emit('gameOver', arr);
              } else if (count >= arr.length - 1) {
                io.sockets.in(gameId).emit('gameOver', arr);
              }
            }
          }
        });
      }));
}

function formatScores(players, callback) {
  const res = [];
  async.forEachOf(players, (value, key, callback1) => {
    res.push({
      'sessionId': key,
      'name': value.name,
      'score': value.score
    });
    callback1();
  }, err => {
    if (err) {
      console.error('Failed to format scores');
      return callback(null);
    } else {
      res.sort((a, b) => {
        return ((a.score < b.score) ? 1 :
               (a.score > b.score) ? -1 : 0);
      });
      return callback(res);
    }
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

/* *************************
   *                       *
   *      GAME LOGIC       *
   *                       *
   ************************* */


 function isRoundOver(roomId, callback) {
   const res = [];
   database.getPlayersList(roomId)
     .then(snapshot => {
       if (!snapshot.val()) return false;
       async.forEachOf(snapshot.val(), (value, key, callback1) => {
         if (!value.eliminated) {
           res.push({
             'sessionId': key,
             'name': value.playerName,
             'score': value.playerScore
           });
         }
         callback1();
       }, err => {
         if (err) {
           console.error('Failed to format scores');
           return callback(null);
         }
         return callback(res);
       });
     });
 }
