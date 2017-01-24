/**
 * Team mode
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * This file contains code for a game mode (Team)
 *
 * @license MIT license
 */

'use strict';

const name = 'Team';
const id = Tools.toId(name);
const data = {};

data["Teams"] = Tools.data.teams;

let TeamMode = function () {
	this.name += ' ' + name;
	this.id += id;
	this.freeJoin = false;
	this.playerList = [];
	this.teamA = '';
	this.teamB = '';
	this.teamAplayers = [];
	this.teamBplayers = [];
	this.points = new Map();
	this.maxPoints = 20;
	this.onSignups = null;

	this.onStart = () => {
		let tracker = Object.keys(this.players), str = 0, teamNames = data["Teams"];
		this.teamA = Object.keys(teamNames)[Math.floor(Math.random() * Object.keys(teamNames).length)];
		this.teamB = teamNames[this.teamA];
		let randomPlayer = Tools.shuffle(tracker);
		for (let i = 0, len = tracker.length; i < len; i++) {
			if (str % 2 === 0) {
				this.players[randomPlayer[i]].team = this.teamA;
				this.teamAplayers.push(this.players[randomPlayer[i]].name);
				str++;
			} else {
				this.players[randomPlayer[i]].team = this.teamB;
				this.teamBplayers.push(this.players[randomPlayer[i]].name);
				str++;
			}
		}
		this.say("Players (" + this.playerCount + ") **" + this.teamA + ":** " + this.teamAplayers.join(", ") + " | **" + this.teamB + ":** " + this.teamBplayers.join(", ") + ".");
		this.nextRound();
	};

	this.onNextRound = () => {
		this.setAnswers();
		this.say(this.hint);
		this.timeout = setTimeout(() => {
			if (this.answers) {
				this.say("Time's up! The answer" + (this.answers.length > 1 ? 's were' : ' was') + ": __" + this.answers.join(", ") + "__");
			}
			this.nextRound();
		}, 10 * 1000);
	};

	this.guess = (guess, user) => {
		if (!this.players[user.id] || !this.checkAnswer(guess)) return;
		clearTimeout(this.timeout);
		let player = this.players[user.id];
		let playerteam = player.team;
		let points = this.points.get(playerteam) || 0;
		points += 1;
		this.points.set(playerteam, points);
		if (points >= this.maxPoints) {
			this.winners.set(playerteam, points);
			this.say("Correct! " + user.name + " has won the game for **" + playerteam + "**! (Answer" + (this.answers.length > 1 ? "s" : "") + ": __" + this.answers.join(", ") + "__)");
			this.end();
			return;
		}
		this.say("**" + user.name + "** advances **" + playerteam + "** to " + points + " point" + (points > 1 ? "s" : "") + "! (Answer" + (this.answers.length > 1 ? "s" : "") + ": __" + this.answers.join(", ") + "__)");
		this.answers = null;
		this.timeout = setTimeout(() => this.nextRound(), 5000);
	};
};

exports.name = name;
exports.id = id;
exports.requiredFunctions = ['setAnswers', 'checkAnswer'];
exports.mode = TeamMode;
