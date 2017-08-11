/**
 * Anagrams game
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * @license MIT license
 */

'use strict';

const Room = require('./../rooms').Room; // eslint-disable-line no-unused-vars
const User = require('./../users').User; // eslint-disable-line no-unused-vars

const name = "Anagrams";

/**@type {{[k: string]: Array<string>}} */
const data = {
	"Pokemon": [],
	"Pokemon Moves": [],
	"Pokemon Items": [],
	"Pokemon Abilities": [],
};

for (let i in Tools.data.pokedex) {
	let pokemon = Tools.data.pokedex[i];
	if (!pokemon.species) continue;
	data["Pokemon"].push(pokemon.species);
}

for (let i in Tools.data.moves) {
	let move = Tools.data.moves[i];
	if (!move.name) continue;
	data["Pokemon Moves"].push(move.name);
}

for (let i in Tools.data.items) {
	let item = Tools.data.items[i];
	if (!item.name) continue;
	data["Pokemon Items"].push(item.name);
}

for (let i in Tools.data.abilities) {
	let ability = Tools.data.abilities[i];
	if (!ability.name) continue;
	data["Pokemon Abilities"].push(ability.name);
}

class Anagrams extends Games.Game {
	/**
	 * @param {Room} room
	 */
	constructor(room) {
		super(room);
		this.freeJoin = true;
		/**@type {Array<string>} */
		this.answers = [];
		/**@type {?NodeJS.Timer} */
		this.timeout = null;
		this.hint = '';
		this.points = new Map();
		this.maxPoints = 3;
		this.categories = Object.keys(data);
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
		let anagram = Tools.sample(data[category]);
		let id = Tools.toId(anagram);
		let letters = Tools.shuffle(id.split(""));
		while (letters.join("") === id) {
			letters = Tools.shuffle(letters);
		}
		this.answers = [anagram];
		this.hint = "**" + category + "**: __" + letters.join(", ") + "__";
	}

	onNextRound() {
		if (this.answers.length) {
			this.say("Time's up! The answer was __" + this.answers[0] + "__");
		}
		this.setAnswers();
		this.on(this.hint, () => {
			this.timeout = setTimeout(() => this.nextRound(), 10 * 1000);
		});
		this.say(this.hint);
	}
}

exports.name = name;
exports.id = Tools.toId(name);
exports.description = "Players unscramble letters to find the answers!";
exports.commands = {
	"guess": "guess",
	"g": "guess",
};
exports.aliases = ['anags'];
exports.variations = [
	{
		name: "Pokemon Anagrams",
		variation: "Pokemon",
	},
	{
		name: "Move Anagrams",
		aliases: ['Moves Anagrams'],
		variation: "Pokemon Moves",
		variationAliases: ['moves'],
	},
	{
		name: "Item Anagrams",
		aliases: ['Items Anagrams'],
		variation: "Pokemon Items",
		variationAliases: ['items'],
	},
	{
		name: "Ability Anagrams",
		aliases: ['Abilities Anagrams'],
		variation: "Pokemon Abilities",
		variationAliases: ['abilities'],
	},
];
exports.modes = ["Survival", "Team"];
exports.game = Anagrams;

/**
 * @param {Anagrams} game
 */
exports.spawnMochaTests = function (game) {
	if (game.modeId) return;

	const assert = require('assert');

	let tests = {
		/**
		 * @param {Anagrams} game
		 */
		'guess': game => {
			game.signups();
			game.nextRound();
			MessageParser.parseCommand(Config.commandCharacter + 'guess ' + game.answers[0], game.room, Users.add("User 1"));
			assert(game.points.get(game.players['user1']) === 1);
		},
	};

	return tests;
};