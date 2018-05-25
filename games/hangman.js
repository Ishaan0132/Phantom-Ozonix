/**
 * Hangman game
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * @license MIT license
 */

'use strict';

const name = "Hangman";

/**@type {{[k: string]: Array<string>}} */
const data = {
	"Pokemon": [],
	"Pokemon Moves": [],
	"Pokemon Items": [],
	"Pokemon Abilities": [],
};
data["Pokemon Badges"] = Tools.data.badges.slice();
data["Pokemon Characters"] = Tools.data.characters.slice();

for (let i in Tools.data.pokedex) {
	let pokemon = Tools.getExistingPokemon(i);
	if (!pokemon.species) continue;
	data["Pokemon"].push(pokemon.species);
}

for (let i in Tools.data.moves) {
	let move = Tools.getExistingMove(i);
	if (!move.name) continue;
	data["Pokemon Moves"].push(move.name);
}

for (let i in Tools.data.items) {
	let item = Tools.getExistingItem(i);
	if (!item.name) continue;
	data["Pokemon Items"].push(item.name);
}

for (let i in Tools.data.abilities) {
	let ability = Tools.getExistingAbility(i);
	if (!ability.name) continue;
	data["Pokemon Abilities"].push(ability.name);
}

class Hangman extends Games.Game {
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
		/**@type {Array<string>} */
		this.hint = [];
		this.points = new Map();
		this.maxPoints = 3;
		this.categories = Object.keys(data);
		this.currentCategory = '';
		this.guessLimit = 10;
		/**@type {Array<string>} */
		this.letters = [];
		/**@type {Array<string>} */
		this.guessedLetters = [];
		/**@type {Array<string>} */
		this.solvedLetters = [];
		this.uniqueLetters = 0;
		this.roundGuesses = new Map();
	}

	onSignups() {
		this.timeout = setTimeout(() => this.nextRound(), 10 * 1000);
	}

	setAnswers() {
		let category;
		if (this.variation) {
			category = this.variation;
		} else {
			category = Tools.sampleOne(this.categories);
		}
		this.currentCategory = category;
		let word = Tools.sampleOne(data[category]);
		this.answers = [word];
		this.solvedLetters = [];
		this.guessedLetters = [];
		let letters = word.split("");
		this.letters = letters;
		let id = Tools.toId(word).split("");
		this.uniqueLetters = id.filter((letter, index) => id.indexOf(letter) === index).length;
		this.hint = this.letters.slice();
		for (let i = 0, len = this.hint.length; i < len; i++) {
			this.hint[i] = this.hint[i] === ' ' ? "/" : Tools.toId(this.hint[i]).length ? "_" : this.hint[i];
		}
	}

	onNextRound() {
		if (this.timeout) this.timeout = null;
		if (!this.answers.length) this.setAnswers();
		this.roundGuesses.clear();
		let ended = false;
		if (this.guessedLetters.length >= this.guessLimit) {
			this.say("All guesses have been used! The answer was __" + this.answers[0] + "__");
			ended = true;
		} else if (this.solvedLetters.length >= this.uniqueLetters) {
			this.say("All letters have been revealed! The answer was __" + this.answers[0] + "__");
			ended = true;
		}
		if (ended) {
			this.answers = [];
			this.timeout = setTimeout(() => this.nextRound(), 5000);
			return;
		}
		for (let i = 0, len = this.letters.length; i < len; i++) {
			if (this.solvedLetters.includes(Tools.toId(this.letters[i]))) this.hint[i] = this.letters[i];
		}
		this.say(this.hint.join(" ") + " | **" + this.currentCategory + "** | " + this.guessedLetters.join(", "));
	}

	/**
	 * @param {string} guess
	 */
	filterGuess(guess) {
		if (this.guessedLetters.includes(guess) || this.solvedLetters.includes(guess)) return true;
		return false;
	}

	/**
	 * @param {string} guess
	 */
	onGuess(guess) {
		if (!this.timeout) {
			this.timeout = setTimeout(() => this.nextRound(), 4000);
		}
		for (let i = 0, len = this.letters.length; i < len; i++) {
			if (Tools.toId(this.letters[i]) === guess) {
				if (!this.solvedLetters.includes(guess)) this.solvedLetters.push(guess);
				return;
			}
		}
		this.guessedLetters.push(guess);
	}
}

exports.name = name;
exports.id = Tools.toId(name);
exports.description = "Players guess letters to fill in the blanks and reveal the answers!";
exports.commands = {
	"guess": "guess",
	"g": "guess",
};
exports.variations = [
	{
		name: "Pokemon Hangman",
		variation: "Pokemon",
	},
	{
		name: "Move Hangman",
		aliases: ['Moves Hangman'],
		variation: "Pokemon Moves",
		variationAliases: ['moves'],
	},
	{
		name: "Item Hangman",
		aliases: ['Items Hangman'],
		variation: "Pokemon Items",
		variationAliases: ['items'],
	},
	{
		name: "Ability Hangman",
		aliases: ['Abilities Hangman'],
		variation: "Pokemon Abilities",
		variationAliases: ['abilities'],
	},
];
exports.modes = ["Team"];
exports.game = Hangman;

/**
 * @param {Hangman} game
 */
exports.spawnMochaTests = function (game) {
	if (game.modeId) return;

	const assert = require('assert');

	let tests = {
		/**
		 * @param {Hangman} game
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