/**
 * Games
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * This file contains the base game class and games manager
 *
 * @license MIT license
 */

'use strict';

/**
 * @typedef GameVariation
 * @type {Object}
 * @property {string} name
 * @property {string} id
 * @property {string} description
 * @property {string} variation
 * @property {string} variationId
 * @property {Array<string>} aliases
 * @property {Array<string>} variationAliases
 */

/**
 * @typedef GameMode
 * @type {Object}
 * @property {string} name
 * @property {string} id
 * @property {string} description
 * @property {string} naming
 * @property {{[k: string]: string}} commands
 * @property {Function} mode
 * @property {Game} game
 * @property {string} modeId
 * @property {Array<string>} aliases
 * @property {boolean} disabled
 * @property {Array<string>} requiredProperties
 */

const fs = require('fs');
const Room = require('./rooms').Room; // eslint-disable-line no-unused-vars
const User = require('./users').User; // eslint-disable-line no-unused-vars

class Player {
	/**
	 * @param {User} user
	 */
	constructor(user) {
		this.name = user.name;
		this.id = user.id;
		this.eliminated = false;
		/**@type {?string} */
		this.team = null;
	}

	/**
	 * @param {string} message
	 */
	say(message) {
		Users.add(this.name).say(message);
	}
}

exports.Player = Player;

class Game {
	/**
	 * @param {Room} room
	 */
	constructor(room) {
		this.room = room;
		this.name = '';
		this.id = '';
		this.modeId = '';
		this.description = '';
		/**@type {{[k: string]: Player}} */
		this.players = {};
		this.playerCount = 0;
		this.round = 0;
		this.started = false;
		this.ended = false;
		this.freeJoin = false;
		/**@type {Map<Player, number>} */
		this.winners = new Map();
		/**@type {?Map<Player, number>} */
		this.points = null;
		/**@type {?Map<Player, number>} */
		this.lives = null;
		/**@type {?Game} */
		this.parentGame = null;
		/**@type {?Game} */
		this.childGame = null;
		/**@type {?NodeJS.Timer} */
		this.timeout = null;
		/**@type {?string} */
		this.variation = null;
		/**@type {?boolean | {[k: string]: boolean}} */
		this.pmCommands = null;
		/**@type {?Array<string>} */
		this.answers = null;
		/**@type {?number} */
		this.maxPoints = null;
		/**@type {?Map<Player, boolean>} */
		this.roundGuesses = null;
	}

	onSignups() {}

	onStart() {}

	onNextRound() {}

	onEnd() {}

	/**
	 * @param {Map<Player, number>} winners
	 */
	onChildEnd(winners) {}

	/**
	 * @param {User} user
	 */
	onJoin(user) {}

	/**
	 * @param {User} user
	 */
	onLeave(user) {}

	/**
	 * @param {User} user
	 */
	onRename(user) {}

	setAnswers() {}

	/**
	 * @param {string} message;
	 */
	say(message) {
		this.room.say(message);
	}

	/**
	 * @param {string} message
	 * @param {Function} listener
	 */
	on(message, listener) {
		this.room.on(message, listener);
	}

	/**
	 * @param {number} bits
	 * @param {User} user
	 */
	addBits(bits, user) {
		Storage.addPoints(bits, user, this.room.id);
	}

	/**
	 * @param {number} bits
	 * @param {User} user
	 */
	removeBits(bits, user) {
		Storage.removePoints(bits, user, this.room.id);
	}

	/**
	 * @param {User} user
	 */
	getBits(user) {
		return Storage.getPoints(user, this.room.id);
	}

	signups() {
		this.say("Hosting a game of " + this.name + "! " + (this.freeJoin ? "(free join)" : "If you would like to play, use the command ``" + Config.commandCharacter + "join``."));
		if (this.description) this.say("Description: " + this.description);
		if (typeof this.onSignups === 'function') this.onSignups();
		if (this.freeJoin) this.started = true;
	}

	start() {
		if (this.started || (this.modeId === 'team' && this.playerCount < 2)) return;
		this.started = true;
		if (typeof this.onStart === 'function') this.onStart();
	}

	end() {
		if (this.ended) return;
		if (this.timeout) clearTimeout(this.timeout);
		if (typeof this.onEnd === 'function') this.onEnd();
		this.ended = true;
		this.room.game = null;
		if (this.parentGame) {
			this.room.game = this.parentGame;
			if (typeof this.parentGame.onChildEnd === 'function') this.parentGame.onChildEnd(this.winners);
		}
	}

	forceEnd() {
		if (this.ended) return;
		if (this.timeout) clearTimeout(this.timeout);
		if (this.parentGame) {
			this.parentGame.forceEnd();
			return;
		}
		this.say("The game was forcibly ended.");
		this.ended = true;
		this.room.game = null;
	}

	nextRound() {
		if (this.timeout) clearTimeout(this.timeout);
		this.round++;
		if (typeof this.onNextRound === 'function') this.onNextRound();
	}

	/**
	 * @param {User} user
	 * @return {Player}
	 */
	addPlayer(user) {
		if (user.id in this.players) return this.players[user.id];
		let player = new Player(user);
		this.players[user.id] = player;
		this.playerCount++;
		return player;
	}

	/**
	 * @param {User} user
	 */
	removePlayer(user) {
		if (!(user.id in this.players) || this.players[user.id].eliminated) return;
		if (this.started) {
			this.players[user.id].eliminated = true;
		} else {
			delete this.players[user.id];
			this.playerCount--;
		}
	}

	/**
	 * @param {User} user
	 * @param {string} oldName
	 */
	renamePlayer(user, oldName) {
		let oldId = Tools.toId(oldName);
		if (!(oldId in this.players)) return;
		let player = this.players[oldId];
		player.name = user.name;
		if (player.id === user.id || user.id in this.players) return;
		player.id = user.id;
		this.players[user.id] = player;
		delete this.players[oldId];
		if (typeof this.onRename === 'function') this.onRename(user);
		if (this.parentGame && typeof this.parentGame.onRename === 'function') this.parentGame.onRename(user);
	}

	/**
	 * @param {User} user
	 */
	join(user) {
		if (user.id in this.players || this.started) return;
		if (this.freeJoin) return user.say(this.name + " does not require you to join.");
		this.addPlayer(user);
		user.say('You have joined the game of ' + this.name + '!');
		if (typeof this.onJoin === 'function') this.onJoin(user);
	}

	/**
	 * @param {User} user
	 */
	leave(user) {
		if (this.parentGame) {
			this.parentGame.leave(user);
			return;
		}
		if (!(user.id in this.players) || this.players[user.id].eliminated) return;
		this.removePlayer(user);
		user.say("You have left the game of " + this.name + "!");
		if (typeof this.onLeave === 'function') this.onLeave(user);
	}

	/**
	 * @param {{[k: string]: Player}} [players]
	 * @return {string}
	 */
	getPlayerNames(players) {
		if (!players) players = this.players;
		let names = [];
		for (let i in players) {
			names.push(players[i].name);
		}
		return names.join(", ");
	}

	/**
	 * @param {{[k: string]: Player}} [players]
	 * @return {string}
	 */
	getPoints(players) {
		if (!this.points) return '';
		if (!players) players = this.players;
		let list = [];
		for (let i in players) {
			let points = this.points.get(players[i]);
			list.push(players[i].name + (points ? "(" + points + ")" : ""));
		}
		return list.join(", ");
	}

	/**
	 * @param {{[k: string]: Player}} [players]
	 * @return {string}
	 */
	getLives(players) {
		if (!this.lives) return '';
		if (!players) players = this.players;
		let list = [];
		for (let i in players) {
			let lives = this.lives.get(players[i]);
			list.push(players[i].name + "(" + lives + "♥)");
		}
		return list.join(", ");
	}

	/**
	 * @return {{[k: string]: Player}}
	 */
	getRemainingPlayers() {
		let remainingPlayers = {};
		for (let i in this.players) {
			if (!this.players[i].eliminated) remainingPlayers[i] = this.players[i];
		}
		return remainingPlayers;
	}

	/**
	 * @return {number}
	 */
	getRemainingPlayerCount() {
		let count = 0;
		for (let i in this.players) {
			if (!this.players[i].eliminated) count++;
		}
		return count;
	}

	/**
	 * @param {{[k: string]: Player}} [players]
	 * @return {Array<Player>}
	 */
	shufflePlayers(players) {
		if (!players) players = this.players;
		let list = [];
		for (let i in players) {
			list.push(players[i]);
		}
		return Tools.shuffle(list);
	}

	/**
	 * @param {string} guess
	 */
	checkAnswer(guess) {
		if (!this.answers) return;
		for (let i = 0, len = this.answers.length; i < len; i++) {
			if (Tools.toId(this.answers[i]) === guess) {
				return true;
			}
		}
		return false;
	}

	/**
	 * @param {string} guess
	 */
	filterGuess(guess) {}

	/**
	 * @param {string} guess
	 * @param {Player} player
	 */
	onGuess(guess, player) {}

	/**
	 * @param {string} guess
	 * @param {Room} room
	 * @param {User} user
	 */
	guess(guess, room, user) {
		if (!this.answers || !this.answers.length || !this.points || !this.maxPoints || !this.started || (user.id in this.players && this.players[user.id].eliminated)) return;
		if (!(user.id in this.players)) this.addPlayer(user);
		let player = this.players[user.id];
		guess = Tools.toId(guess);
		if (!guess) return;
		if (this.filterGuess && this.filterGuess(guess)) return;
		if (this.roundGuesses) {
			if (this.roundGuesses.has(player)) return;
			this.roundGuesses.set(player, true);
		}
		if (!this.checkAnswer(guess)) {
			if (this.onGuess) this.onGuess(guess, player);
			return;
		}
		if (this.timeout) clearTimeout(this.timeout);
		let points = this.points.get(player) || 0;
		points += 1;
		this.points.set(player, points);
		if (points >= this.maxPoints) {
			this.winners.set(player, points);
			this.say("Correct! " + user.name + " wins the game! (Answer" + (this.answers.length > 1 ? "s" : "") + ": __" + this.answers.join(", ") + "__)");
			this.end();
			return;
		}
		this.say("Correct! " + user.name + " advances to " + points + " point" + (points > 1 ? "s" : "") + ". (Answer" + (this.answers.length > 1 ? "s" : "") + ": __" + this.answers.join(", ") + "__)");
		this.answers = [];
		this.timeout = setTimeout(() => this.nextRound(), 5 * 1000);
	}
}

exports.Game = Game;

/**
 * @typedef GameFormat
 * @type {Object}
 * @property {string} name
 * @property {string} id
 * @property {string} inherits
 * @property {string} variationId
 * @property {string} modeId
 * @property {boolean} inheritOnly
 * @property {boolean} internal
 * @property {Array<GameVariation>} variations
 * @property {{[k: string]: GameFormat}} variationIds
 * @property {Array<string>} modes
 * @property {{[k: string]: string}} modeIds
 * @property {Game} game
 * @property {Function} install
 * @property {{[k: string]: string}} commands
 * @property {Array<string>} aliases
 * @property {{[k: string]: string}} variationAliases
 * @property {{[k: string]: string}} modeAliases
 */

class Games {
	constructor() {
		/**@type {{[k: string]: GameFormat}} */
		this.games = {};
		/**@type {{[k: string]: GameMode}} */
		this.modes = {};
		/**@type {{[k: string]: string}} */
		this.aliases = {};
		/**@type {{[k: string]: string}} */
		this.commands = {};

		this.Game = Game;
		this.Player = Player;
	}

	loadGames() {
		let games;
		try {
			games = fs.readdirSync('./games');
		} catch (e) {}
		if (!games) return;
		for (let i = 0, len = games.length; i < len; i++) {
			let fileName = games[i];
			if (!fileName.endsWith('.js')) continue;
			let game = require('./games/' + fileName);
			this.games[game.id] = game;
		}

		let modes;
		try {
			modes = fs.readdirSync('./games/modes');
		} catch (e) {}
		if (modes) {
			for (let i = 0, len = modes.length; i < len; i++) {
				let fileName = modes[i];
				if (!fileName.endsWith('.js')) continue;
				/**@type {GameMode} */
				let mode = require('./games/modes/' + fileName);
				this.modes[mode.id] = mode;
				if (mode.commands) {
					for (let i in mode.commands) {
						if (i in this.commands && this.commands[i] !== mode.commands[i]) throw new Error(mode.name + " command '" + i + "' is already used for a different game function (" + this.commands[i] + ").");
						if (i in Commands) {
							if (i in this.commands) continue;
							throw new Error(mode.name + " mode command '" + i + "' is already a command.");
						}
						this.commands[i] = mode.commands[i];
					}
				}
			}

			for (let i in this.modes) {
				let mode = this.modes[i];
				if (mode.aliases) {
					for (let i = 0, len = mode.aliases.length; i < len; i++) {
						let alias = Tools.toId(mode.aliases[i]);
						if (alias in this.modes) throw new Error(mode.name + " alias '" + alias + "' is already a mode.");
						this.modes[alias] = mode;
						mode.aliases[i] = alias;
					}
				}
			}
		}

		for (let i in this.games) {
			let game = this.games[i];
			if (game.inherits) {
				if (!game.install) throw new Error(game.name + " must have an install method to inherit from other games.");
				let parentId = Tools.toId(game.inherits);
				if (parentId === game.id || !(parentId in this.games)) throw new Error(game.name + " inherits from an invalid game.");
				if (!this.games[parentId].install) throw new Error(game.name + "'s parent game '" + game.inherits + "' must have an install method.");
				game.inherits = parentId;
			}
			if (game.commands) {
				for (let i in game.commands) {
					if (i in this.commands && this.commands[i] !== game.commands[i]) throw new Error(game.name + " command '" + i + "' is already used for a different game function (" + this.commands[i] + ").");
					if (i in Commands) {
						if (i in this.commands) continue;
						throw new Error(game.name + " command '" + i + "' is already a command.");
					}
					this.commands[i] = game.commands[i];
				}
			}
			if (game.aliases) {
				for (let i = 0, len = game.aliases.length; i < len; i++) {
					let alias = Tools.toId(game.aliases[i]);
					if (!(alias in this.aliases) && !(alias in this.games)) this.aliases[alias] = game.id;
				}
			}
			if (game.variations) {
				game.variationIds = {};
				for (let i = 0, len = game.variations.length; i < len; i++) {
					/**@type {GameVariation} */
					let variation = game.variations[i];
					let id = Tools.toId(variation.name);
					if (id in this.games) throw new Error(game.name + " variation '" + variation.name + "' is already a game.");
					variation.id = id;
					let variationId = Tools.toId(variation.variation);
					if (variationId in this.modes) throw new Error(variation.name + "'s variation '" + variation.variation + "' exists as a mode.");
					variation.variationId = variationId;
					if (!(id in this.aliases)) this.aliases[id] = game.id + ',' + variationId;
					if (variation.aliases) {
						for (let i = 0, len = variation.aliases.length; i < len; i++) {
							let alias = Tools.toId(variation.aliases[i]);
							if (!(alias in this.aliases) && !(alias in this.modes)) this.aliases[alias] = game.id + ',' + variationId;
						}
					}
					if (variation.variationAliases) {
						if (!game.variationAliases) game.variationAliases = {};
						for (let i = 0, len = variation.variationAliases.length; i < len; i++) {
							let alias = Tools.toId(variation.variationAliases[i]);
							if (!(alias in game.variationAliases) && !(alias in this.modes)) game.variationAliases[alias] = variationId;
						}
					}
					game.variationIds[variationId] = Object.assign(Object.assign({}, game), variation);
				}
			}
			if (game.modes) {
				game.modeIds = {};
				for (let i = 0, len = game.modes.length; i < len; i++) {
					let modeId = Tools.toId(game.modes[i]);
					if (!(modeId in this.modes)) throw new Error(game.name + " mode '" + modeId + "' does not exist.");
					game.modeIds[modeId] = modeId;
					let prefix = this.modes[modeId].naming === 'prefix';
					let id;
					if (prefix) {
						id = this.modes[modeId].id + game.id;
					} else {
						id = game.id + this.modes[modeId].id;
					}
					if (!(id in this.aliases)) this.aliases[id] = game.id + ',' + modeId;
					if (this.modes[modeId].aliases) {
						if (!game.modeAliases) game.modeAliases = {};
						for (let i = 0, len = this.modes[modeId].aliases.length; i < len; i++) {
							game.modeAliases[this.modes[modeId].aliases[i]] = modeId;
							let id;
							if (prefix) {
								id = this.modes[modeId].aliases[i] + game.id;
							} else {
								id = game.id + this.modes[modeId].aliases[i];
							}
							if (!(id in this.aliases)) this.aliases[id] = game.id + ',' + modeId;
						}
					}
				}
			}
		}

		this.loadGameCommands();
	}

	loadGameCommands() {
		for (let i in this.commands) {
			let gameFunction = this.commands[i];
			if (gameFunction in this.commands && gameFunction !== i) {
				Commands[i] = gameFunction;
				continue;
			}
			Commands[i] = function (target, room, user, command, time) {
				if (room.game) {
					// @ts-ignore
					if (room.game.commands && gameFunction in room.game.commands && typeof room.game[gameFunction] === 'function') room.game[gameFunction](target, room, user, command, time);
				} else if (room === user) {
					user.rooms.forEach(function (value, room) {
						// @ts-ignore
						if (room.game && room.game.commands && gameFunction in room.game.commands && room.game.pmCommands && (room.game.pmCommands === true || i in room.game.pmCommands) && typeof room.game[gameFunction] === 'function') room.game[gameFunction](target, user, user, command, time);
					});
				}
			};
		}
	}
	/**
	 * @param {string | GameFormat} target
	 * @return {?GameFormat}
	 */
	getFormat(target) {
		if (typeof target === 'object') return target;
		let targets = target.split(',');
		let id = Tools.toId(targets.shift());
		if (id in this.aliases) {
			id = this.aliases[id];
			if (id.includes(',')) return this.getFormat(id + ',' + targets.join(','));
		}
		if (!(id in this.games)) return null;
		let format = Object.assign({}, this.games[id]);
		let variation, mode;
		for (let i = 0, len = targets.length; i < len; i++) {
			let id = Tools.toId(targets[i]);
			if (format.variationIds) {
				if (format.variationAliases && id in format.variationAliases) id = format.variationAliases[id];
				if (id in format.variationIds) variation = format.variationIds[id];
			}
			if (format.modeIds) {
				if (format.modeAliases && id in format.modeAliases) id = format.modeAliases[id];
				if (id in format.modeIds) mode = format.modeIds[id];
			}
		}
		if (variation) format = Object.assign({}, variation);
		if (mode) format.modeId = mode;
		return format;
	}

	/**
	 * @param {string | GameFormat} target
	 * @param {Room} room
	 * @return {?Game}
	 */
	createGame(target, room) {
		if (room.game) {
			room.say("A game of " + room.game.name + " is already in progress.");
			return null;
		}
		let format = this.getFormat(target);
		if (!format) return null;
		let baseClass;
		if (format.inherits) {
			let parentFormat = format;
			/**@type {Array<GameFormat>} */
			let parentFormats = [];
			while (parentFormat.inherits) {
				parentFormat = this.games[parentFormat.inherits];
				if (parentFormats.includes(parentFormat)) throw new Error("Infinite inherit loop created by " + format.name + ".");
				parentFormats.unshift(parentFormat);
			}
			baseClass = Game;
			for (let i = 0, len = parentFormats.length; i < len; i++) {
				baseClass = parentFormats[i].install(baseClass);
			}
			baseClass = format.install(baseClass);
		} else if (format.install) {
			baseClass = format.install(Game);
		} else {
			baseClass = format.game;
		}
		if (!baseClass) throw new Error(target + " has no base class.");
		room.game = new baseClass(room); // eslint-disable-line new-cap
		Object.assign(room.game, format);
		if (format.modeId) this.modes[format.modeId].mode(room.game);
		return room.game;
	}

	/**
	 * @param {string} format
	 * @param {Game} parentGame
	 * @return {?Game}
	 */
	createChildGame(format, parentGame) {
		parentGame.room.game = null;
		let childGame = this.createGame(format, parentGame.room);
		if (!childGame) {
			parentGame.room.game = parentGame;
			return null;
		}
		parentGame.childGame = childGame;
		childGame.parentGame = parentGame;
		childGame.players = parentGame.players;
		childGame.playerCount = parentGame.playerCount;
		return childGame;
	}
}

exports.Games = new Games();
