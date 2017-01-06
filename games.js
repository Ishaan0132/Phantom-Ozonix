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

	addBits(bits, user) {
		Storage.addPoints(bits, user, this.room.id);
	}

	removeBits(bits, user) {
		Storage.removePoints(bits, user, this.room.id);
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
		this.aliases = {};
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
			if (game.aliases) {
				for (let i = 0, len = game.aliases.length; i < len; i++) {
					let alias = Tools.toId(game.aliases[i]);
					if (!(alias in this.aliases) && !(alias in this.games)) this.aliases[alias] = game.id;
				}
			}
			this.games[game.id] = game;
		}
	}

	createGame(game, room) {
		if (room.game) {
			room.say("A game of " + room.game.name + " is already in progress.");
			return false;
		}
		let id = Tools.toId(game);
		if (id in this.aliases) id = this.aliases[id];
		if (!(id in this.games)) {
			room.say("The game '" + game.trim() + "' was not found.");
			return false;
		}
		room.game = new this.games[id].game(room); // eslint-disable-line new-cap
		return room.game;
	}
}

let Games = new GamesManager();

Games.Game = Game;
Games.Player = Player;

module.exports = Games;
