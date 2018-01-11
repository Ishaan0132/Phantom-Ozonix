/**
 * Room Game
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * This file contains the base player and game classes
 *
 * @license MIT license
 */

'use strict';

class Player {
	/**
	 * @param {User} user
	 */
	constructor(user) {
		this.name = user.name;
		this.id = user.id;
		this.eliminated = false;
		/**@type {?string} */
		this.team = null;
	}

	/**
	 * @param {string} message
	 */
	say(message) {
		Users.add(this.name).say(message);
	}
}

exports.Player = Player;

class Game {
	/**
	 * @param {Room} room
	 */
	constructor(room) {
		this.room = room;
		this.name = '';
		this.id = '';
		this.modeId = '';
		this.description = '';
		/**@type {{[k: string]: Player}} */
		this.players = {};
		this.playerCount = 0;
		/**@type {?number} */
		this.playerCap = null;
		/**@type {?number} */
		this.maxPlayers = null;
		this.minPlayers = 2;
		this.round = 0;
		this.started = false;
		this.ended = false;
		this.freeJoin = false;
		this.canLateJoin = false;
		/**@type {Map<Player, number>} */
		this.winners = new Map();
		/**@type {?Map<Player, number>} */
		this.points = null;
		/**@type {?Map<Player, number>} */
		this.lives = null;
		/**@type {?Game} */
		this.parentGame = null;
		/**@type {?Game} */
		this.childGame = null;
		/**@type {?NodeJS.Timer} */
		this.timeout = null;
		/**@type {?string} */
		this.variation = null;
		/**@type {?boolean | {[k: string]: boolean}} */
		this.pmCommands = null;
		/**@type {?Array<string>} */
		this.answers = null;
		/**@type {?number} */
		this.maxPoints = null;
		this.winnerPointsToBits = 50;
		this.loserPointsToBits = 10;
		/**@type {?Map<Player, boolean>} */
		this.roundGuesses = null;
	}

	onSignups() {}

	onStart() {}

	onNextRound() {}

	onEnd() {}

	/**
	 * @param {Map<Player, number>} winners
	 */
	onChildEnd(winners) {}

	/**
	 * @param {Player} player
	 * @param {boolean} [lateJoin]
	 */
	onJoin(player, lateJoin) {}

	/**
	 * @param {Player} player
	 */
	onLeave(player) {}

	/**
	 * @param {Player} player
	 */
	onRename(player) {}

	setAnswers() {}

	/**
	 * @param {string} message;
	 */
	say(message) {
		this.room.say(message);
	}

	/**
	 * @param {string} message;
	 */
	sayHtml(message) {
		this.room.say("/addhtmlbox " + message, true);
	}

	/**
	 * @param {User | Player | string} user
	 * @param {string} message;
	 */
	pm(user, message) {
		if (typeof user === 'string') user = Users.add(user);
		user.say(message);
	}

	/**
	 * @param {User | Player | string} user
	 * @param {string} message;
	 */
	pmHtml(user, message) {
		this.room.say("/pminfobox " + Tools.toId(user) + ", " + message, true);
	}

	/**
	 * @param {string} message
	 * @param {Function} listener
	 */
	on(message, listener) {
		this.room.on(message, listener);
	}

	/**
	 * @param {number} bits
	 * @param {User | Player} user
	 */
	addBits(bits, user) {
		if (user instanceof Player) user = Users.get(user.name);
		Storage.addPoints(bits, user, this.room.id);
	}

	/**
	 * @param {number} bits
	 * @param {User | Player} user
	 */
	removeBits(bits, user) {
		if (user instanceof Player) user = Users.get(user.name);
		Storage.removePoints(bits, user, this.room.id);
	}

	/**
	 * @param {User | Player} user
	 */
	getBits(user) {
		if (user instanceof Player) user = Users.get(user.name);
		return Storage.getPoints(user, this.room.id);
	}

	/**
	 * @param {number} [winnerPointsToBits]
	 * @param {number} [loserPointsToBits]
	 */
	convertPointsToBits(winnerPointsToBits, loserPointsToBits) {
		if (!this.points) throw new Error(this.name + " does not track points.");
		if (!winnerPointsToBits) winnerPointsToBits = this.winnerPointsToBits;
		if (!loserPointsToBits) loserPointsToBits = this.loserPointsToBits;
		this.points.forEach((points, player) => {
			let bits = 0;
			if (this.winners.has(player)) {
				bits = winnerPointsToBits * points;
			} else {
				bits = loserPointsToBits * points;
			}
			if (bits) this.addBits(bits, player);
		});
	}

	signups() {
		this.say("Hosting a game of " + this.name + "! " + (this.freeJoin ? "(free join)" : "If you would like to play, use the command ``" + Config.commandCharacter + "join``."));
		if (this.description) this.say("Description: " + this.description);
		if (typeof this.onSignups === 'function') this.onSignups();
		if (this.freeJoin) this.started = true;
	}

	start() {
		if (this.started) return;
		if (this.playerCount < this.minPlayers) return this.say(this.name + " must have at least " + this.minPlayers + " players.");
		this.started = true;
		if (typeof this.onStart === 'function') this.onStart();
	}

	end() {
		if (this.ended) return;
		if (this.timeout) clearTimeout(this.timeout);
		if (typeof this.onEnd === 'function') this.onEnd();
		this.ended = true;
		this.room.game = null;
		if (this.parentGame) {
			this.room.game = this.parentGame;
			if (typeof this.parentGame.onChildEnd === 'function') this.parentGame.onChildEnd(this.winners);
		}
	}

	forceEnd() {
		if (this.ended) return;
		if (this.timeout) clearTimeout(this.timeout);
		if (this.parentGame) {
			this.parentGame.forceEnd();
			return;
		}
		this.say("The game was forcibly ended.");
		this.ended = true;
		this.room.game = null;
	}

	nextRound() {
		if (this.timeout) clearTimeout(this.timeout);
		this.round++;
		if (typeof this.onNextRound === 'function') this.onNextRound();
	}

	/**
	 * @param {User} user
	 * @return {Player}
	 */
	addPlayer(user) {
		if (user.id in this.players) return this.players[user.id];
		let player = new Player(user);
		this.players[user.id] = player;
		this.playerCount++;
		return player;
	}

	/**
	 * @param {User} user
	 */
	removePlayer(user) {
		if (!(user.id in this.players) || this.players[user.id].eliminated) return;
		if (this.started) {
			this.players[user.id].eliminated = true;
		} else {
			delete this.players[user.id];
			this.playerCount--;
		}
	}

	/**
	 * @param {User} user
	 * @param {string} oldName
	 */
	renamePlayer(user, oldName) {
		let oldId = Tools.toId(oldName);
		if (!(oldId in this.players)) return;
		let player = this.players[oldId];
		player.name = user.name;
		if (player.id === user.id || user.id in this.players) return;
		player.id = user.id;
		this.players[user.id] = player;
		delete this.players[oldId];
		if (typeof this.onRename === 'function') this.onRename(player);
		if (this.parentGame && typeof this.parentGame.onRename === 'function') this.parentGame.onRename(player);
	}

	/**
	 * @param {User} user
	 */
	join(user) {
		if (user.id in this.players) return;
		if (this.freeJoin) return user.say(this.name + " does not require you to join.");
		let lateJoin = false;
		if (this.started) {
			if (!this.canLateJoin) {
				this.pm(user, "Sorry, this game does not support late-joins.");
				return false;
			}
			if (this.maxPlayers && this.getRemainingPlayerCount() >= this.maxPlayers) {
				this.pm(user, "Sorry, this game is full.");
				return false;
			}
			if (this.lateJoin(user) === false) return false;
			lateJoin = true;
		}
		let player = this.addPlayer(user);
		this.onJoin(player, lateJoin);
		if (lateJoin) {
			user.say('You have late-joined the game of ' + this.name + '!');
		} else {
			user.say('You have joined the game of ' + this.name + '!');
			if ((this.playerCap && this.playerCount === this.playerCap) || (this.maxPlayers && this.playerCount === this.maxPlayers)) this.start();
		}
	}

	/**
	 * @param {User} user
	 */
	leave(user) {
		if (this.parentGame) {
			this.parentGame.leave(user);
			return;
		}
		if (!(user.id in this.players) || this.players[user.id].eliminated) return;
		let player = this.players[user.id];
		this.removePlayer(user);
		user.say("You have left the game of " + this.name + "!");
		if (typeof this.onLeave === 'function') this.onLeave(player);
	}

	/**
	 * @param {User} user
	 * @return {boolean}
	 */
	lateJoin(user) {
		if (!this.canLateJoin) return false;
		if (this.round > 1) {
			user.say("Sorry, the late-join period has ended.");
			return false;
		}
		this.addPlayer(user);
		return true;
	}

	/**
	 * @param {{[k: string]: Player}} [players]
	 * @return {string}
	 */
	getPlayerNames(players) {
		if (!players) players = this.players;
		let names = [];
		for (let i in players) {
			names.push(players[i].name);
		}
		return names.join(", ");
	}

	/**
	 * @param {{[k: string]: Player}} [players]
	 * @return {string}
	 */
	getPoints(players) {
		if (!this.points) return '';
		if (!players) players = this.players;
		let list = [];
		for (let i in players) {
			let points = this.points.get(players[i]);
			list.push(players[i].name + (points ? "(" + points + ")" : ""));
		}
		return list.join(", ");
	}

	/**
	 * @param {{[k: string]: Player}} [players]
	 * @return {string}
	 */
	getLives(players) {
		if (!this.lives) return '';
		if (!players) players = this.players;
		let list = [];
		for (let i in players) {
			let lives = this.lives.get(players[i]);
			list.push(players[i].name + "(" + lives + "♥)");
		}
		return list.join(", ");
	}

	/**
	 * @return {{[k: string]: Player}}
	 */
	getRemainingPlayers() {
		let remainingPlayers = {};
		for (let i in this.players) {
			if (!this.players[i].eliminated) remainingPlayers[i] = this.players[i];
		}
		return remainingPlayers;
	}

	/**
	 * @return {number}
	 */
	getRemainingPlayerCount() {
		let count = 0;
		for (let i in this.players) {
			if (!this.players[i].eliminated) count++;
		}
		return count;
	}

	/**
	 * @param {{[k: string]: Player}} [players]
	 * @return {Array<Player>}
	 */
	shufflePlayers(players) {
		if (!players) players = this.players;
		let list = [];
		for (let i in players) {
			list.push(players[i]);
		}
		return Tools.shuffle(list);
	}

	/**
	 * @param {string} guess
	 */
	checkAnswer(guess) {
		if (!this.answers) return;
		for (let i = 0, len = this.answers.length; i < len; i++) {
			if (Tools.toId(this.answers[i]) === guess) {
				return true;
			}
		}
		return false;
	}

	/**
	 * @param {string} answer
	 * @returns {number}
	 */
	pointsPerAnswer(answer) {
		return 1;
	}

	/**
	 * @param {string} guess
	 */
	filterGuess(guess) {}

	/**
	 * @param {string} guess
	 * @param {Player} player
	 */
	onGuess(guess, player) {}

	/**
	 * @param {string} guess
	 * @param {Room} room
	 * @param {User} user
	 */
	guess(guess, room, user) {
		if (!this.answers || !this.answers.length || !this.points || !this.maxPoints || !this.started || (user.id in this.players && this.players[user.id].eliminated)) return;
		if (!(user.id in this.players)) this.addPlayer(user);
		let player = this.players[user.id];
		guess = Tools.toId(guess);
		if (!guess) return;
		if (this.filterGuess && this.filterGuess(guess)) return;
		if (this.roundGuesses) {
			if (this.roundGuesses.has(player)) return;
			this.roundGuesses.set(player, true);
		}
		if (!this.checkAnswer(guess)) {
			if (this.onGuess) this.onGuess(guess, player);
			return;
		}
		if (this.timeout) clearTimeout(this.timeout);
		let points = this.points.get(player) || 0;
		points += this.pointsPerAnswer(guess);
		this.points.set(player, points);
		if (points >= this.maxPoints) {
			this.winners.set(player, points);
			this.say("Correct! " + user.name + " wins the game! (Answer" + (this.answers.length > 1 ? "s" : "") + ": __" + this.answers.join(", ") + "__)");
			this.end();
			return;
		}
		this.say("Correct! " + user.name + " advances to " + points + " point" + (points > 1 ? "s" : "") + ". (Answer" + (this.answers.length > 1 ? "s" : "") + ": __" + this.answers.join(", ") + "__)");
		this.answers = [];
		this.timeout = setTimeout(() => this.nextRound(), 5 * 1000);
	}
}

exports.Game = Game;
