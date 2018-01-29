/**
 * Team
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * This file contains code for the game mode Team
 *
 * @license MIT license
 */

'use strict';

const name = 'Team';
const id = Tools.toId(name);

/**@augments Game */
class TeamGame {
	/**
	 * @param {Game} game
	 */
	constructor(game) {
		this.name = name + ' ' + game.name;
		this.id = id + game.id;
		this.freeJoin = false;
		this.teamA = '';
		this.teamB = '';
		this.points = new Map();
		this.maxPoints = 20;
		this.hint = '';
		this.minPlayers = 4;
		/**@type {Array<string>} */
		this.answers = [];
		/**@type {?NodeJS.Timer} */
		this.timeout = null;
	}

	onSignups() {}

	onStart() {
		let teamNames = Tools.sampleOne(Tools.data.teams);
		this.teamA = "Team " + teamNames[0];
		this.teamB = "Team " + teamNames[1];
		let teamAPlayers = [];
		let teamBPlayers = [];
		let players = this.shufflePlayers();
		for (let i = 0, len = players.length; i < len; i++) {
			if (i % 2 === 0) {
				players[i].team = this.teamA;
				teamAPlayers.push(players[i].name);
			} else {
				players[i].team = this.teamB;
				teamBPlayers.push(players[i].name);
			}
		}
		this.say("**" + this.teamA + "**: " + teamAPlayers.join(", "));
		this.say("**" + this.teamB + "**: " + teamBPlayers.join(", "));
		this.nextRound();
	}

	onNextRound() {
		if (this.answers.length) {
			this.say("Time's up! The answer" + (this.answers.length > 1 ? 's were' : ' was') + ": __" + this.answers.join(", ") + "__");
		}
		this.setAnswers();
		this.on(this.hint, () => {
			this.timeout = setTimeout(() => this.nextRound(), 10 * 1000);
		});
		this.say(this.hint);
	}

	/**
	 * @param {string} guess
	 * @param {Room} room
	 * @param {User} user
	 */
	guess(guess, room, user) {
		if (!this.answers || !this.answers.length || !this.started || !(user.id in this.players)) return;
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
		points += 1;
		this.points.set(player, points);

		points = this.points.get(player.team) || 0;
		points += 1;
		this.points.set(player.team, points);
		if (points >= this.maxPoints) {
			for (let i in this.players) {
				if (this.players[i].team === player.team) this.winners.set(this.players[i], this.points.get(this.players[i]) || 0);
			}
			this.say("Correct! " + user.name + " has won the game for **" + player.team + "**! (Answer" + (this.answers.length > 1 ? "s" : "") + ": __" + this.answers.join(", ") + "__)");
			this.end();
			return;
		}
		this.say("**" + user.name + "** advances **" + player.team + "** to " + points + " point" + (points > 1 ? "s" : "") + "! (Answer" + (this.answers.length > 1 ? "s" : "") + ": __" + this.answers.join(", ") + "__)");
		this.answers = [];
		this.timeout = setTimeout(() => this.nextRound(), 5000);
	}
}

/**
 * @param {Game} game
 */
let TeamMode = function (game) {
	let mode = new TeamGame(game);
	let override = Object.getOwnPropertyNames(mode).concat(Object.getOwnPropertyNames(TeamGame.prototype));
	for (let i = 0, len = override.length; i < len; i++) {
		// @ts-ignore
		game[override[i]] = mode[override[i]];
	}
};

exports.name = name;
exports.id = id;
exports.naming = 'prefix';
exports.requiredProperties = ['setAnswers', 'checkAnswer'];
exports.game = TeamGame;
exports.mode = TeamMode;
