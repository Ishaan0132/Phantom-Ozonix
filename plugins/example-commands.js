/**
 * Example commands
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * Plugins are ignored by GitHub, which makes it easier to have custom commands
 * and modules while still being up-to-date with changes in the main repository.
 *
 * This file shows how to add commands.
 *
 * @license MIT license
 */

'use strict';

/**@type {{[k: string]: Command | string}} */
let commands = {
	about: function (target, room, user) {
		if (!(room instanceof Users.User) && !user.hasRank(room, '+')) return;
		this.say(Config.username + " code by sirDonovan: https://github.com/sirDonovan/Cassius");
	},
};

exports.commands = commands;
