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

let TeamMode = function () {
	this.name = name + ' ' + this.name;
	this.id = id + this.id;
	this.freeJoin = false;
	this.teamA = '';
	this.teamB = '';
	this.points = new Map();
	this.maxPoints = 20;
	this.onSignups = null;

	this.onStart = () => {
		let teamNames = Tools.sample(Tools.data.teams);
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
	};

	this.onNextRound = () => {
		if (this.answers) {
			this.say("Time's up! The answer" + (this.answers.length > 1 ? 's were' : ' was') + ": __" + this.answers.join(", ") + "__");
		}
		this.setAnswers();
		this.on(this.hint, () => {
			this.timeout = setTimeout(() => this.nextRound(), 10 * 1000);
		});
		this.say(this.hint);
	};

	this.guess = (guess, user) => {
		if (!(user.id in this.players) || !this.checkAnswer(guess)) return;
		clearTimeout(this.timeout);
		let player = this.players[user.id];
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
		this.answers = null;
		this.timeout = setTimeout(() => this.nextRound(), 5000);
	};
};

exports.name = name;
exports.id = id;
exports.naming = 'prefix';
exports.requiredFunctions = ['setAnswers', 'checkAnswer'];
exports.mode = TeamMode;
