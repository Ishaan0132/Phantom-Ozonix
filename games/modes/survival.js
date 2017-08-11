/**
 * Survival
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * This file contains code for the game mode Survival
 *
 * @license MIT license
 */

'use strict';

const Game = require('./../../games').Game; // eslint-disable-line no-unused-vars
const Room = require('./../../rooms').Room; // eslint-disable-line no-unused-vars
const User = require('./../../users').User; // eslint-disable-line no-unused-vars

const name = 'Survival';
const id = Tools.toId(name);

class SurvivalGame extends Games.Game {
	/**
	 * @param {Game} game
	 */
	constructor(game) {
		super(game.room);
		this.name = game.name + ' ' + name;
		this.id = game.id + id;
		this.freeJoin = false;
		this.playerList = [];
		this.survivalRound = 0;
		this.roundTime = 9000;
		this.hint = '';
		/**@type {Array<string>} */
		this.answers = [];
		/**@type {?NodeJS.Timer} */
		this.timeout = null;

		this.override = ['name', 'id', 'freeJoin', 'playerList', 'survivalRound', 'roundTime', 'onSignups', 'onStart', 'onNextRound', 'onEnd', 'guess'];
	}

	onSignups() {}

	onStart() {
		this.nextRound();
	}

	onNextRound() {
		if (!this.playerList.length) {
			if (this.getRemainingPlayerCount() < 2) {
				this.end();
				return;
			}
			this.survivalRound++;
			this.say("/wall Round " + this.survivalRound + (this.survivalRound > 1 ? " | Remaining players: " + this.getPlayerNames(this.getRemainingPlayers()) : ""));
			this.playerList = this.shufflePlayers();
			if (this.roundTime > 1000) this.roundTime -= 500;
		}
		let currentPlayer = this.playerList.shift();
		while (currentPlayer && currentPlayer.eliminated) {
			currentPlayer = this.playerList.shift();
		}
		if (!currentPlayer) {
			this.onNextRound();
			return;
		}
		this.setAnswers();
		this.say("**" + currentPlayer.name + "** you're up!");
		this.currentPlayer = currentPlayer;
		this.timeout = setTimeout(() => {
			this.say(this.hint);
			this.timeout = setTimeout(() => {
				if (this.currentPlayer) {
					this.say("Time's up! The answer" + (this.answers.length > 1 ? 's were' : ' was') + ": __" + this.answers.join(", ") + "__");
					this.currentPlayer.eliminated = true;
					this.currentPlayer = null;
				}
				this.nextRound();
			}, this.roundTime);
		}, 5000);
	}

	onEnd() {
		let len = this.getRemainingPlayerCount();
		if (len) {
			this.say("**Winner" + (len > 1 ? "s" : "") + "**: " + this.getPlayerNames(this.getRemainingPlayers()));
		} else {
			this.say("No winners this game!");
		}
	}

	/**
	 * @param {string} guess
	 * @param {Room} room
	 * @param {User} user
	 */
	guess(guess, room, user) {
		if (!this.currentPlayer || !(user.id in this.players) || this.players[user.id] !== this.currentPlayer) return;
		guess = Tools.toId(guess);
		if (!guess) return;
		if (this.filterGuess && this.filterGuess(guess)) return;
		if (!this.checkAnswer(guess)) {
			if (this.onGuess) this.onGuess(guess, this.players[user.id]);
			return;
		}
		if (this.timeout) clearTimeout(this.timeout);
		this.currentPlayer = null;
		if (this.getRemainingPlayerCount() === 1) return this.end();
		this.say("**" + user.name + "** advances to the next round! (Answer" + (this.answers.length > 1 ? "s" : "") + ": __" + this.answers.join(", ") + "__)");
		this.answers = [];
		this.timeout = setTimeout(() => this.nextRound(), 5000);
	}
}

/**
 * @param {Game} game
 */
let SurvivalMode = function (game) {
	let mode = new SurvivalGame(game);
	for (let i = 0, len = mode.override.length; i < len; i++) {
		// @ts-ignore
		game[mode.override[i]] = mode[mode.override[i]];
	}
};

exports.name = name;
exports.id = id;
exports.naming = 'suffix';
exports.aliases = ['surv'];
exports.requiredProperties = ['setAnswers', 'checkAnswer'];
exports.game = SurvivalGame;
exports.mode = SurvivalMode;
