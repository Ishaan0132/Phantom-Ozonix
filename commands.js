/**
 * Commands
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * This file contains the base commands for Cassius.
 *
 * @license MIT license
 */

'use strict';

let commands = {
	// Developer commands
	js: 'eval',
	eval: function (target, room, user) {
		if (!user.isDeveloper()) return;
		try {
			target = eval(target);
			this.say(JSON.stringify(target));
		} catch (e) {
			this.say(e.name + ": " + e.message);
		}
	},

	// General commands
	about: function (target, room, user) {
		if (room !== user && !user.hasRank(room, '+')) return;
		this.say(Config.username + " code by sirDonovan: https://github.com/sirDonovan/Cassius");
	},
};

module.exports = commands;
