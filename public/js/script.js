const MAXPLAYERSPERROOM = 3;

var Video = {
  width : 320,    // We will scale the photo width to this
  height : 0,     // This will be computed based on the input stream
  streaming : false,
  video : null,
  canvas : null,
  ctx : null,

  startup : function() {
    Video.video = document.getElementById('webcam');
    Video.canvas = document.getElementById('canvas');

    // Get media stream
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      .then(stream => {
          Video.video.src = window.URL.createObjectURL(stream);
          Video.video.play();
      })
      .catch(err => console.log("An error occured! " + err));

    // Notify DOM when video actually begins playing
    Video.video.addEventListener('canplay', function(ev){
      if (!Video.streaming) {
        Video.height = Video.video.videoHeight / (Video.video.videoWidth/Video.width);

        Video.video.setAttribute('width', Video.width);
        Video.video.setAttribute('height', Video.height);
        Video.canvas.setAttribute('width', Video.width);
        Video.canvas.setAttribute('height', Video.height);
        Video.streaming = true;

        //setInterval(() => console.log(Video.getBase64Image()), 200);
      }
    }, false);
  },

  getBase64Image : function() {
    Video.ctx = Video.canvas.getContext('2d');

    if (Video.width && Video.height) {
      Video.canvas.width = Video.width;
      Video.canvas.height = Video.height;
      Video.ctx.drawImage(Video.video, 0, 0, Video.width, Video.height);
      return canvas.toDataURL("image/png");
    }
  }
};

/**
* All the code relevant to Socket.IO is collected in the IO namespace.
*
* @type {{init: Function, bindEvents: Function, onConnected: Function, onNewGameCreated: Function, playerJoinedRoom: Function, beginNewGame: Function, playVideo: Function, hostCheckAnswer: Function, gameOver: Function, error: Function}}
*/

var IO = {

    /**
     * This is called when the page is displayed. It connects the Socket.IO client
     * to the Socket.IO server
     */
    init : function() {
        IO.socket = io();
        IO.bindEvents();
    },

    /**
     * While connected, Socket.IO will listen to the following events emitted
     * by the Socket.IO server, then run the appropriate function.
     */
    bindEvents : function() {
        IO.socket.on('connected', IO.onConnected);
        IO.socket.on('errorMsg', IO.error);
        IO.socket.on('newGameCreated', IO.onNewGameCreated);
        IO.socket.on('playerJoinedRoom', IO.playerJoinedRoom );
        IO.socket.on('beginNewGame', IO.beginNewGame);
        IO.socket.on('playVideo', IO.playVideo);
        IO.socket.on('gameOver', IO.gameOver);
    },

    /**
     * The client is successfully connected!
     */
    onConnected : function(data) {
        // Cache a copy of the client's socket.IO session ID on the App
        App.mySocketId = IO.socket.sessionid;
        console.log(data.message);
    },

    /**
     * A new game has been created and a random game ID has been generated.
     * @param data {{ gameId: int, mySocketId: * }}
     */
    onNewGameCreated : function(data) {
        App.Host.gameInit(data);
    },

    /**
     * A player has successfully joined the game.
     * @param data {{playerName: string, gameId: int, mySocketId: int}}
     */
    playerJoinedRoom : function(data) {
        // When a player joins a room, do the updateWaitingScreen function.
        // There are two versions of this function: one for the 'host' and
        // another for the 'player'.
        //
        // So on the 'host' browser window, the App.Host.updateWaitingScreen function is called.
        // And on the player's browser, App.Player.updateWaitingScreen is called.
        App[App.myRole].updateWaitingScreen(data);
    },

    /**
     * Both players have joined the game.
     * @param data
     */
    beginNewGame : function(data) {
        App.Player.gameCountdown(data);
    },

    /**
     * Plays video
     * @param data
     */
    playVideo : function(data) {
        // Update the current round
        App.currentRound = data.round;

        // Load the video for the Host and Player
        App.Player.loadVideo(data);
    },

    /**
     * A player answered. If this is the host, check the answer.
     * @param data
     */
    hostCheckAnswer : function(data) {
        if(App.myRole === 'Host') {
            App.Host.checkAnswer(data);
        }
    },

    /**
     * Let everyone know the game has ended.
     * @param data
     */
    gameOver : function(data) {
        App[App.myRole].endGame(data);
    },

    /**
     * An error has occurred.
     * @param data
     */
    error : function(data) {
        alert(data.message);
    }

};

var App = {

    /**
     * Keep track of the gameId, which is identical to the ID
     * of the Socket.IO Room used for the players and host to communicate
     *
     */
    gameId: 0,

    /**
     * This is used to differentiate between 'Host' and 'Player' browsers.
     */
    myRole: '',   // 'Player' or 'Host'

    /**
     * Contains references to player data
     */
    players : [],

    /**
     * The Socket.IO socket object identifier. This is unique for
     * each player and host. It is generated when the browser initially
     * connects to the server when the page loads for the first time.
     */
    mySocketId: '',

    /**
     * Identifies the current round. Starts at 0 because it corresponds
     * to the array of word data stored on the server.
     */
    currentRound: 0,

    /* *************************************
     *                Setup                *
     * *********************************** */

    /**
     * This runs when the page initially loads.
     */
    init: function () {
        App.cacheElements();
        App.showInitScreen();
        App.bindEvents();
    },

    /**
     * Create references to on-screen elements used throughout the game.
     */
    cacheElements: function () {
        // Templates
        App.gameArea = document.querySelector('#gameArea');
        App.templateIntroScreen = document.querySelector('#intro-screen-template').innerHTML;
        App.templateNewGame = document.querySelector('#create-game-template-1').innerHTML;
        App.templateHostGame = document.querySelector('#create-game-template-2').innerHTML;
        App.templateJoinGame = document.querySelector('#join-game-template').innerHTML;
        App.gameDisplay = document.querySelector('#game-template').innerHTML;
    },

    /**
     * Create some click handlers for the various buttons that appear on-screen.
     */
    bindEvents: function () {
        // Host
        document.querySelector('#btnCreateGame').addEventListener('click', App.Host.onCreateClick);

        // Player
        document.querySelector('#btnJoinGame').addEventListener('click', App.Player.onJoinClick);
    },

    /* *************************************
     *             Game Logic              *
     * *********************************** */

    /**
     * Show the initial Anagrammatix Title Screen
     * (with Start and Join buttons)
     */
    showInitScreen: function() {
        App.gameArea.innerHTML = App.templateIntroScreen;
    },


    /* *******************************
       *         HOST CODE           *
       ******************************* */
    Host : {
        /**
         * Contains references to player data
         */
        myName : '',

        /**
         * Flag to indicate if a new game is starting.
         * This is used after the first game ends, and players initiate a new game
         * without refreshing the browser windows.
         */
        isNewGame : false,

        /**
         * Keep track of the number of players that have joined the game.
         */
        numPlayersInRoom: 0,

        /**
         * A reference to the correct answer for the current round.
         */
        currentCorrectAnswer: '',

        /**
         * Handler for the "Start" button on the Title Screen.
         */
        onCreateClick: function () {
            App.Host.displayNewGameScreen();
        },

        /**
         * The Host screen is displayed for the first time.
         * @param data{{ gameId: int, mySocketId: * }}
         */
        gameInit: function (data) {
            App.gameId = data.gameId;
            App.mySocketId = data.mySocketId;
            App.myRole = 'Host';
            App.Host.numPlayersInRoom = 0;

            // collect data to send to the server
            var data = {
                gameId : App.gameId,
                playerName : App.Host.myName,
                sessionId : App.mySocketId
            };

            App.Host.displayLobbyScreen();

            // Send the host data
            IO.socket.emit('addRoom', data);

            console.log("Game started with ID: " + App.gameId + ' by host: ' + App.Host.myName);
        },

        /**
         * Set up new lobby
         */
        displayNewGameScreen : function() {
            // Fill the game screen with the appropriate HTML
            App.gameArea.innerHTML = App.templateNewGame;

            document.querySelector('#btnHost').addEventListener('click', App.Host.onHostClick);
        },

        /*
         *  Host lobby
         */
         onHostClick : function() {
           // collect data to send to the server
           var data = {
               hostName : document.querySelector('#inputHostName').value || 'anon'
           };

           // Send the gameId and playerName to the server
           IO.socket.emit('hostCreateNewGame', data);

           // Set the appropriate properties for the current player.
           App.myRole = 'Host';
           App.Host.myName = data.hostName;
         },

        /**
         * Show the Host screen containing the game URL and unique game ID
         */
        displayLobbyScreen : function() {
            // Fill the game screen with the appropriate HTML
            App.gameArea.innerHTML = App.templateHostGame;

            // Display the URL on screen
            document.querySelector('#gameURL').innerHTML = window.location.href;

            // Show the gameId / room id on screen
            document.querySelector('#spanNewGameCode').innerHTML = App.gameId;
        },

        /**
         * Update the Host screen when the first player joins
         * @param data{{playerName: string}}
         */
        updateWaitingScreen: function(data) {
            // If this is a restarted game, show the screen.
            if ( App.Host.isNewGame ) {
                App.Host.displayNewGameScreen();
            }

            // TODO: Check if same user joins
            // Update host screen
            var newP = document.createElement('P');
            document.querySelector('#playersWaiting')
                .appendChild(newP)
                .innerHTML = 'Player ' + data.playerName + ' joined the game.';

            // Increment the number of players in the room
            App.Host.numPlayersInRoom += 1;

            // If two players have joined, start the game!
            if (App.Host.numPlayersInRoom === MAXPLAYERSPERROOM) {
                console.log('Room is full. Almost ready!');

                // Let the server know that two players are present.
                IO.socket.emit('hostRoomFull', App.gameId);
            }
        },

        /**
         * Check the answer clicked by a player.
         * @param data{{round: *, playerId: *, answer: *, gameId: *}}
         */
        checkAnswer : function(data) {
            // Verify that the answer clicked is from the current round.
            // This prevents a 'late entry' from a player whos screen has not
            // yet updated to the current round.
            if (data.round === App.currentRound){

                // Get the player's score
                var pScore = document.querySelector('#' + data.playerId);

                // Advance player's score if it is correct
                if( App.Host.currentCorrectAnswer === data.answer ) {
                    // Add 5 to the player's score
                    pScore.innerHTML = pScore.innerHTML + 5;

                    // Advance the round
                    App.currentRound += 1;

                    // Prepare data to send to the server
                    var data = {
                        gameId : App.gameId,
                        round : App.currentRound
                    }

                    // Notify the server to start the next round.
                    IO.socket.emit('hostNextRound',data);

                } else {
                    // A wrong answer was submitted, so decrement the player's score.
                    pScore.innerHTML = pScore.innerHTML - 3 ;
                }
            }
        },


        /**
         * All 10 rounds have played out. End the game.
         * @param data
         */
        endGame : function(data) {
            // Get the data for player 1 from the host screen
            var p1 = document.querySelector('#player1Score');
            var p1Score = p1.querySelector('.score').innerHTML;
            var p1Name = p1.querySelector('.playerName').innerHTML;

            // Get the data for player 2 from the host screen
            var p2 = document.querySelector('#player2Score');
            var p2Score = p2.querySelector('.score').innerHTML;
            var p2Name = p2.querySelector('.playerName').innerHTML;

            // Find the winner based on the scores
            var winner = (p1Score < p2Score) ? p2Name : p1Name;
            var tie = (p1Score === p2Score);

            // Display the winner (or tie game message)
            if(tie){
                document.querySelector('#hostWord').innerHTML = "It's a Tie!";
            } else {
                document.querySelector('#hostWord').innerHTML =  winner + ' Wins!!';
            }

            // Reset game data
            App.Host.numPlayersInRoom = 0;
            App.Host.isNewGame = true;
        },

        /**
         * A player hit the 'Start Again' button after the end of a game.
         */
        restartGame : function() {
            App.gameArea.innerHTML = App.templateNewGame;
            document.querySelector('#spanNewGameCode').innerHTML = App.gameId;
        }
    },


    /* *****************************
       *        PLAYER CODE        *
       ***************************** */

    Player : {

        /**
         * A reference to the socket ID of the Host
         */
        hostSocketId: '',

        /**
         * The player's name entered on the 'Join' screen.
         */
        myName: '',

        /**
         * Click handler for the 'JOIN' button
         */
        onJoinClick: function () {
            // Display the Join Game HTML on the player's screen.
            App.gameArea.innerHTML = App.templateJoinGame;

            document.querySelector('#btnStart').addEventListener('click', App.Player.onPlayerStartClick);
        },

        /**
         * The player entered their name and gameId (hopefully)
         * and clicked Start.
         */
        onPlayerStartClick: function() {
            console.log('Player clicked "Start"');

            // collect data to send to the server
            var data = {
                gameId : document.querySelector('#inputGameId').value,
                playerName : document.querySelector('#inputPlayerName').value || 'anon',
                isHost : false
            };

            // Send the gameId and playerName to the server
            IO.socket.emit('playerJoinGame', data);

            // Set the appropriate properties for the current player.
            App.myRole = 'Player';
            App.Player.myName = data.playerName;
        },

        /**
         *  Click handler for the Player hitting a word in the word list.
         */
        onPlayerAnswerClick: function() {
            // console.log('Clicked Answer Button');
            var btn = this;      // the tapped button
            var answer = btn.value; // The tapped word

            // Send the player info and tapped word to the server so
            // the host can check the answer.
            var data = {
                gameId: App.gameId,
                playerId: App.mySocketId,
                answer: answer,
                round: App.currentRound
            }
            IO.socket.emit('playerAnswer',data);
        },

        /**
         *  Click handler for the "Start Again" button that appears
         *  when a game is over.
         */
        onPlayerRestart : function() {
            var data = {
                gameId : App.gameId,
                playerName : App.Player.myName
            }
            IO.socket.emit('playerRestart',data);
            App.currentRound = 0;
            document.querySelector('#gameArea').innerHTML = "<h3>Waiting on host to start new game.</h3>";
        },

        /**
         * Display the waiting screen for player 1
         * @param data
         */
        updateWaitingScreen : function(data) {
            if(IO.socket.id === data.mySocketId){
                App.myRole = 'Player';
                App.gameId = data.gameId;

                document.getElementById('btnStart').style.display = 'none';
                var p = document.createElement('P');
                document.querySelector('#playerWaitingMessage')
                    .appendChild(p)
                    .innerHTML = 'Joined Game ' + data.gameId + '. Please wait for game to begin.';
            }
        },

        /**
         * Display 'Get Ready' while the countdown timer ticks down.
         * @param hostData
         */
        gameCountdown : function(hostData) {
            const COUNTDOWNTIME = 5;
            App.Player.hostSocketId = hostData.mySocketId;

            // Prepare the game screen with new HTML
            App.gameArea.innerHTML = App.gameDisplay;

            // Begin the on-screen countdown timer
            var secondsLeft = document.querySelector('#timer');
            App.countDown(secondsLeft, COUNTDOWNTIME, function(){
                IO.socket.emit('hostCountdownFinished', App.gameId);
            });

            // Display the players' names on screen
            var player1Score = document.querySelector('#player1Score');
            var player2Score = document.querySelector('#player2Score');
            player1Score.querySelector('.playerName').innerHTML = App.players[0].playerName;

            player2Score.querySelector('.playerName').innerHTML = App.players[1].playerName;

            // Set the Score section on screen to 0 for each player.
            player1Score.querySelector('.score').setAttribute('id',App.players[0].mySocketId);
            player2Score.querySelector('.score').setAttribute('id',App.players[1].mySocketId);
        },

        /**
         * Show the list of words for the current round.
         * @param data{{mySocketId: *, gameId: *, url: *}}
         */
        loadVideo : function(data) {
            const PREFERENCES = '?modestbranding=1&autoplay=1&disablekb=1&showinfo=0&controls=0';
            // Insert the video into the DOM
            document.querySelector('#video').setAttribute('src', data.url + PREFERENCES);
        },

        /**
         * Show the "Game Over" screen.
         */
        endGame : function() {
          var gameArea = document.querySelector('#gameArea');
          gameArea.innerHTML = ('<div class="gameOver">Game Over!</div>');

          var btn = document.createElement("BUTTON");
          btn.appendChild(document.createTextNode("Start Again"));
          btn.setAttribute('id','btnPlayerRestart');
          btn.className += 'btn';
          btn.className += 'btnGameOver';
          btn.addEventListener('click', App.Player.onPlayerRestart);
          gameArea.appendChild(btn);
        }
    },


    /* **************************
              UTILITY CODE
       ************************** */

    /**
     * Display the countdown timer on the Host screen
     *
     * @param $el The container element for the countdown timer
     * @param startTime
     * @param callback The function to call when the timer ends.
     */
    countDown : function(el, startTime, callback) {

        // Display the starting time on the screen.
        el.innerHTML = startTime;

        // console.log('Starting Countdown...');

        // Start a 1 second timer
        var timer = setInterval(countItDown,1000);

        // Decrement the displayed timer value on each 'tick'
        function countItDown(){
            startTime -= 1
            el.innerHTML = startTime;

            if( startTime <= 0 ){
                // console.log('Countdown Finished.');

                // Stop the timer and do the callback.
                clearInterval(timer);
                callback();
                return;
            }
        }

    }
};

Video.startup();
IO.init();
App.init();