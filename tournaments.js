/**
 * Tournaments
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * This file contains the tournaments manager
 *
 * @license MIT license
 */

'use strict';

const Tournament = require('./room-tournament').Tournament;

class Tournaments {
	constructor() {
		/**@type {{[k: string]: NodeJS.Timer}} */
		this.tournamentTimers = {};
		this.defaultCap = Config.defaultTournamentCap || 64;
		this.maxCap = 128;
	}

	/**
	 * @param {Room} room
	 * @param {Format} format
	 * @param {string} generator
	 * @return {Tournament}
	 */
	createTournament(room, format, generator) {
		return new Tournament(room, format, generator);
	}

	/**
	 * @param {Room} room
	 * @param {number} time
	 * @param {string} [formatid]
	 * @param {number} [cap]
	 */
	setTournamentTimer(room, time, formatid, cap) {
		if (room.id in this.tournamentTimers) clearTimeout(this.tournamentTimers[room.id]);
		if (!cap) cap = this.defaultCap;
		this.tournamentTimers[room.id] = setTimeout(() => {
			room.say("/tour new " + formatid + ", elimination, " + cap);
			delete this.tournamentTimers[room.id];
		}, time);
	}
}

module.exports = new Tournaments();
