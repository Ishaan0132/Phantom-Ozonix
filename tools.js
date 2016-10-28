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
	}

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

	toString(text) {
		if (!text) return '';
		let type = typeof text;
		if (type === 'string') return text;
		if (type === 'number') return '' + text;
		return JSON.stringify(text);
	}

	normalizeMessage(text) {
		text = this.toString(text);
		if (!text) return '';
		text = text.trim();
		if (text.length > 300) text = text.substr(0, 297) + "...";
		return text;
	}
}

let tools = new Tools();
tools.loadData();

module.exports = tools;
