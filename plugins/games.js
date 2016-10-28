/**
 * Games
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * This file contains the game system and related commands for Cassius.
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
		this.started = false;
	}

	say(message) {
		this.room.say(message);
	}

	start() {
		if (this.started) return;
		this.started = true;
		if (typeof this.onStart === 'function') this.onStart();
	}

	end(forced) {
		if (this.timeout) clearTimeout(this.timeout);
		if (forced) this.say("The game was forcibly ended.");
		this.room.game = null;
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
		this.addPlayer(user);
		user.say('You have joined the game of ' + this.name + '!');
		if (typeof this.onJoin === 'function') this.onJoin(user);
	}

	leave(user) {
		if (!(user.id in this.players)) return;
		this.removePlayer(user);
		user.say("You have left the game of " + this.name + "!");
		if (typeof this.onLeave === 'function') this.onLeave(user);
	}
}

class Plugin {
	constructor() {
		this.name = 'Games';
		this.games = {};
	}

	onLoad() {
		this.loadGames();
	}

	loadGames() {
		let games;
		try {
			games = fs.readdirSync('./games');
		} catch (e) {}
		if (!games) return;
		for (let i = 0, len = games.length; i < len; i++) {
			let file = games[i];
			if (!file.endsWith('.js')) continue;
			file = require('./../games/' + file);
			if (file.name && file.game) this.games[Tools.toId(file.name)] = file;
		}
	}

	createGame(game, room) {
		if (room.game) return room.say("A game of " + room.game.name + " is already in progress.");
		let id = Tools.toId(game);
		if (!(id in this.games)) return room.say("The game '" + game.trim() + "' was not found.");
		room.game = new this.games[id].game(room); // eslint-disable-line new-cap
		room.say("Hosting a game of " + this.games[id].name + "!" + (this.games[id].description ? " Description: " + this.games[id].description : ""));
	}
}

let Games = new Plugin();

let commands = {
	gamesignups: 'creategame',
	creategame: function (target, room, user) {
		if (!user.hasRank(room, '+')) return;
		Games.createGame(target, room);
	},
	startgame: function (target, room, user) {
		if (!user.hasRank(room, '+') || !room.game) return;
		if (typeof room.game.start === 'function') room.game.start();
	},
	endgame: function (target, room, user) {
		if (!user.hasRank(room, '+') || !room.game) return;
		if (typeof room.game.end === 'function') room.game.end(true);
	},
	guess: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.guess === 'function') room.game.guess(target, user);
	},
	joingame: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.join === 'function') room.game.join(user);
	},
	leavegame: function (target, room, user) {
		if (!room.game) return;
		if (typeof room.game.leave === 'function') room.leave.join(user);
	},
};

Games.Game = Game;
Games.Player = Player;
Games.commands = commands;

module.exports = Games;
