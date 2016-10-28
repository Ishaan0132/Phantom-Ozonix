/**
 * Example game
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * This file contains example code for a game (Trivia)
 *
 * @license MIT license
 */

'use strict';

const name = "Trivia";
const id = Tools.toId(name);
const data = {
	"Pokemon Moves": {},
	"Pokemon Items": {},
	"Pokemon Abilities": {},
};

for (let i in Tools.data.moves) {
	let move = Tools.data.moves[i];
	if (!move.name || !move.desc) continue;
	if (!(move.desc in data["Pokemon Moves"])) data["Pokemon Moves"][move.desc] = [];
	data["Pokemon Moves"][move.desc].push(move.name);
}

for (let i in Tools.data.items) {
	let item = Tools.data.items[i];
	if (!item.name || !item.desc) continue;
	if (!(item.desc in data["Pokemon Items"])) data["Pokemon Items"][item.desc] = [];
	data["Pokemon Items"][item.desc].push(item.name);
}

for (let i in Tools.data.abilities) {
	let ability = Tools.data.abilities[i];
	if (!ability.name || !ability.desc) continue;
	if (!(ability.desc in data["Pokemon Abilities"])) data["Pokemon Abilities"][ability.desc] = [];
	data["Pokemon Abilities"][ability.desc].push(ability.name);
}

class Trivia extends Games.Game {
	constructor(room) {
		super(room);
		this.name = name;
		this.id = id;
		this.answers = null;
		this.points = new Map();
		this.maxPoints = 3;
		this.categories = Object.keys(data);
		this.questions = [];
		for (let i = 0, len = this.categories.length; i < len; i++) {
			this.questions[this.categories[i]] = Object.keys(data[this.categories[i]]);
		}
	}

	onStart() {
		this.askQuestion();
	}

	askQuestion() {
		if (this.answers) {
			let answers = this.answers.length;
			this.say("Time's up! The answer" + (answers > 1 ? "s were" : " was") + " __" + this.answers.join(", ") + "__");
		}
		let category = this.categories[Math.floor(Math.random() * this.categories.length)];
		let question = this.questions[category][Math.floor(Math.random() * this.questions[category].length)];
		this.answers = data[category][question];
		this.say("**" + category + "**: " + question);
		this.timeout = setTimeout(() => this.askQuestion(), 10 * 1000);
	}

	guess(guess, user) {
		if (!this.answers) return;
		guess = Tools.toId(guess);
		let correct = false;
		for (let i = 0, len = this.answers.length; i < len; i++) {
			if (Tools.toId(this.answers[i]) === guess) {
				correct = true;
				break;
			}
		}
		if (!correct) return;
		clearTimeout(this.timeout);
		if (!(user.id in this.players)) this.addPlayer(user);
		let player = this.players[user.id];
		let points = this.points.get(player) || 0;
		points += 1;
		this.points.set(player, points);
		if (points >= this.maxPoints) {
			this.say("Correct! " + user.name + " wins the game! (Answer" + (this.answers.length > 1 ? "s" : "") + ": __" + this.answers.join(", ") + "__)");
			this.end();
			return;
		}
		this.say("Correct! " + user.name + " advances to " + points + " point" + (points > 1 ? "s" : "") + ". (Answer" + (this.answers.length > 1 ? "s" : "") + ": __" + this.answers.join(", ") + "__)");
		this.answers = null;
		this.timeout = setTimeout(() => this.askQuestion(), 5 * 1000);
	}
}

exports.name = name;
exports.id = id;
exports.description = "Guess answers based on the given descriptions.";
exports.game = Trivia;
