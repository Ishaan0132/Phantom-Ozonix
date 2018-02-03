/**
 * Tools
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * This file contains functions that are useful globally.
 *
 * @license MIT license
 */

'use strict';

const https = require('https');
const url = require('url');
const Data = require('./tools-data');

const whitespaceRegex = new RegExp('\\s+', 'g');
const nullCharactersRegex = new RegExp('[\u0000\u200B-\u200F]+', 'g');

/**
* @typedef Learnset
* @type {Object}
* @property {{[k: string]: Array<string>}} learnset
*/

/**
* @typedef TypeChart
* @type {Object}
* @property {{[k: string]: number}} damageTaken
* @property {{[k: string]: number}} [HPivs]
* @property {{[k: string]: number}} [HPdvs]
*/

/**
* @typedef FormatData
* @type {Object}
* @property {Array<string>} [randomBattleMoves]
* @property {Array<string>} [randomDoubleBattleMoves]
* @property {Array<{generation: number, level?: number, moves?: Array<string>, abilities?: Array<string>, pokeball?: string, gender?: string, isHidden?: boolean, shiny?: number | boolean, ivs?: {[k: string]: number}, nature?: string}>} [eventPokemon]
* @property {string} [tier]
* @property {string} [requiredItem]
*/

/**
* @typedef DataTable
* @type {Object}
* @property {{[k: string]: Pokemon}} pokedex
* @property {{[k: string]: Move}} moves
* @property {{[k: string]: Item}} items
* @property {{[k: string]: Ability}} abilities
* @property {{[k: string]: string}} aliases
* @property {{[k: string]: Learnset}} learnsets
* @property {{[k: string]: TypeChart}} typeChart
* @property {{[k: string]: FormatData}} formatsData
* @property {Array<Array<string>>} teams
*/

class Tools {
	constructor() {
		/**@type {DataTable} */
		this.data = {
			pokedex: {},
			moves: {},
			items: {},
			abilities: {},
			aliases: {},
			learnsets: {},
			typeChart: {},
			formatsData: {},
			teams: [],
		};
		this.gen = 7;
		this.dataFilePath = './data/';
		/**@type {Map<string, Move>} */
		this.MoveCache = new Map();
		/**@type {Map<string, Item>} */
		this.ItemCache = new Map();
		/**@type {Map<string, Ability>} */
		this.AbilityCache = new Map();
		/**@type {Map<string, Pokemon>} */
		this.PokemonCache = new Map();
		/**@type {Map<string, Format>} */
		this.FormatCache = new Map();
		this.loadedData = false;

		this.Data = Data;
	}

	loadData() {
		let typeChart;
		try {
			typeChart = require(this.dataFilePath + 'typechart.js').BattleTypeChart;
		} catch (e) {
			if (e.code !== 'MODULE_NOT_FOUND') {
				throw e;
			}
		}
		if (typeChart) this.data.typeChart = typeChart;

		this.loadPokedex();
		this.loadMoves();
		this.loadItems();
		this.loadAbilities();
		this.loadAliases();
		this.loadLearnsets();
		this.loadFormatsData();
		this.loadTeams();

		this.loadedData = true;
	}

	loadPokedex() {
		if (this.loadedData) this.PokemonCache.clear();

		let pokedex;
		try {
			pokedex = require(this.dataFilePath + 'pokedex.js').BattlePokedex;
		} catch (e) {
			if (e.code !== 'MODULE_NOT_FOUND') {
				throw e;
			}
		}
		if (pokedex) this.data.pokedex = pokedex;
	}

	loadMoves() {
		if (this.loadedData) this.MoveCache.clear();

		let moves;
		try {
			moves = require(this.dataFilePath + 'moves.js').BattleMovedex;
		} catch (e) {
			if (e.code !== 'MODULE_NOT_FOUND') {
				throw e;
			}
		}
		if (moves) this.data.moves = moves;
	}

	loadItems() {
		if (this.loadedData) this.ItemCache.clear();

		let items;
		try {
			items = require(this.dataFilePath + 'items.js').BattleItems;
		} catch (e) {
			if (e.code !== 'MODULE_NOT_FOUND') {
				throw e;
			}
		}
		if (items) this.data.items = items;
	}

	loadAbilities() {
		if (this.loadedData) this.AbilityCache.clear();

		let abilities;
		try {
			abilities = require(this.dataFilePath + 'abilities.js').BattleAbilities;
		} catch (e) {
			if (e.code !== 'MODULE_NOT_FOUND') {
				throw e;
			}
		}
		if (abilities) this.data.abilities = abilities;
	}

	loadAliases() {
		let aliases;
		try {
			aliases = require(this.dataFilePath + 'aliases.js').BattleAliases;
		} catch (e) {
			if (e.code !== 'MODULE_NOT_FOUND') {
				throw e;
			}
		}
		if (aliases) this.data.aliases = aliases;
	}

	loadLearnsets() {
		if (this.loadedData) this.PokemonCache.clear();

		let learnsets;
		try {
			learnsets = require(this.dataFilePath + 'learnsets.js').BattleLearnsets;
		} catch (e) {
			if (e.code !== 'MODULE_NOT_FOUND') {
				throw e;
			}
		}
		if (learnsets) this.data.learnsets = learnsets;
	}

	loadFormatsData() {
		if (this.loadedData) this.PokemonCache.clear();

		let formatsData;
		try {
			formatsData = require(this.dataFilePath + 'formats-data.js').BattleFormatsData;
		} catch (e) {
			if (e.code !== 'MODULE_NOT_FOUND') {
				throw e;
			}
		}
		if (formatsData) this.data.formatsData = formatsData;
	}

	loadTeams() {
		let teams;
		try {
			teams = require(this.dataFilePath + 'teams.js').BattlePokeTeams;
		} catch (e) {
			if (e.code !== 'MODULE_NOT_FOUND') {
				throw e;
			}
		}
		if (teams) this.data.teams = teams;
	}

	/**
	 * @param {any} text
	 * @return {string}
	 */
	toId(text) {
		if (!text) return '';
		let type = typeof text;
		if (type !== 'string') {
			if (type === 'number') {
				text = '' + text;
			} else {
				if (text.id) {
					text = text.id;
				} else {
					text = (text.toString ? text.toString() : JSON.stringify(text));
				}
			}
		}
		return text.toLowerCase().replace(/[^a-z0-9]/g, '');
	}

	/**
	 * @param {any} text
	 * @return {string}
	 */
	toName(text) {
		if (!text) return '';
		let type = typeof text;
		if (type !== 'string') {
			if (type === 'number') {
				text = '' + text;
			} else {
				if (text.name) {
					text = text.name;
				} else {
					text = (text.toString ? text.toString() : JSON.stringify(text));
				}
			}
		}
		if (Config.groups && text.charAt(0) in Config.groups) text = text.substr(1);
		return text.trim();
	}

	/**
	 * @param {any} text
	 * @return {string}
	 */
	toString(text) {
		let type = typeof text;
		if (type === 'string') return text;
		if (type === 'number') return '' + text;
		if (!text) return '';
		return (text.toString ? text.toString() : JSON.stringify(text));
	}

	/**
	 * @param {any} text
	 * @return {string}
	 */
	toAlphaNumeric(text) {
		text = this.toString(text);
		if (!text) return '';
		return text.replace(/[^a-zA-Z0-9 ]/g, '').trim();
	}

	/**
	 * @param {string} text
	 * @return {string}
	 */
	trim(text) {
		return text.trim().replace(whitespaceRegex, ' ').replace(nullCharactersRegex, '');
	}

	/**
	 * @param {Array<string>} list
	 * @param {string} [formatting]
	 * @return {string}
	 */
	joinList(list, formatting) {
		if (!list.length) return '';
		if (!formatting) formatting = '';
		if (list.length === 1) {
			return formatting + list[0] + formatting;
		} else if (list.length === 2) {
			return formatting + list[0] + formatting + " and " + formatting + list[1] + formatting;
		} else {
			let len = list.length - 1;
			return formatting + list.slice(0, len).join(formatting + ", " + formatting) + formatting + ", and " + formatting + list[len] + formatting;
		}
	}

	/**
	 * @param {Array<string>} list
	 * @param {string} tag
	 * @return {string}
	 */
	joinListHtml(list, tag) {
		if (!list.length) return '';
		let openingTag = tag;
		let closingTag = '</' + tag.substr(1);
		if (list.length === 1) {
			return openingTag + list[0] + closingTag;
		} else if (list.length === 2) {
			return openingTag + list[0] + closingTag + " and " + openingTag + list[1] + closingTag;
		} else {
			let len = list.length - 1;
			return openingTag + list.slice(0, len).join(closingTag + ", " + openingTag) + closingTag + ", and " + openingTag + list[len] + closingTag;
		}
	}

	/**
	 * @param {string} str
	 * @return {string}
	 */
	escapeHTML(str) {
		if (!str) return '';
		return ('' + str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;').replace(/\//g, '&#x2f;');
	}

	/**
	 * @param {string} str
	 * @return {string}
	 */
	unescapeHTML(str) {
		if (!str) return '';
		return ('' + str).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#x2f;/g, '/').replace(/&#39;/g, "'").replace(/&#34;/g, '"');
	}

	/**
	 * @param {any} text
	 * @param {any} [room]
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
	 * @template T
	 * @param {Array<T>} array
	 * @return {Array<T>}
	 */
	shuffle(array) {
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
	 * @template T
	 * @param {Array<T>} array
	 * @return {T}
	 */
	sampleOne(array) {
		let len = array.length;
		if (!len) throw new Error("Tools.sampleOne() does not accept empty arrays");
		if (len === 1) return array.slice()[0];
		return this.shuffle(array)[0];
	}

	/**
	 * @template T
	 * @param {Array<T>} array
	 * @param {number | string} amount
	 * @return {Array<T>}
	 */
	sampleMany(array, amount) {
		let len = array.length;
		if (!len) throw new Error("Tools.sampleMany() does not accept empty arrays");
		if (len === 1) return array.slice();
		if (typeof amount === 'string') amount = parseInt(amount);
		if (!amount || isNaN(amount)) throw new Error("Invalid amount in Tools.sampleMany()");
		if (amount > len) amount = len;
		return this.shuffle(array).splice(0, amount);
	}

	/**
	 * @param {Pokemon | string} name
	 * @return {Pokemon}
	 */
	getPokemon(name) {
		if (name instanceof Data.Pokemon) return name;
		let id = this.toId(name);
		if (id in this.data.aliases) {
			name = this.data.aliases[id];
			id = this.toId(name);
		}
		// @ts-ignore
		if (id === 'constructor' || !(id in this.data.pokedex)) return null;
		let pokemon = this.PokemonCache.get(id);
		if (pokemon) return pokemon;
		pokemon = new Data.Pokemon(name, this.data.pokedex[id], this.data.learnsets[id], this.data.formatsData[id]);
		if (!pokemon.tier && pokemon.baseSpecies !== pokemon.species) pokemon.tier = this.data.formatsData[this.toId(pokemon.baseSpecies)].tier;
		if (!pokemon.tier) pokemon.tier = 'Illegal';
		this.PokemonCache.set(id, pokemon);
		return pokemon;
	}

	/**
	 * @param {Move | string} name
	 * @return {Move}
	 */
	getMove(name) {
		if (name instanceof Data.Move) return name;
		let id = this.toId(name);
		if (id in this.data.aliases) {
			name = this.data.aliases[id];
			id = this.toId(name);
		}
		// @ts-ignore
		if (id === 'constructor' || !(id in this.data.moves)) return null;
		let move = this.MoveCache.get(id);
		if (move) return move;
		move = new Data.Move(name, this.data.moves[id]);
		this.MoveCache.set(id, move);
		return move;
	}

	/**
	 * @param {Item | string} name
	 * @return {Item}
	 */
	getItem(name) {
		if (name instanceof Data.Item) return name;
		let id = this.toId(name);
		if (id in this.data.aliases) {
			name = this.data.aliases[id];
			id = this.toId(name);
		}
		// @ts-ignore
		if (id === 'constructor' || !(id in this.data.items)) return null;
		let item = this.ItemCache.get(id);
		if (item) return item;
		item = new Data.Item(name, this.data.items[id]);
		this.ItemCache.set(id, item);
		return item;
	}

	/**
	 * @param {Ability | string} name
	 * @return {Ability}
	 */
	getAbility(name) {
		if (name instanceof Data.Ability) return name;
		let id = this.toId(name);
		if (id in this.data.aliases) {
			name = this.data.aliases[id];
			id = this.toId(name);
		}
		// @ts-ignore
		if (id === 'constructor' || !(id in this.data.abilities)) return null;
		let ability = this.AbilityCache.get(id);
		if (ability) return ability;
		ability = new Data.Ability(name, this.data.abilities[id]);
		this.AbilityCache.set(id, ability);
		return ability;
	}

	/**
	 * @param {Format | string} name
	 * @return {Format}
	 */
	getFormat(name) {
		if (name instanceof Data.Format) return name;
		let id = this.toId(name);
		if (id in this.data.aliases) {
			name = this.data.aliases[id];
			id = this.toId(name);
		}
		// @ts-ignore
		if (id === 'constructor' || !(id in MessageParser.formatsData)) return null;
		let format = this.FormatCache.get(id);
		if (format) return format;
		format = new Data.Format(name, MessageParser.formatsData[id]);
		this.FormatCache.set(id, format);
		return format;
	}

	/**
	 * @param {Move | string} source
	 * @param {Pokemon | string | Array<string>} target
	 * @return {number}
	 */
	getEffectiveness(source, target) {
		let sourceType = (typeof source === 'string' ? source : source.type);
		let targetType;
		if (typeof target === 'string') {
			let pokemon = this.getPokemon(target);
			if (pokemon) {
				targetType = pokemon.types;
			} else {
				targetType = target;
			}
		} else if (target instanceof Array) {
			targetType = target;
		} else {
			targetType = target.types;
		}
		if (targetType instanceof Array) {
			let totalTypeMod = 0;
			for (let i = 0, len = targetType.length; i < len; i++) {
				totalTypeMod += this.getEffectiveness(sourceType, targetType[i]);
			}
			return totalTypeMod;
		}
		let typeData = this.data.typeChart[targetType];
		if (!typeData) return 0;
		switch (typeData.damageTaken[sourceType]) {
		case 1: return 1; // super-effective
		case 2: return -1; // not very effective
		default: return 0;
		}
	}

	/**
	 * @param {Move | string} source
	 * @param {Pokemon | string | Array<string>} target
	 * @return {boolean}
	 */
	isImmune(source, target) {
		let sourceType = (typeof source === 'string' ? source : source.type);
		let targetType;
		if (typeof target === 'string') {
			let pokemon = this.getPokemon(target);
			if (pokemon) {
				targetType = pokemon.types;
			} else {
				targetType = target;
			}
		} else if (target instanceof Array) {
			targetType = target;
		} else {
			targetType = target.types;
		}
		if (targetType instanceof Array) {
			for (let i = 0; i < targetType.length; i++) {
				if (this.isImmune(sourceType, targetType[i])) return true;
			}
			return false;
		}
		let typeData = this.data.typeChart[targetType];
		if (typeData && typeData.damageTaken[sourceType] === 3) return true;
		return false;
	}

	/**
	 * @param {number} number
	 * @param {{precision?: number, hhmmss?: boolean}} [options]
	 * @return {string}
	 */
	toDurationString(number, options) {
		const date = new Date(+number);
		const parts = [date.getUTCFullYear() - 1970, date.getUTCMonth(), date.getUTCDate() - 1, date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()];
		const roundingBoundaries = [6, 15, 12, 30, 30];
		const unitNames = ["second", "minute", "hour", "day", "month", "year"];
		const positiveIndex = parts.findIndex(elem => elem > 0);
		const precision = (options && options.precision ? options.precision : parts.length);
		if (options && options.hhmmss) {
			let string = parts.slice(positiveIndex).map(value => value < 10 ? "0" + value : "" + value).join(":");
			return string.length === 2 ? "00:" + string : string;
		}
		// round least significant displayed unit
		if (positiveIndex + precision < parts.length && precision > 0 && positiveIndex >= 0) {
			if (parts[positiveIndex + precision] >= roundingBoundaries[positiveIndex + precision - 1]) {
				parts[positiveIndex + precision - 1]++;
			}
		}
		return parts.slice(positiveIndex).reverse().map((value, index) => value ? value + " " + unitNames[index] + (value > 1 ? "s" : "") : "").reverse().slice(0, precision).join(" ").trim();
	}

	/**
	 * @param {string} text
	 * @param {Function} callback
	 */
	uploadToHastebin(text, callback) {
		if (typeof callback !== 'function') return false;
		let action = url.parse('https://hastebin.com/documents');
		let options = {
			hostname: action.hostname,
			path: action.pathname,
			method: 'POST',
		};

		let request = https.request(options, response => {
			response.setEncoding('utf8');
			let data = '';
			response.on('data', chunk => {
				data += chunk;
			});
			response.on('end', () => {
				let key;
				try {
					let pageData = JSON.parse(data);
					key = pageData.key;
				} catch (e) {
					if (/^[^<]*<!DOCTYPE html>/.test(data)) {
						return callback('Cloudflare-related error uploading to Hastebin: ' + e.message);
					} else {
						return callback('Unknown error uploading to Hastebin: ' + e.message);
					}
				}
				callback('https://hastebin.com/raw/' + key);
			});
		});

		request.on('error', error => console.log('Login error: ' + error.stack));

		if (text) request.write(text);
		request.end();
	}
}

let tools = new Tools();
tools.loadData();

module.exports = tools;
