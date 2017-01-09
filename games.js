/**
 * Games
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * This file contains the base game class and games manager
 *
 * @license MIT license
 */

'use strict';

const fs = require('fs');

class Player {
	constructor(user) {
		this.name = user.name;
		this.id = user.id;
		this.eliminated = false;
	}

	say(message) {
		Users.add(this.name).say(message);
	}
}

class Game {
	constructor(room) {
		this.room = room;
		this.players = {};
		this.playerCount = 0;
		this.round = 0;
		this.started = false;
		this.ended = false;
		this.freeJoin = false;
	}

	say(message) {
		this.room.say(message);
	}

	on(message, listener) {
		this.room.on(message, listener);
	}

	addBits(bits, user) {
		Storage.addPoints(bits, user, this.room.id);
	}

	removeBits(bits, user) {
		Storage.removePoints(bits, user, this.room.id);
	}

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
		if (this.started) return;
		this.started = true;
		if (typeof this.onStart === 'function') this.onStart();
	}

	end() {
		if (this.ended) return;
		if (this.timeout) clearTimeout(this.timeout);
		if (typeof this.onEnd === 'function') this.onEnd();
		this.ended = true;
		this.room.game = null;
	}

	forceEnd() {
		if (this.ended) return;
		if (this.timeout) clearTimeout(this.timeout);
		this.say("The game was forcibly ended.");
		this.ended = true;
		this.room.game = null;
	}

	nextRound() {
		if (this.timeout) clearTimeout(this.timeout);
		this.round++;
		if (typeof this.onNextRound === 'function') this.onNextRound();
	}

	addPlayer(user) {
		if (user.id in this.players) return;
		let player = new Player(user);
		this.players[user.id] = player;
		this.playerCount++;
		return player;
	}

	removePlayer(user) {
		if (!(user.id in this.players) || this.players[user.id].eliminated) return;
		if (this.started) {
			this.players[user.id].eliminated = true;
		} else {
			delete this.players[user.id];
			this.playerCount--;
		}
	}

	renamePlayer(user, oldName) {
		let oldId = Tools.toId(oldName);
		if (!(oldId in this.players)) return;
		let player = this.players[oldId];
		player.name = user.name;
		if (player.id === user.id || user.id in this.players) return;
		player.id = user.id;
		this.players[user.id] = player;
		delete this.players[oldId];
		if (this.onRename) this.onRename(user);
	}

	join(user) {
		if (user.id in this.players || this.started) return;
		if (this.freeJoin) return user.say(this.name + " does not require you to join.");
		this.addPlayer(user);
		user.say('You have joined the game of ' + this.name + '!');
		if (typeof this.onJoin === 'function') this.onJoin(user);
	}

	leave(user) {
		if (!(user.id in this.players) || this.players[user.id].eliminated) return;
		this.removePlayer(user);
		user.say("You have left the game of " + this.name + "!");
		if (typeof this.onLeave === 'function') this.onLeave(user);
	}

	getPlayerNames(players) {
		if (!players) players = this.players;
		let names = [];
		for (let i in players) {
			names.push(players[i].name);
		}
		return names.join(", ");
	}

	getPoints(players) {
		if (!players) players = this.players;
		let list = [];
		for (let i in players) {
			let points = this.points.get(players[i]);
			list.push(players[i].name + (points ? "(" + points + ")" : ""));
		}
		return list.join(", ");
	}

	getLives(players) {
		if (!players) players = this.players;
		let list = [];
		for (let i in players) {
			let lives = this.lives.get(players[i]);
			list.push(players[i].name + "(" + lives + "♥)");
		}
		return list.join(", ");
	}

	getRemainingPlayers() {
		let remainingPlayers = {};
		for (let i in this.players) {
			if (!this.players[i].eliminated) remainingPlayers[i] = this.players[i];
		}
		return remainingPlayers;
	}

	getRemainingPlayerCount() {
		let count = 0;
		for (let i in this.players) {
			if (!this.players[i].eliminated) count++;
		}
		return count;
	}

	shufflePlayers(players) {
		if (!players) players = this.players;
		let list = [];
		for (let i in players) {
			list.push(players[i]);
		}
		return Tools.shuffle(list);
	}
}

class GamesManager {
	constructor() {
		this.games = {};
		this.modes = {};
		this.aliases = {};
		this.commands = {};
	}

	loadGames() {
		let games;
		try {
			games = fs.readdirSync('./games');
		} catch (e) {}
		if (!games) return;
		for (let i = 0, len = games.length; i < len; i++) {
			let game = games[i];
			if (!game.endsWith('.js')) continue;
			game = require('./games/' + game);
			this.games[game.id] = game;
		}

		let modes;
		try {
			modes = fs.readdirSync('./games/modes');
		} catch (e) {}
		if (modes) {
			for (let i = 0, len = modes.length; i < len; i++) {
				let mode = modes[i];
				if (!mode.endsWith('.js')) continue;
				mode = require('./games/modes/' + mode);
				this.modes[mode.id] = mode;
				if (mode.commands) {
					for (let i in mode.commands) {
						if (i in Commands) {
							if (i in this.commands) continue;
							throw new Error(mode.name + " mode command '" + i + "' is already a command.");
						}
						let gameFunction = mode.commands[i];
						this.commands[i] = gameFunction;
						if (gameFunction in mode.commands && gameFunction !== i) {
							Commands[i] = mode.commands[gameFunction];
							continue;
						}
						Commands[i] = function (target, room, user, command, time) {
							if (!room.game) return;
							if (typeof room.game[gameFunction] === 'function') room.game[gameFunction](target, user, command, time);
						};
					}
				}
			}
		}

		for (let i in this.games) {
			let game = this.games[i];
			if (game.commands) {
				for (let i in game.commands) {
					if (i in Commands) {
						if (i in this.commands) continue;
						throw new Error(game.name + " command '" + i + "' is already a command.");
					}
					let gameFunction = game.commands[i];
					this.commands[i] = gameFunction;
					if (gameFunction in game.commands && gameFunction !== i) {
						Commands[i] = game.commands[gameFunction];
						continue;
					}
					Commands[i] = function (target, room, user, command, time) {
						if (!room.game) return;
						if (typeof room.game[gameFunction] === 'function') room.game[gameFunction](target, user, command, time);
					};
				}
			}
			if (game.aliases) {
				for (let i = 0, len = game.aliases.length; i < len; i++) {
					let alias = Tools.toId(game.aliases[i]);
					if (!(alias in this.aliases) && !(alias in this.games)) this.aliases[alias] = game.id;
				}
			}
			if (game.variations) {
				let variations = game.variations.slice();
				game.variations = {};
				for (let i = 0, len = variations.length; i < len; i++) {
					let variation = variations[i];
					let id = Tools.toId(variation.name);
					if (id in this.games) throw new Error(game.name + " variation '" + variation.name + "' is already a game.");
					variation.id = id;
					let variationId = Tools.toId(variation.variation);
					if (variationId in this.modes) throw new Error(variation.name + "'s variation '" + variation.variation + "' exists as a mode.");
					game.variations[variationId] = variation;
					if (!(id in this.aliases)) this.aliases[id] = game.id + ',' + variationId;
					if (variation.aliases) {
						for (let i = 0, len = variation.aliases.length; i < len; i++) {
							let alias = Tools.toId(variation.aliases[i]);
							if (!(alias in game.variations) && !(alias in this.modes)) game.variations[alias] = variation;
						}
					}
				}
			}
			if (game.modes) {
				let modes = game.modes.slice();
				game.modes = {};
				for (let i = 0, len = modes.length; i < len; i++) {
					let mode = Tools.toId(modes[i]);
					if (!(mode in this.modes)) throw new Error(mode.name + " mode '" + mode.mode + "' does not exist.");
					game.modes[mode] = mode;
					let id = game.id + this.modes[mode].id;
					if (!(id in this.aliases)) this.aliases[id] = game.id + ',' + mode;
				}
			}
		}
	}

	getFormat(target) {
		if (typeof target === 'object') return target;
		target = target.split(',');
		let format = target.shift();
		let id = Tools.toId(format);
		if (id in this.aliases) {
			id = this.aliases[id];
			if (id.includes(',')) return this.getFormat(id + ',' + target.join(','));
		}
		if (!(id in this.games)) return;
		format = Object.assign({}, this.games[id]);
		let variation, mode;
		for (let i = 0, len = target.length; i < len; i++) {
			let id = Tools.toId(target[i]);
			if (format.variations && id in format.variations) {
				variation = format.variations[id];
			} else if (format.modes && id in format.modes) {
				mode = format.modes[id];
			}
		}
		if (variation) Object.assign(format, variation);
		if (mode) format.modeId = mode;
		return format;
	}

	createGame(target, room) {
		if (room.game) {
			room.say("A game of " + room.game.name + " is already in progress.");
			return false;
		}
		let format = this.getFormat(target);
		if (!format) {
			room.say("The game '" + target + "' was not found.");
			return false;
		}
		room.game = new format.game(room); // eslint-disable-line new-cap
		Object.assign(room.game, format);
		if (format.modeId) this.modes[format.modeId].mode.call(room.game);
		return room.game;
	}
}

let Games = new GamesManager();

Games.Game = Game;
Games.Player = Player;

module.exports = Games;
