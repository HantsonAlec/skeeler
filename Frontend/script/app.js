let tabel, dropdown, inputDifficulty, inputTimes, logout, name, email, toggle, filter, filterArea, timeFrameMemory, dateStart, dateEnd, dateStartValue, dateEndValue, scores, maxScores, scoresLessBtn, scoresMoreBtn, list_scores, startBtn, logoutBtn;
let personalScore = false,
	filterAreaEnable = false;

let timer, timerNavs, timerNavLeft, timerNavRight, timerSelected, countdown, gates, list_gate, gateNavs, gateOpen, gateNavLeft, gateNavRight, gateSelected, difficulties, times, deviceID;

let htmlGate = '',
	htmlGateNav = '';

let controlsStart, controlsEnd, gameStart, gameEnd, gamePause, gameMode, gamePaused, gameScore, annuleerBtn;
let popupFinished, popupStart, popupClose, popupStartInfo, popupInGame, loader;
let appLogs, appTimer, appCountdown, appMode;
let noteModeGreen, noteModeOrange;

let logs = '',
	list_log = '';

let gameTimer,
	timeLeft = 0,
	gateCounter = 0;

let gateData = {
	gate: [],
};

let timerData = [];
let modeData = [];
let recievers = [];
let gameData = {
	gates: [],
	seconds: [],
	timestamps: [],
	timer: 180,
	mode: 1,
};
let count = 0;
let isGameRunning = false;
let isFirstGate = true;
let isSetting = true;
let listening = true;
let pauseSetting = false;
const lanIP = `${window.location.hostname}:8000`;
console.log(lanIP);
const socket = io(lanIP);
var client = mqtt.connect('ws://13.81.105.139'); // you add a ws:// url here
client.subscribe('bikebattle/application/1/device/+/event/up');

/*----------------------------------POST FUNCTIONS---------------------------------- */
let scoreToDb = async (score) => {
	console.log('---------Game results---------');
	console.log(score);
	console.log(user['email']);
	console.log(times[timerSelected]['IDTime']);
	console.log(difficulties[gameData.mode]['IDDifficulty']);

	const ENDPOINT = `https://skeelerpiste.azurewebsites.net/api/addscores`;
	await fetch(`${ENDPOINT}`, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
		},
		body: JSON.stringify({
			AvgTime: 0.0,
			Score: score,
			DifficultyID: difficulties[gameData.mode]['IDDifficulty'],
			Email: user['email'],
			TimeID: times[timerSelected]['IDTime'],
		}),
	})
		.then((response) => response.json())
		.then((data) => console.log(data));
	location.href = '/';
};
/*----------------------------------SHOW FUNCTIONS---------------------------------- */
let showScores = (scores) => {
	let html = '';
	if (scores.length == 0) {
		html += `<div class="c-table-row">
		<div class="c-table__score">Geen scores gevonden</div>
	</div>`;
	} else {
		if (personalScore) {
			scores.forEach((score, index) => {
				console.log(score.registration.UserName);
				if (score.registration.Email == user['email']) {
					let name = score.registration.UserName == '' ? score.registration.NickName : `${score.registration.NickName}`;
					// let name = score.registration.UserName == '' ? score.registration.NickName : `${score.registration.NickName} (${score.registration.UserName})`;
					let date = new Date(score.ScoreDate);
					let medal = `#${index + 1}`;
					if (index == 0) {
						medal = `<i class="fas fa-medal" style="color:rgb(225, 180, 34)"></i>`;
					} else if (index == 1) {
						medal = `<i class="fas fa-medal" style="color:rgb(177, 178, 181)"></i>`;
					} else if (index == 2) {
						medal = `<i class="fas fa-medal" style="color:rgb(126, 82, 28)"></i>`;
					}
					html += `<div class="c-table-row js-score">
						<div class="c-table__score">${score.Score}</div>
						<div class="c-table__name">${name}</div>
						<div class="c-table__date">${date.toLocaleDateString()}</div>
						<div class="c-table__rank">${medal}</div>
					</div>`;
				}
			});
		} else {
			scores.forEach((score, index) => {
				console.log(score);
				let name = score.registration.UserName == '' ? score.registration.NickName : `${score.registration.NickName}`;
				// let name = score.registration.UserName == '' ? score.registration.NickName : `${score.registration.NickName} (${score.registration.UserName})`;
				let date = new Date(score.ScoreDate);
				let medal = `#${index + 1}`;
				if (index == 0) {
					medal = `<i class="fas fa-medal" style="color:rgb(225, 180, 34)"></i>`;
				} else if (index == 1) {
					medal = `<i class="fas fa-medal" style="color:rgb(177, 178, 181)"></i>`;
				} else if (index == 2) {
					medal = `<i class="fas fa-medal" style="color:rgb(126, 82, 28)"></i>`;
				}
				html += `<div class="c-table-row js-score">
						<div class="c-table__score">${score.Score}</div>
						<div class="c-table__name">${name}</div>
						<div class="c-table__date">${date.toLocaleDateString()}</div>
						<div class="c-table__rank">${medal}</div>
					</div>`;
			});
		}
	}

	tabel.innerHTML = html;

	list_scores = document.querySelectorAll('.js-score');
	showScoreboard();
};
/*----------------------------------LISTEN FUNCTIONS---------------------------------- */
let showScoreboard = () => {
	let counterScores = 0;
	for (let score of list_scores) {
		score.style.display = `none`;
		if (counterScores < maxScores) {
			score.style.display = `flex`;
		}
		counterScores++;
	}
};

let listenToScoreboardControls = () => {
	scoresLessBtn.addEventListener('click', () => {
		if (maxScores > 0) maxScores -= 5;
		showScoreboard();
	});

	scoresMoreBtn.addEventListener('click', () => {
		if (maxScores < list_scores.length) maxScores += 5;
		showScoreboard();
	});
};

let listenToDropdown = () => {
	dropdown.addEventListener('change', () => {
		//console.log(dropdown.options[dropdown.selectedIndex].value);
		getScores(dropdown.options[dropdown.selectedIndex].value, inputDifficulty.options[inputDifficulty.selectedIndex].value, inputTimes.options[inputTimes.selectedIndex].value);
	});
};
let listenToInputDifficulty = () => {
	inputDifficulty.addEventListener('change', () => {
		getScores(dropdown.options[dropdown.selectedIndex].value, inputDifficulty.options[inputDifficulty.selectedIndex].value, inputTimes.options[inputTimes.selectedIndex].value);
	});
};
let listenToInputTimes = () => {
	inputTimes.addEventListener('change', () => {
		getScores(dropdown.options[dropdown.selectedIndex].value, inputDifficulty.options[inputDifficulty.selectedIndex].value, inputTimes.options[inputTimes.selectedIndex].value);
	});
};
let listenToToggle = () => {
	toggle.addEventListener('click', () => {
		if (personalScore == false) {
			personalScore = true;
			console.log('Eigen score');
			getScores(dropdown.options[dropdown.selectedIndex].value, inputDifficulty.options[inputDifficulty.selectedIndex].value, inputTimes.options[inputTimes.selectedIndex].value);
		} else {
			personalScore = false;
			console.log('false');
			getScores(dropdown.options[dropdown.selectedIndex].value, inputDifficulty.options[inputDifficulty.selectedIndex].value, inputTimes.options[inputTimes.selectedIndex].value);
		}
	});
	filterArea.style.display = 'none';
	filter.addEventListener('click', () => {
		console.log('oeh');
		if (filterAreaEnable == false) {
			filterAreaEnable = true;
			filterArea.style.display = 'block';
		} else {
			filterAreaEnable = false;
			filterArea.style.display = 'none';
		}
	});
};
let listenToDate = () => {
	dateStart.addEventListener('change', () => {
		console.log('chnage start');
		dateStartValue = document.querySelector('.js-date_start').value;
		getScores('custom');
	});
	dateEnd.addEventListener('change', () => {
		console.log('chnage end');
		dateEndValue = document.querySelector('.js-date_end').value;
		getScores('custom');
	});
};
let listenToGateNav = () => {
	gateNavLeft.addEventListener('click', () => {
		console.log('gate Nav left');
		if (gateSelected != 0) {
			list_gate[gateSelected - 1].classList.remove('c-live-obstacle-bow--right');
			list_gate[gateSelected - 1].classList.remove('c-live-obstacle-bow--left');
			list_gate[gateSelected - 1].classList.add('c-live-obstacle-bow--selected');
			list_gate[gateSelected].classList.add('c-live-obstacle-bow--left');
			list_gate[gateSelected].classList.remove('c-live-obstacle-bow--selected');

			gateNavDot[gateSelected - 1].classList.add('c-navigation__dot--selected');
			gateNavDot[gateSelected].classList.remove('c-navigation__dot--selected');

			gateSelected--;
			console.log(gateSelected);

			listenToGateNavArrow();
		}
	});

	gateNavRight.addEventListener('click', () => {
		gateNavRightTrigger();
	});

	// Dot navigation code
	gateNavDot.forEach((dot) => {
		dot.addEventListener('click', () => {
			// gateSelected = dot.getAttribute("data-gate-nav");
			// console.log(gateSelected);
		});
	});
};

let listenToTimerNav = () => {
	timerNavDot = document.querySelectorAll('.js-timer-nav');

	timerNavLeft.addEventListener('click', () => {
		console.log('timer Nav left');

		if (timerSelected != 0) {
			timerNavRight.classList.add('c-timer-edit--selected');

			timerNavDot[timerSelected - 1].classList.add('c-navigation__dot--selected');
			timerNavDot[timerSelected].classList.remove('c-navigation__dot--selected');

			timerSelected--;

			timer.value = formatTimer(timerData[timerSelected]);
			gameData.timer = timerData[timerSelected];
		}
		if (timerSelected == 0) {
			timerNavLeft.classList.remove('c-timer-edit--selected');
		}
	});

	timerNavRight.addEventListener('click', () => {
		console.log('Timer Nav right');

		if (timerSelected != timerData.length - 1) {
			// timerNavRight.classList.add('c-timer-edit--selected');
			timerNavLeft.classList.add('c-timer-edit--selected');

			timerNavDot[timerSelected + 1].classList.add('c-navigation__dot--selected');
			timerNavDot[timerSelected].classList.remove('c-navigation__dot--selected');

			timerSelected++;

			timer.value = formatTimer(timerData[timerSelected]);
			gameData.timer = timerData[timerSelected];
		}
		if (timerSelected == timerData.length - 1) {
			timerNavRight.classList.remove('c-timer-edit--selected');
		}
	});
};

let listenToGateNavArrow = () => {
	if (gateSelected == 0) {
		gateNavLeft.classList.remove('c-live-arrow--selected');
	} else {
		gateNavLeft.classList.add('c-live-arrow--selected');
	}
	if (gateSelected == gateData.gate.length - 1) {
		gateNavRight.classList.remove('c-live-arrow--selected');
	} else {
		gateNavRight.classList.add('c-live-arrow--selected');
	}
};

let listenToGameControls = () => {
	for (let mode of gameMode) {
		mode.addEventListener('click', () => {
			gameData.mode = mode.getAttribute('data-game-mode');
			for (let modeToggle of gameMode) {
				modeToggle.classList.remove('c-field--selected');
			}

			mode.classList.add('c-field--selected');
			console.log(gameData);
			modeData = [difficulties[gameData.mode]['TimeGreen'], difficulties[gameData.mode]['TimeOrange']];

			noteModeGreen.innerHTML = `${modeData[0]} seconden`;
			noteModeOrange.innerHTML = `${modeData[1]} seconden`;

			console.log(modeData);
		});
	}
	gameEnd.addEventListener('click', () => {
		gameEndTrigger();
	});
	/* gameStart.addEventListener('click', () => {
		gameStartTrigger();
	}); */
	let pauseToggle = 0;
	gamePause.addEventListener('click', () => {
		if (pauseToggle % 2 == false) {
			gamePaused = true;
			sendSetting('pause');
			listening = false;
			gamePause.innerHTML = `Hervat <i class="fas fa-play"></i>`;
			console.log('Pause timer');
		} else {
			gamePaused = false;
			sendSetting('resume');
			listening = true;
			gamePause.innerHTML = `Pauze <i class="fas fa-pause"></i>`;
			console.log('Replay timer');
		}
		pauseToggle++;
	});
	gameSave.addEventListener('click', () => {
		// Stuur score naar database
		let scoreNu;
		scoreNu = calculateScore();
		scoreToDb(scoreNu);
	});
	popupStartInfo.addEventListener('click', () => {
		popupStart.style.display = 'grid';
	});
	annuleerBtn.addEventListener('click', () => {
		listening = false;
		sendSetting('stop');
	});
};

let listenToPopups = () => {
	popupFinished.style.display = 'none';
	popupStart.style.display = 'none';
	for (let close of popupClose) {
		close.addEventListener('click', () => {
			popupFinished.style.display = 'none';
			popupStart.style.display = 'none';
		});
	}
	popupStart.style.display = 'grid';
	//TIJDELIJK OP NONE NA SWITCH EVENTHUB TO MQTT
	loader.style.display = 'none';
	socket.on('B2F_send_loaded', (value) => {
		loader.style.display = 'none';
	});

	popupInGame.style.display = 'none';
};
let base64ToInt = (str) => {
	const raw = atob(str);
	let result = '';
	for (let i = 0; i < raw.length; i++) {
		const hex = raw.charCodeAt(i).toString(16);
		result += hex.length === 2 ? hex : '0' + hex;
	}
	return parseInt(result);
};
let sendSetting = (type) => {
	isSetting = true;
	if (type == 'start') {
		isGameRunning = true;
		pauseSetting = false;
	} else if (type == 'stop') {
		isGameRunning = false;
		pauseSetting = false;
	} else if (type == 'pause') {
		isGameRunning = false;
		pauseSetting = true;
	} else if (type == 'resume') {
		isGameRunning = true;
		pauseSetting = true;
	}
	//Opstellen van bits en omzetten naar bytes
	let bits = byteString(isSetting === true ? 1 : 0, 2) + byteString(modeData[0], 6) + byteString(pauseSetting === true ? 1 : 0, 1) + byteString(isGameRunning === true ? 1 : 0, 1) + byteString(modeData[1], 6);
	let maskedBits = ('0000000000000000' + bits).substr(-16);
	console.log(maskedBits);
	let bytes = maskedBits.match(/.{1,8}/g);
	let string = new Uint8Array(bytes.length);
	for (var i = 0; i < bytes.length; i++) {
		string[i] = parseInt(bytes[i], 2);
		console.log(string[i]);
	}
	//encoding
	var len = string.byteLength;
	let binary = '';
	for (var i = 0; i < len; i++) {
		binary += String.fromCharCode(string[i]);
	}
	let encodedString = btoa(binary);
	console.log(encodedString);
	let obj = { confirmed: true, fport: 10, data: encodedString };
	//Versturen payload
	client.publish('bikebattle/application/1/device/e6c93d8bc7dff4aa/command/down', JSON.stringify(obj));
};
let listenToMqtt = () => {
	client.on('message', function (topic, payload) {
		let data = JSON.parse(payload.toString());
		console.log(topic.toString());
		str = topic.toString();
		let encstring = data['data'];
		let decoded = base64ToInt(encstring);
		console.log(decoded);

		console.log(listening);
		console.log(gateData.gate[count]);
		//Wanneeer alle DEVUI --> in if toevoegen als recievedDev gelijk is aan expectedDev
		if (listening && decoded == gateData.gate[count]) {
			console.log('SEND TO NEXT GATE');
			// console.log([topic, payload].join(': '));
			console.log(count);
			if (count == 0) {
				count++;
				sendSetting('start');
				gameStartTrigger();
			} else {
				gateTrigger();
				count++;
			}
		}
	});
};

let listenToSockets = () => {
	// console.log(socket.connected);
	socket.on('B2F_acces_to_play', (value) => {
		let jsonObj = JSON.parse(value);
		console.log(jsonObj);
		if (jsonObj['acces'] == false && jsonObj['user'] != user['email']) {
			popupInGame.style.display = 'grid';
		} else {
			sendFirstGate();
		}
	});
};
let gateTrigger = () => {
	gateNavRightTrigger();

	if (gateOpen != 0) {
		clearInterval(gateTimer);

		gameData.gates.push(gateOpen);
		gameData.seconds.push(gateCounter);
		gameData.timestamps.push(timeLeft);
		console.log(gameData);
		showLog();
	}

	gateCounter = 0;
	console.log('Start gate timer');

	gateTimer = window.setInterval(function () {
		if (!gamePaused) {
			gateCounter++;
			// console.log('GATE - Seconds: ' + gateCounter);
		}
		gateSeconds[gateOpen].innerHTML = `${gateCounter} seconden`;

		if (gateCounter <= modeData[0]) {
			// green
			list_gate[gateOpen].classList.add('c-live-obstacle-bow--green');
		} else if (gateCounter < modeData[1] && gateCounter > modeData[0]) {
			// orange
			list_gate[gateOpen].classList.remove('c-live-obstacle-bow--green');
			list_gate[gateOpen].classList.add('c-live-obstacle-bow--orange');
		} else {
			list_gate[gateOpen].classList.remove('c-live-obstacle-bow--orange');
			list_gate[gateOpen].classList.add('c-live-obstacle-bow--red');
			// red
		}
	}, 1000);

	gateOpen++;
};

let gateNavRightTrigger = () => {
	console.log('gate Nav right');

	if (gateSelected != gateData.gate.length - 1) {
		list_gate[gateSelected + 1].classList.remove('c-live-obstacle-bow--right');
		list_gate[gateSelected + 1].classList.remove('c-live-obstacle-bow--left');
		list_gate[gateSelected + 1].classList.add('c-live-obstacle-bow--selected');
		list_gate[gateSelected].classList.add('c-live-obstacle-bow--right');
		list_gate[gateSelected].classList.remove('c-live-obstacle-bow--selected');

		gateNavDot[gateSelected + 1].classList.add('c-navigation__dot--selected');
		gateNavDot[gateSelected].classList.remove('c-navigation__dot--selected');

		gateSelected++;
		console.log(gateSelected);

		listenToGateNavArrow();
	}
};

let gameStartTrigger = () => {
	console.log('Start timer');
	// listenToSockets();

	countdown.value = formatTimer(gameData.timer);

	controlsEnd.style.display = 'block';
	controlsStart.style.display = 'none';
	appMode.style.display = 'none';
	appTimer.style.display = 'none';
	appLogs.style.display = 'block';
	appCountdown.style.display = 'block';

	let gateCounter = 0;

	gameTimer = window.setInterval(function () {
		if (!gamePaused) {
			gateCounter++;
			// console.log('TIMER - Seconds: ' + gateCounter);
		}
		timeLeft = gameData.timer - gateCounter;
		countdown.value = formatTimer(timeLeft);

		if (timeLeft == 0) {
			gameEndTrigger();
		}
	}, 1000);

	gateTrigger();
};

let gameEndTrigger = () => {
	sendSetting('stop');
	gameScore.innerHTML = calculateScore();
	clearInterval(gameTimer);
	clearInterval(gateTimer);
	popupFinished.style.display = 'grid';
	listening = false;
	console.log('Stop timer');
	gamePause.disabled = true;
};

let makeGame = () => {
	let nextrnd = 0;
	for (let index = 0; index < 23; index++) {
		nextrnd = Math.floor(Math.random() * 3 + 1);
		if (index > 0) {
			while (gateData.gate[index - 1] == nextrnd) {
				nextrnd = Math.floor(Math.random() * 3 + 1);
			}
			gateData.gate.push(nextrnd);
		} else {
			gateData.gate.push(1);
		}
	}
};

let formatTimer = (time) => {
	let mins = ('00' + ~~((time % 3600) / 60)).slice(-2);
	let secs = ('00' + (~~time % 60)).slice(-2);
	return `${mins}:${secs}`;
};

let byteString = (n, numZ) => {
	if (n < 0 || n > 255 || n % 1 !== 0) {
		throw new Error(n + ' does not fit in a byte');
	}
	let zero = '0';
	return (zero.repeat(numZ) + n.toString(2)).substr(-numZ);
};

let sendFirstGate = async () => {
	await getDifficulties();
	console.log('SEND TO FIRST GATE');
	isSetting = false;
	isGameRunning = true;
	//Opstellen van bits en omzetten naar bytes
	let bits = '';
	bits += byteString(isSetting === true ? 1 : 0, 2);
	for (gate of gateData['gate']) {
		bits += byteString(gate, 2);
	}
	console.log(bits);
	let maskedBits = bits;
	let bytes = maskedBits.match(/.{1,8}/g);
	let string = new Uint8Array(bytes.length);
	for (var i = 0; i < bytes.length; i++) {
		string[i] = parseInt(bytes[i], 2);
		console.log(string[i]);
	}
	// Encode the String
	var len = string.byteLength;
	let binary = '';
	for (var i = 0; i < len; i++) {
		binary += String.fromCharCode(string[i]);
	}
	console.log(string);
	let encodedString = btoa(binary);
	//Doorsturen naar controller
	let obj = { confirmed: true, fport: 10, data: encodedString };
	client.publish('bikebattle/application/1/device/e6c93d8bc7dff4aa/command/down', JSON.stringify(obj));
	listenToMqtt();
};

let showGates = () => {
	let counter = 0;
	console.log(gateData.gate);
	for (let gate of gateData.gate) {
		let selectedGate = '',
			selectedGateNav = '';
		if (counter == 0) {
			selectedGate = 'c-live-obstacle-bow--selected';
			selectedGateNav = 'c-navigation__dot--selected';
		}
		if (counter == 0) {
			htmlGate += `<div class="c-live-obstacle-bow ${selectedGate} js-gate" data-gate="${gate}">
				<div class="c-live-obstacle-bow__counter js-gate-seconds">START</div>
				<div class="c-live-obstacle-bow__name">poort ${gate}</div>
			</div>`;
		} else {
			htmlGate += `<div class="c-live-obstacle-bow ${selectedGate} js-gate" data-gate="${gate}">
				<div class="c-live-obstacle-bow__counter js-gate-seconds">0 seconden</div>
				<div class="c-live-obstacle-bow__name">poort ${gate}</div>
			</div>`;
		}
		htmlGateNav += `<div class="c-navigation__dot c-navigation__dot--gate ${selectedGateNav} js-gate-nav" data-gate-nav="${gate}">
		</div >`;
		counter++;
	}
	gates.innerHTML = htmlGate;
	gateNavs.innerHTML = htmlGateNav;
};

let showTimer = async () => {
	let htmlGateNav = '';
	let counter = 0;

	for (let timer of timerData) {
		// console.log("hoi");
		let selectedGateNav = '';
		if (counter == 0) {
			selectedGateNav = 'c-navigation__dot--selected';
		}
		htmlGateNav += `<div class="c-navigation__dot ${selectedGateNav} js-timer-nav" data-timer-nav="${counter}">
		</div >`;
		counter++;
	}

	timerNavs.innerHTML = htmlGateNav;

	listenToTimerNav();
};

let showScore = () => {
	gameScore.innerHTML = calculateScore();
};

let showLog = () => {
	let html_logs = '';
	let counter = 0;
	for (let logData of gameData.gates) {
		let logScore = 0;
		let logStatus = 'Matig';
		let logStatusColor = 'c-log__row--red';
		if (gameData.seconds[counter] <= modeData[0]) {
			logScore += 5;
			logStatus = 'Goed';
			logStatusColor = 'c-log__row--green';
		} else if (gameData.seconds[counter] < modeData[1] && gameData.seconds[counter] > modeData[0]) {
			logScore += 2;
			logStatus = 'Voldoende';
			logStatusColor = 'c-log__row--orange';
		}
		html_logs += `<div class="c-log__row ${logStatusColor} js-log">
			<div>+${logScore}</div>
			<div>Poort ${logData}</div>
			<div>${gameData.seconds[counter]} s</div>
			<div>${logStatus}</div>
			<div>${formatTimer(gameData.timestamps[counter])}</div>
		</div>`;
		counter++;
	}

	logs.innerHTML = html_logs;
};

// let showSection = (bool timer, bool countdown, bool mode, bool logs) => {

// };

let calculateScore = () => {
	let calculatedScore = 0;
	for (let second of gameData.seconds) {
		if (second <= modeData[0]) {
			calculatedScore += 5;
		} else if (second < modeData[1] && second > modeData[0]) {
			calculatedScore += 2;
		} else {
			// Geen score
		}
	}
	return calculatedScore;
};

let listenToNav = () => {};
/*----------------------------------GET FUNCTIONS---------------------------------- */

//Score ophalen afhankelijk van timeframe. algemeen, between dates of -aantal dagen geleden
let getScores = async (timeFrame, difficulty = 'Medium', times = 180) => {
	timeFrameMemory = timeFrame;
	if (timeFrame == '') {
		scores = await getAPI(`scores/${difficulty}/${times}`);
		showScores(scores);
	} else if (timeFrame == 'custom') {
		scores = await getAPI(`datebetween/${dateStartValue}/and/${dateEndValue}/${difficulty}/${times}`);
		showScores(scores);
		console.log(`datebetween/${dateStartValue}/and/${dateEndValue}/${difficulty}/${times}`);
	} else {
		scores = await getAPI(`scores/days/${timeFrame}/${difficulty}/${times}`);
		showScores(scores);
	}
};
let getDifficulties = async () => {
	difficulties = await getAPI('difficulties');
	modeData = [difficulties[gameData.mode]['TimeGreen'], difficulties[gameData.mode]['TimeOrange']];
	console.log(difficulties);
};
let pushToArray = (times) => {
	for (time of times) {
		timerData.push(time.PlayTime);
	}
};
let getTimes = async () => {
	times = await getAPI('times');
	await pushToArray(times);

	console.log(`-- Getting times: `);
	console.log(times);
	console.log(times[0].PlayTime);
	console.log(timerData);
	showTimer();
};
let getAPI = async (route) => {
	const ENDPOINT = `https://skeelerpiste.azurewebsites.net/api/${route}`;
	const request = await fetch(`${ENDPOINT}`);
	const data = await request.json();

	return data;
};
document.addEventListener('DOMContentLoaded', function () {
	nosleep = new NoSleep();
	// console.log(user);
	makeGame();

	if (document.querySelector('.js-index')) {
		listening = false;
		socket.emit('F2B_on_index', user['email']);
		client.end();
		console.log('contentLoaded');
		tabel = document.querySelector('.js-table');
		dropdown = document.querySelector('.js-dropdown');
		inputDifficulty = document.querySelector('.js-input-difficulty');
		inputTimes = document.querySelector('.js-input-times');
		name = document.querySelector('.js-name');
		console.log(user['email']);
		name.innerHTML = user['username'] == null ? user['nickname'] : user['username'];
		toggle = document.querySelector('.js-toggle');
		filter = document.querySelector('.js-filter');
		filterArea = document.querySelector('.js-filter-area');

		dateStart = document.querySelector('.js-date_start');
		dateStart.value = moment(1, 'days').format('YYYY-MM-DD');

		dateEnd = document.querySelector('.js-date_end');
		dateEnd.value = moment().format('YYYY-MM-DD');
		startBtn = document.querySelector('.js-start');
		logoutBtn = document.querySelector('.js-logout');

		scoresLessBtn = document.querySelector('.js-scores-less');
		scoresMoreBtn = document.querySelector('.js-scores-more');
		maxScores = 5;

		listenToNav();
		listenToDropdown();
		listenToInputDifficulty();
		listenToInputTimes();
		listenToToggle();
		listenToDate();
		listenToScoreboardControls();
		getScores(7);
	}
	if (document.querySelector('.js-game')) {
		listening = true;
		socket.emit('F2B_on_play', user['email']);
		console.log('Gamepage loaded ');

		appMode = document.querySelector('.js-app-mode');
		appLogs = document.querySelector('.js-app-logs');
		appCountdown = document.querySelector('.js-app-countdown');
		appTimer = document.querySelector('.js-app-timer');

		appMode.style.display = 'block';
		appTimer.style.display = 'block';
		appLogs.style.display = 'none';
		appCountdown.style.display = 'none';

		gates = document.querySelector('.js-gates');
		gateNavs = document.querySelector('.js-gate-navs');

		showGates();

		list_gate = document.querySelectorAll('.js-gate');

		gateNavLeft = document.querySelector('.js-gate-nav-left');
		gateNavRight = document.querySelector('.js-gate-nav-right');
		gateNavDot = document.querySelectorAll('.js-gate-nav');

		gateSeconds = document.querySelectorAll('.js-gate-seconds');

		listenToGateNav();

		timerNavs = document.querySelector('.js-timer-navs');
		timer = document.querySelector('.js-timer');
		timerNavLeft = document.querySelector('.js-timer-left');
		timerNavRight = document.querySelector('.js-timer-right');
		countdown = document.querySelector('.js-countdown');

		getTimes();

		controlsStart = document.querySelector('.js-controls-start');
		controlsEnd = document.querySelector('.js-controls-end');

		controlsEnd.style.display = 'none';

		gameMode = document.querySelectorAll('.js-game-mode');
		gameStart = document.querySelector('.js-game-start');
		gameEnd = document.querySelector('.js-game-end');

		gamePause = document.querySelector('.js-game-pause');
		gameSave = document.querySelector('.js-game-save');
		gameScore = document.querySelector('.js-game-score');

		annuleerBtn = document.querySelector('.js-annuleren');

		popupStartInfo = document.querySelector('.js-popup-start-button');

		listenToGameControls();

		logs = document.querySelector('.js-logs');
		list_log = document.querySelectorAll('.js-log');

		popupFinished = document.querySelector('.js-popup-finish');
		popupStart = document.querySelector('.js-popup-start');
		popupClose = document.querySelectorAll('.js-popup-close');
		popupInGame = document.querySelector('.js-popup-ingame');
		loader = document.querySelector('.js-loader');

		listenToPopups();

		noteModeGreen = document.querySelector('.js-note-mode-green');
		noteModeOrange = document.querySelector('.js-note-mode-orange');

		gateSelected = 0;
		gateOpen = 0;
		timerSelected = 0;
	}
	listenToSockets();
});
