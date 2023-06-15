/**
 * Tools
 * Phantom Ozonix - https://github.com/Ishaan0132/Phantom-Ozonix
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
* @property {string} [doublesTier]
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
* @property {Array<string>} badges
* @property {Array<string>} characters
* @property {Array<Array<string>>} teams
* @property {Array<string>} trainerClasses
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
			badges: [],
			characters: [],
			locations: [],
			teams: [],
			trainerClasses: [],
		};
		this.gen = 8;
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
		this.loadBadges();
		this.loadCharacters();
		this.loadLocations();
		this.loadTeams();
		this.loadTrainerClasses();

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

	loadBadges() {
		let badges;
		try {
			badges = require(this.dataFilePath + 'badges.js').BattleBadges;
		} catch (e) {
			if (e.code !== 'MODULE_NOT_FOUND') {
				throw e;
			}
		}
		if (badges) this.data.badges = badges;
	}

	loadCharacters() {
		let characters;
		try {
			characters = require(this.dataFilePath + 'characters.js').BattleCharacters;
		} catch (e) {
			if (e.code !== 'MODULE_NOT_FOUND') {
				throw e;
			}
		}
		if (characters) this.data.characters = characters;
	}
	 loadLocations() {
		let locations;
		try {
			locations = require(this.dataFilePath + 'locations.js').BattleLocations;
		} catch (e) {
			if (e.code !== 'MODULE_NOT_FOUND') {
				throw e;
			}
		}
		if (locations) this.data.locations = locations;
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

	loadTrainerClasses() {
		let trainerClasses;
		try {
			trainerClasses = require(this.dataFilePath + 'trainer-classes.js').BattleTrainerClasses;
		} catch (e) {
			if (e.code !== 'MODULE_NOT_FOUND') {
				throw e;
			}
		}
		if (trainerClasses) this.data.trainerClasses = trainerClasses;
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
	 * @param {string} usernameText
	 * @return {{away: boolean, status: string, username: string}}
	 */
	parseUsernameText(usernameText) {
		let away = false;
		let status = '';
		let username = '';
		const atIndex = usernameText.indexOf('@');
		if (atIndex !== -1) {
			username = usernameText.substr(0, atIndex);
			status = usernameText.substr(atIndex + 1);
			away = status.charAt(0) === '!';
		} else {
			username = usernameText;
		}

		return {away, status, username};
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
	 * @return {?Pokemon}
	 */
	getPokemon(name) {
		if (name instanceof Data.Pokemon) return name;
		let id = this.toId(name);
		if (id in this.data.aliases) {
			name = this.data.aliases[id];
			id = this.toId(name);
		}
		let pokemon = this.PokemonCache.get(id);
		if (pokemon) return pokemon;
		if (id === 'constructor') return null;
		if (!(id in this.data.pokedex)) {
			let aliasTo = '';
			if (id.startsWith('mega') && this.data.pokedex[id.slice(4) + 'mega']) {
				aliasTo = id.slice(4) + 'mega';
			} else if (id.startsWith('m') && this.data.pokedex[id.slice(1) + 'mega']) {
				aliasTo = id.slice(1) + 'mega';
			} else if (id.startsWith('primal') && this.data.pokedex[id.slice(6) + 'primal']) {
				aliasTo = id.slice(6) + 'primal';
			} else if (id.startsWith('p') && this.data.pokedex[id.slice(1) + 'primal']) {
				aliasTo = id.slice(1) + 'primal';
			}
			if (aliasTo) {
				let pokemon = this.getPokemon(aliasTo);
				if (pokemon) {
					this.PokemonCache.set(id, pokemon);
					return pokemon;
				}
			}
			return null;
		}
		pokemon = new Data.Pokemon(name, this.data.pokedex[id], this.data.learnsets[id], this.data.formatsData[id]);
		if (!pokemon.tier && !pokemon.doublesTier && pokemon.baseSpecies !== pokemon.species) {
			if (pokemon.baseSpecies === 'Mimikyu') {
				pokemon.tier = this.data.formatsData[this.toId(pokemon.baseSpecies)].tier;
				pokemon.doublesTier = this.data.formatsData[this.toId(pokemon.baseSpecies)].doublesTier;
			} else if (pokemon.speciesid.endsWith('totem')) {
				pokemon.tier = this.data.formatsData[pokemon.speciesid.slice(0, -5)].tier;
				pokemon.doublesTier = this.data.formatsData[pokemon.speciesid.slice(0, -5)].doublesTier;
			} else {
				pokemon.tier = this.data.formatsData[this.toId(pokemon.baseSpecies)].tier;
				pokemon.doublesTier = this.data.formatsData[this.toId(pokemon.baseSpecies)].doublesTier;
			}
		}
		if (!pokemon.tier) pokemon.tier = 'Illegal';
		if (!pokemon.doublesTier) pokemon.doublesTier = pokemon.tier;
		this.PokemonCache.set(id, pokemon);
		return pokemon;
	}

	/**
	 * @param {Pokemon | string} name
	 * @return {Pokemon}
	 */
	getExistingPokemon(name) {
		let pokemon = this.getPokemon(name);
		if (!pokemon) throw new Error("Expected Pokemon for '" + name + "'");
		return pokemon;
	}

	/**
	 * @param {Move | string} name
	 * @return {?Move}
	 */
	getMove(name) {
		if (name instanceof Data.Move) return name;
		let id = this.toId(name);
		if (id in this.data.aliases) {
			name = this.data.aliases[id];
			id = this.toId(name);
		}
		if (id === 'constructor' || !(id in this.data.moves)) return null;
		let move = this.MoveCache.get(id);
		if (move) return move;
		move = new Data.Move(name, this.data.moves[id]);
		this.MoveCache.set(id, move);
		return move;
	}

	/**
	 * @param {Move | string} name
	 * @return {Move}
	 */
	getExistingMove(name) {
		let move = this.getMove(name);
		if (!move) throw new Error("Expected move for '" + name + "'");
		return move;
	}

	/**
	 * @param {Item | string} name
	 * @return {?Item}
	 */
	getItem(name) {
		if (name instanceof Data.Item) return name;
		let id = this.toId(name);
		if (id in this.data.aliases) {
			name = this.data.aliases[id];
			id = this.toId(name);
		}
		if (id === 'constructor' || !(id in this.data.items)) return null;
		let item = this.ItemCache.get(id);
		if (item) return item;
		item = new Data.Item(name, this.data.items[id]);
		this.ItemCache.set(id, item);
		return item;
	}

	/**
	 * @param {Item | string} name
	 * @return {Item}
	 */
	getExistingItem(name) {
		let item = this.getItem(name);
		if (!item) throw new Error("Expected item for '" + name + "'");
		return item;
	}

	/**
	 * @param {Ability | string} name
	 * @return {?Ability}
	 */
	getAbility(name) {
		if (name instanceof Data.Ability) return name;
		let id = this.toId(name);
		if (id in this.data.aliases) {
			name = this.data.aliases[id];
			id = this.toId(name);
		}
		if (id === 'constructor' || !(id in this.data.abilities)) return null;
		let ability = this.AbilityCache.get(id);
		if (ability) return ability;
		ability = new Data.Ability(name, this.data.abilities[id]);
		this.AbilityCache.set(id, ability);
		return ability;
	}

	/**
	 * @param {Ability | string} name
	 * @return {Ability}
	 */
	getExistingAbility(name) {
		let ability = this.getAbility(name);
		if (!ability) throw new Error("Expected ability for '" + name + "'");
		return ability;
	}

	/**
	 * @param {Format | string} name
	 * @return {?Format}
	 */
	getFormat(name) {
		if (name instanceof Data.Format) return name;
		let id = this.toId(name);
		if (id in this.data.aliases) {
			name = this.data.aliases[id];
			id = this.toId(name);
		}
		if ('gen' + this.gen + id in MessageParser.formatsData) {
			id = 'gen' + this.gen + id;
		}
		if (id === 'constructor' || !(id in MessageParser.formatsData)) return null;
		let format = this.FormatCache.get(id);
		if (format) return format;
		format = new Data.Format(name, MessageParser.formatsData[id]);
		this.FormatCache.set(id, format);
		return format;
	}

	/**
	 * @param {Format | string} name
	 * @return {Format}
	 */
	getExistingFormat(name) {
		let format = this.getFormat(name);
		if (!format) throw new Error("Expected format for '" + name + "'");
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

	/**
	 * @template T
	 * @param {T} obj
	 * @return {T}
	 */
	deepFreeze(obj) {
		if (!obj) return obj;
		let type = typeof obj;
		if (type === 'function' || type === 'string' || type === 'number') return obj;
		if (obj instanceof Array) {
			for (let i = 0; i < obj.length; i++) {
				this.deepFreeze(obj[i]);
			}
		} else if (obj instanceof Object) {
			for (let i in obj) {
				this.deepFreeze(obj[i]);
			}
		}
		Object.freeze(obj);
		return obj;
	}

	freezeData() {
		for (let i in this.data.pokedex) {
			this.deepFreeze(this.getPokemon(i));
		}

		for (let i in this.data.moves) {
			this.deepFreeze(this.getMove(i));
		}

		for (let i in this.data.items) {
			this.deepFreeze(this.getItem(i));
		}

		for (let i in this.data.abilities) {
			this.deepFreeze(this.getAbility(i));
		}

		this.deepFreeze(this.data);
	}
}

let tools = new Tools();
tools.loadData();

module.exports = tools;
