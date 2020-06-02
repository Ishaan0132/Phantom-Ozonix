/**
 * Room Tournament
 * Phantom Ozonix - https://github.com/FlyingPhantom/Phantom-Ozonix
 *
 * This file contains the tournament and tournament-player classes
 *
 * @license MIT license
 */

'use strict';

/**@type {{[k: string]: number}} */
const generators = {
	"Single": 1,
	"Double": 2,
	"Triple": 3,
	"Quadruple": 4,
	"Quintuple": 5,
	"Sextuple": 6,
};

class TournamentPlayer {
	/**
	 * @param {User | string} user
	 */
	constructor(user) {
		if (typeof user === 'string') {
			this.name = user;
			this.id = Tools.toId(user);
		} else {
			this.name = user.name;
			this.id = user.id;
		}
		this.losses = 0;
		this.eliminated = false;
	}

	/**
	 * @param {string} message
	 */
	say(message) {
		Users.add(this.name).say(message);
	}
}

exports.TournamentPlayer = TournamentPlayer;

class Tournament {
	/**
	 * @param {Room} room
	 * @param {any} format
	 * @param {string} generator
	 */
	constructor(room, format, generator) {
		this.room = room;
		this.format = format;
		this.name = format.name;
		this.generator = 1;
		let generatorName = generator.split(" ")[0];
		if (generatorName in generators) {
			this.generator = generators[generatorName];
		} else {
			let generatorNumber = parseInt(generator.split("-tuple")[0]);
			if (!isNaN(generatorNumber)) this.generator = generatorNumber;
		}
		this.isRoundRobin = Tools.toId(generator).includes('roundrobin');
		/**@type {{[k: string]: TournamentPlayer}} */
		this.players = {};
		this.playerCount = 0;
		this.totalPlayers = 0;
		this.started = false;
		this.ended = false;
		this.playerCap = Tournaments.defaultCap;
		this.createTime = Date.now();
		this.startTime = 0;
		this.maxRounds = 6;
		/**@type {AnyObject} */
		this.info = {};
		/**@type {AnyObject} */
		this.updates = {};
	}

	start() {
		this.startTime = Date.now();
		this.started = true;
		let maxRounds = 0;
		let rounds = Math.ceil((Math.log(this.playerCount) / Math.log(2)));
		let generator = this.generator;
		while (generator > 0) {
			maxRounds += rounds;
			rounds--;
			generator--;
		}
		this.maxRounds = maxRounds;
		this.totalPlayers = this.playerCount;
	}

	/**
	 * @param {User | string} user
	 * @return {TournamentPlayer}
	 */
	addPlayer(user) {
		let id = Tools.toId(user);
		if (id in this.players) return this.players[id];
		let player = new TournamentPlayer(user);
		this.players[id] = player;
		this.playerCount++;
		return player;
	}

	/**
	 * @param {User | string} user
	 */
	removePlayer(user) {
		let id = Tools.toId(user);
		if (!(id in this.players)) return;
		if (this.started) {
			this.players[id].eliminated = true;
		} else {
			delete this.players[id];
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

	update() {
		Object.assign(this.info, this.updates);
		if (this.updates.bracketData && this.started) this.updateBracket();
		if (this.updates.format) {
			let format = Tools.getFormat(this.updates.format);
			if (format) {
				this.name = format.name;
			} else {
				this.name = this.updates.format;
			}
		}
		this.updates = {};
	}

	updateBracket() {
		let data = this.info.bracketData;
		/**@type {{[k: string]: string}} */
		let players = {};
		/**@type {{[k: string]: number}} */
		let losses = {};
		if (data.type === 'tree') {
			if (data.rootNode) {
				let queue = [data.rootNode];
				while (queue.length > 0) {
					const node = queue[0];
				queue.shift();
				if (!node.children) continue;

					if (node.children[0] && node.children[0].team) {
						let userA = Tools.toId(node.children[0].team);
						if (!players[userA]) players[userA] = node.children[0].team;
						if (node.children[1] && node.children[1].team) {
							let userB = Tools.toId(node.children[1].team);
							if (!players[userB]) players[userB] = node.children[1].team;
							if (node.state === 'finished') {
								if (node.result === 'win') {
									if (!losses[userB]) losses[userB] = 0;
									losses[userB]++;
								} else if (node.result === 'loss') {
									if (!losses[userA]) losses[userA] = 0;
									losses[userA]++;
								}
							}
						}
					}

					node.children.forEach( child => {
					if (child) queue.push(child);
				});
				}
			}
		} else if (data.type === 'table') {
			if (!this.info.bracketData.tableHeaders || !this.info.bracketData.tableHeaders.cols) return;
			for (const name of this.info.bracketData.tableHeaders.cols) {
				const id = Tools.toId(name);
				if (!players[id]) players[id] = name;
			}
		}
		if (!this.playerCount) {
			let len = Object.keys(players).length;
			let maxRounds = 0;
			let rounds = Math.ceil((Math.log(len) / Math.log(2)));
			let generator = this.generator;
			while (generator > 0) {
				maxRounds += rounds;
				rounds--;
				generator--;
			}
			this.maxRounds = maxRounds;
			this.totalPlayers = len;
			this.playerCount = len;
		}

		// clear users who are now guests (currently can't be tracked)
		for (let i in this.players) {
			if (!(i in players)) delete this.players[i];
		}

		for (let i in players) {
			let player = this.addPlayer(players[i]) || this.players[i];
			if (player.eliminated) continue;
			if (losses[i] && losses[i] !== player.losses) {
				player.losses = losses[i];
				if (player.losses >= this.generator) {
					player.eliminated = true;
					continue;
				}
			}
		}
	}

	end() {
		this.ended = true;
		delete this.room.tour;
	}
}

exports.Tournament = Tournament;
