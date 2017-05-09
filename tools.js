/**
 * Tools
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * This file contains functions that are useful globally.
 *
 * @license MIT license
 */

'use strict';

class Tools {
	constructor() {
		this.data = {};
	}

	loadData() {
		this.data.pokedex = require('./data/pokedex.js').BattlePokedex;
		this.data.moves = require('./data/moves.js').BattleMovedex;
		this.data.items = require('./data/items.js').BattleItems;
		this.data.abilities = require('./data/abilities.js').BattleAbilities;
		this.data.learnsets = require('./data/learnsets.js').BattleLearnsets;
		this.data.teams = require('./data/teams.js').BattlePokeTeams;
	}

	/**
	 * @return {string}
	 */
	toId(text) {
		if (!text) return '';
		if (text.id) text = text.id;
		let type = typeof text;
		if (type !== 'string') {
			if (type === 'number') {
				text = '' + text;
			} else {
				return '';
			}
		}
		return text.toLowerCase().replace(/[^a-z0-9]/g, '');
	}

	/**
	 * @return {string}
	 */
	toName(text) {
		if (!text) return '';
		if (text.name) text = text.name;
		let type = typeof text;
		if (type !== 'string') {
			if (type === 'number') {
				text = '' + text;
			} else {
				return '';
			}
		}
		if (Config.groups && text.charAt(0) in Config.groups) text = text.substr(1);
		return text.trim();
	}

	/**
	 * @return {string}
	 */
	toString(text) {
		if (!text) return '';
		let type = typeof text;
		if (type === 'string') return text;
		if (type === 'number') return '' + text;
		return JSON.stringify(text);
	}

	/**
	 * @return {string}
	 */
	normalizeMessage(text, room) {
		text = this.toString(text);
		if (!text) return '';
		text = text.trim();
		if (text.startsWith("/wall ")) text = '/announce ' + text.substr(6);
		if (text.startsWith("/announce ") && (!room || !Users.self.hasRank(room, '%'))) {
			text = text.substr(10);
			if (!text.includes('**') && text.length <= 296) text = '**' + text + '**';
		}
		if (text.length > 300) text = text.substr(0, 297) + "...";
		return text;
	}

	/**
	 * @param {number} [limit]
	 * @return {number}
	 */
	random(limit) {
		if (!limit) limit = 2;
		return Math.floor(Math.random() * limit);
	}

	/**
	 * @param {Array} array
	 * @return {Array}
	 */
	shuffle(array) {
		if (!(array instanceof Array)) return array;
		array = array.slice();

		// Fisher-Yates shuffle algorithm
		let currentIndex = array.length;
		let temporaryValue, randomIndex;

		// While there remain elements to shuffle...
		while (currentIndex !== 0) {
			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;

			// And swap it with the current element.
			temporaryValue = array[currentIndex];
			array[currentIndex] = array[randomIndex];
			array[randomIndex] = temporaryValue;
		}
		return array;
	}

	/**
	 * @param {Array} array
	 * @param {number} [amount]
	 */
	sample(array, amount) {
		if (!(array instanceof Array)) return;
		let len = array.length;
		if (!len) return;
		if (len === 1 || !amount || amount === 1) return array.slice()[Math.floor(Math.random() * len)];
		if (amount > len) {
			amount = len;
		} else if (amount < 0) {
			amount = 0;
		}
		return this.shuffle(array).splice(0, amount);
	}

	getTemplate(name) {
		return this.data.pokedex[this.toId(name)];
	}

	getMove(name) {
		return this.data.moves[this.toId(name)];
	}

	getItem(name) {
		return this.data.items[this.toId(name)];
	}

	getAbility(name) {
		return this.data.abilities[this.toId(name)];
	}
}

let tools = new Tools();
global.toId = tools.toId;
tools.loadData();

module.exports = tools;
