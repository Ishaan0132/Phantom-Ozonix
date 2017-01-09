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
const description = "Guess answers based on the given descriptions.";
const data = {
	"Pokemon Moves": {},
	"Pokemon Items": {},
	"Pokemon Abilities": {},
};

for (let i in Tools.data.moves) {
	let move = Tools.data.moves[i];
	if (!move.name) continue;
	let desc = move.desc || move.shortDesc;
	if (!desc) continue;
	if (!(desc in data["Pokemon Moves"])) data["Pokemon Moves"][desc] = [];
	data["Pokemon Moves"][desc].push(move.name);
}

for (let i in Tools.data.items) {
	let item = Tools.data.items[i];
	if (!item.name) continue;
	let desc = item.desc || item.shortDesc;
	if (!desc) continue;
	if (!(desc in data["Pokemon Items"])) data["Pokemon Items"][desc] = [];
	data["Pokemon Items"][desc].push(item.name);
}

for (let i in Tools.data.abilities) {
	let ability = Tools.data.abilities[i];
	if (!ability.name) continue;
	let desc = ability.desc || ability.shortDesc;
	if (!desc) continue;
	if (!(desc in data["Pokemon Abilities"])) data["Pokemon Abilities"][desc] = [];
	data["Pokemon Abilities"][desc].push(ability.name);
}

class Trivia extends Games.Game {
	constructor(room) {
		super(room);
		this.name = name;
		this.id = id;
		this.description = description;
		this.freeJoin = true;
		this.answers = null;
		this.hint = null;
		this.points = new Map();
		this.maxPoints = 3;
		this.categories = Object.keys(data);
		this.questions = [];
		for (let i = 0, len = this.categories.length; i < len; i++) {
			this.questions[this.categories[i]] = Object.keys(data[this.categories[i]]);
		}
	}

	onSignups() {
		this.timeout = setTimeout(() => this.nextRound(), 10 * 1000);
	}

	setAnswers() {
		let category;
		if (this.variation) {
			category = this.variation;
		} else {
			category = Tools.sample(this.categories);
		}
		let question = Tools.sample(this.questions[category]);
		this.answers = data[category][question];
		this.hint = "**" + category + "**: " + question;
	}

	onNextRound() {
		if (this.answers) {
			let answers = this.answers.length;
			this.say("Time's up! The answer" + (answers > 1 ? "s were" : " was") + " __" + this.answers.join(", ") + "__");
		}
		this.setAnswers();
		this.on(this.hint, () => {
			this.timeout = setTimeout(() => this.nextRound(), 10 * 1000);
		});
		this.say(this.hint);
	}

	checkAnswer(guess) {
		guess = Tools.toId(guess);
		for (let i = 0, len = this.answers.length; i < len; i++) {
			if (Tools.toId(this.answers[i]) === guess) {
				return true;
			}
		}
		return false;
	}

	guess(guess, user) {
		if (!this.answers || !this.checkAnswer(guess)) return;
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
		this.timeout = setTimeout(() => this.nextRound(), 5 * 1000);
	}
}

exports.name = name;
exports.id = id;
exports.description = description;
exports.commands = {
	// command: game function
	// alias: command
	"guess": "guess",
	"g": "guess",
};
exports.aliases = ['triv'];
exports.variations = [
	{
		name: "Move Trivia",
		variation: "Pokemon Moves",
		aliases: ['moves'],
	},
	{
		name: "Item Trivia",
		variation: "Pokemon Items",
		aliases: ['items'],
	},
	{
		name: "Ability Trivia",
		variation: "Pokemon Abilities",
		aliases: ['abilities'],
	},
];
exports.modes = ["Survival"];
exports.game = Trivia;
