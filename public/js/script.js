const THRESHOLD = 0.75;
var intervalClearID; // bad but since setInterval what returns the ID, there's not much you can do
var playPromise;

function handleResult(score) {
	if (score > THRESHOLD) {
		App.smiled();
	}
}


/**
 * The API will call this function when the video player is ready.
 */
function onPlayerReady(event) {
	const data = {
		'roomId' : App.gameId,
		'sessionId' : App.mySocketId
	}
	//IO.socket.emit('ytReady', data);  // TODO: notify others that your video is ready
	event.target.playVideo();
	App.YT.started = true;
}

/**
 * The API calls this function when the player's state changes.
 *    The function indicates that when playing a video (state=1),
 *    the player should play for six seconds and then stop.
 */
function onPlayerStateChange(event) {
	if (event.data == YT.PlayerState.PLAYING && !App.YT.done) App.videoEnded();
}

/**
 * This function creates an <iframe> (and YouTube player)
 *    after the API code downloads.
 */
function onYouTubeIframeAPIReady() {
	App.YT.player = new YT.Player('yt', {
    height: '390',
    width: '640',
		videoId: App.YT.url,
		events: {
			'onReady': onPlayerReady,
			'onStateChange': onPlayerStateChange
		}
	});
}

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
			  playPromise = Video.video.play();
		  })
		  .catch(err => console.log("An error occured! " + err));

		// Notify DOM when video actually begins playing
		Video.video.addEventListener('canplay', function(ev) {
		  if (!Video.streaming) {
  			Video.height = Video.video.videoHeight / (Video.video.videoWidth/Video.width);

  			Video.video.setAttribute('width', Video.width);
  			Video.video.setAttribute('height', Video.height);
  			Video.canvas.setAttribute('width', Video.width);
  			Video.canvas.setAttribute('height', Video.height);
  			Video.streaming = true;
  			intervalClearID = setInterval(() => Video.processImage(), 200);
		  }
		}, false);
	},

	processImage : function() {
		Video.ctx = Video.canvas.getContext('2d');
		if (Video.width && Video.height) {
			Video.canvas.width = Video.width;
			Video.canvas.height = Video.height;
			Video.ctx.drawImage(Video.video, 0, 0, Video.width, Video.height);

			// So that it works when you quit a game
			if (canvas) {
				canvas.toBlob(blob => Video.sendFrame(blob));
			}
		}
	},

	sendFrame : function(blob) {
		var formData = new FormData();
		formData.append("testblob", blob, "testblob");

		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function(){
			if (this.readyState == 4){
				if (this.status == 200)
					handleResult(parseFloat(this.response));
				else if (this.status == 418) {
					console.log('Face not found!');
				}
				else {
					console.log('camera error');
				}
			}
		};

		xhr.open("POST", "/azureblob", true);
		xhr.send(formData);
	}
}

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
		IO.socket.on('populateTable', IO.populateTable);
		IO.socket.on('updateTable', IO.updateTable);
		IO.socket.on('playVideo', IO.playVideo);
		IO.socket.on('gameOver', IO.gameOver);
	},

	/**
	 * The client is successfully connected!
	 */
	onConnected : function(data) {
		// Cache a copy of the client's socket.IO session ID on the App
		App.mySocketId = IO.socket.sessionid;
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
		document.removeEventListener('keypress', App.Player.onPlayerStartClick);
		App.mySocketId = data.mySocketId;
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
	 * Populate leaderboards
	 * @param data
	 */
	populateTable : function(players) {
		App.populateTable(players);
		Video.startup();
	},

	/**
	 * Update leaderboards
	 * @param data
	 */
	updateTable : function(players) {
		if (App.YT.started) App.updateTable(players);
	},

	/**
	 * Plays video
	 * @param data
	 */
	playVideo : function(data) {
		// Update the current round
		App.currentRound = data.round;

		// Load the video for the Host and Player
		//App.Player.loadVideo(data);
		App.YT.loadYT(data.url);
	},

	/**
	 * Let everyone know the game has ended.
	 * @param data
	 */
	gameOver : function(data) {
		App.endGame(data);
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
     * The Socket.IO socket object identifier. This is unique for
     * each player and host. It is generated when the browser initially
     * connects to the server when the page loads for the first time.
     */
    mySocketId: '',

    /**
     * Contains references to player data
     */
    myName : '',

		/**
     * Identifies the nubmer of Players (2 - 5)
     */
    numPlayers: 0,

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
        App.templateEndGame = document.querySelector('#end-game-template').innerHTML;
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

				// Quit
				document.querySelector('#quit-btn').addEventListener('click', App.init);
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

		/**
     * Populates score table with users
     */
    populateTable: function(users) {
			if (!users) return;

			const scoreTable = document.querySelector('#scoreTable');
			scoreTable.innerHTML = '<tr><th>Rank</th><th>Name</th><th>Score</th></tr>';
			// Set avatars
			var list = document.querySelector('.player-list');
			list.innerHTML = '<li><video id="webcam" style="width: 20%; height: ; border: 2px solid rgb(255, 51, 51)"></video></li>';

			users.forEach((user, index) => {
				var tr = document.createElement('tr');
				var td1 = document.createElement('td');
				td1.setAttribute('id', 'rank');
				td1.style["text-align"] = 'left';
				td1.innerHTML = index + 1;
				tr.appendChild(td1);

				var td2 = document.createElement('td');
				td2.setAttribute('id', 'name');
				td2.style["text-align"] = 'center';
				td2.innerHTML = user.name;
				tr.appendChild(td2);

				var td3 = document.createElement('td');
				td3.setAttribute('id', 'score');
				td3.style["text-align"] = 'right';
				td3.innerHTML = user.score;
				tr.appendChild(td3);

				scoreTable.appendChild(tr);

				if (user.sessionId !== App.mySocketId) {
					var li = document.createElement('li');
					var fig = document.createElement('figure');

					var img = document.createElement('img');
					var imgNum = (index < 4) ? index : Math.round(Math.random() * 4);
					img.src = `../../views/avatars/av${imgNum + 1}.png`;
					fig.appendChild(img);

					var figcap = document.createElement('figcaption');
					figcap.append(user.name);
					fig.appendChild(figcap);

					li.appendChild(fig);
					list.appendChild(li);
				}
			});
    },

		/**
     * Update score table
     */
    updateTable: function(users) {
			if (!users) return;

			const scoreTable = document.querySelector('#scoreTable');
			var playerRows = scoreTable.querySelectorAll('tr');

			users.forEach((user, index) => {
				var row = playerRows[index + 1];

				row.querySelector('#name').innerHTML = user.name;
				row.querySelector('#score').innerHTML = user.score;
			});
    },

		/**
     * Show the initial Anagrammatix Title Screen
     * (with Start and Join buttons)
     */
    smiled: function() {
			App.YT.stopVideo();
    },

		/**
     * Video ended
     */
    videoEnded: function() {
			App.YT.done = true;
			const data = {
				gameId : App.gameId,
				playerName : App.myName,
				sessionId : App.mySocketId,
				elapsedTime : App.YT.player.getCurrentTime()
			};
			IO.socket.emit('playerDone', data);
    },

		/**
		 * Show the "Game Over" screen.
		 */
		endGame : function(arr) {
			App.gameArea.innerHTML = App.templateEndGame;

			document.querySelector('#description2').innerHTML = `1st Place : ${arr[0].name} (${arr[0].score} pts)`;
			document.querySelector('#description1').innerHTML = `2nd Place : ${arr[1].name} (${arr[1].score} pts)`;
			if (arr.length > 2) document.querySelector('#description3').innerHTML = `3rd Place : ${arr[2].name} (${arr[2].score} pts)`;

			var mainMenuBtn = document.querySelector('#btnMainMenu');
			var newLobbyBtn = document.querySelector('#btnNewLobby');
			mainMenuBtn.addEventListener('click', App.init);
			newLobbyBtn.addEventListener('click', App.Host.onCreateClick);
		},

		/* *******************************
       *         YT CODE           *
       ******************************* */

	YT : {

			/**
	     * YouTube player reference
	     */
	    player: '',

			/**
	     * true if video is done playing
	     */
	    done: false,

			/**
	     * true if video has been playing
	     */
	    started: false,

			/**
	     * true if video has been playing
	     */
	    url: '',

			/**
	     * Load YouTube player
	     */
	    loadYT: function(url) {
				var tag = document.createElement('script');

	      tag.src = "https://www.youtube.com/iframe_api";
	      var firstScriptTag = document.getElementsByTagName('script')[0];
	      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

				App.YT.url = url;
	    },

			/**
	     * Stop YouTube video
	     */
	    stopVideo: function() {
				if (!App.YT.started) return;

				var elapsedTime = App.YT.player.getCurrentTime();

				// stop sending feed to azure
				clearInterval(intervalClearID);
				App.YT.player.pauseVideo();

				const data = {
					gameId : App.gameId,
					playerName : App.myName,
					sessionId : App.mySocketId,
					elapsedTime : elapsedTime
				};

				IO.socket.emit('playerDone', data);
	    }
	},

    /* *******************************
       *         HOST CODE           *
       ******************************* */
    Host : {

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
            App.Host.numPlayersInRoom = 1;
						App.numPlayers = data.numPlayers;

            // collect data to send to the server
            var data = {
                gameId : App.gameId,
                playerName : App.myName,
                sessionId : App.mySocketId,
								numPlayers : App.numPlayers
            };

            App.Host.displayLobbyScreen();

            // Send the host data
            IO.socket.emit('addRoom', data);

            console.log("Game started with ID: " + App.gameId + ' by host: ' + App.myName);
        },

        /**
         * Set up new lobby
         */
        displayNewGameScreen : function() {
            // Fill the game screen with the appropriate HTML
            App.gameArea.innerHTML = App.templateNewGame;

            document.querySelector('#btnHost').addEventListener('click', App.Host.onHostClick);
						document.addEventListener('keypress', App.Host.onHostClick);
        },

        /*
         *  Host lobby
         */
         onHostClick : function(e) {
					 // Check if enter key
					 if (e.type === 'keypress') {
						 if (e.keyCode !== 13) return;
						 else document.removeEventListener('keypress', App.Player.onHostClick);
					 }

           // collect data to send to the server
					 App.numPlayers = parseInt(document.querySelector('#numPlayers').value);
           var data = {
               hostName : document.querySelector('#inputHostName').value || 'anon',
							 numPlayers : App.numPlayers
           };
           // Send the gameId and playerName to the server
           IO.socket.emit('hostCreateNewGame', data);

           // Set the appropriate properties for the current player.
           App.myRole = 'Host';
           App.myName = data.hostName;
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
            if (App.Host.numPlayersInRoom === App.numPlayers) {
                console.log('Room is full. Almost ready!');

                // Let the server know that two players are present.
                IO.socket.emit('hostRoomFull', App.gameId);
            }
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
         * Click handler for the 'JOIN' button
         */
        onJoinClick: function () {
            // Display the Join Game HTML on the player's screen.
            App.gameArea.innerHTML = App.templateJoinGame;

            document.querySelector('#btnStart').addEventListener('click', App.Player.onPlayerStartClick);
						document.addEventListener('keypress', App.Player.onPlayerStartClick);
        },

        /**
         * The player entered their name and gameId (hopefully)
         * and clicked Start.
         */
        onPlayerStartClick: function(e) {
						// Check if enter key
						if (e.type === 'keypress' && e.keyCode !== 13) return;

            // collect data to send to the server
            var data = {
                gameId : document.querySelector('#inputGameId').value,
                playerName : document.querySelector('#inputPlayerName').value || 'Anonymous',
                isHost : false
            };

            // Send the gameId and playerName to the server
            IO.socket.emit('playerJoinGame', data);

            // Set the appropriate properties for the current player.
            App.myRole = 'Player';
            App.myName = data.playerName;
        },

        /**
         *  Click handler for the "Start Again" button that appears
         *  when a game is over.
         */
        onPlayerRestart : function() {
            var data = {
                gameId : App.gameId,
                playerName : App.myName
            }
            IO.socket.emit('playerRestart',data);
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
							if (App.myRole === 'Host')
								IO.socket.emit('hostCountdownFinished', App.gameId);
            });

						setTimeout(() => IO.socket.emit('populateTable', App.gameId), 500);
        },

        /**
         * Show the list of words for the current round.
         * @param data{{mySocketId: *, gameId: *, url: *}}
         */
        loadVideo : function(data) {
            const PREFERENCES = '?modestbranding=1&disablekb=1&showinfo=0&controls=0';
            // Insert the video into the DOM
            document.querySelector('#video').setAttribute('src', data.url + PREFERENCES);
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
        el.innerHTML = startTime + " seconds until the game starts!";

        // console.log('Starting Countdown...');

        // Start a 1 second timer
        var timer = setInterval(countItDown,1000);

        // Decrement the displayed timer value on each 'tick'
        function countItDown(){
            startTime -= 1
						if (startTime == 1)
							el.innerHTML = startTime + " second until the game starts";
						else
							el.innerHTML = startTime + " seconds until the game starts";

            if( startTime <= 0 ){
                // console.log('Countdown Finished.');

                // Stop the timer and do the callback.
                clearInterval(timer);

								// clear the timer
								el.innerHTML = "";
                callback();
                return;
            }
        }

    }
};

IO.init();
App.init();
