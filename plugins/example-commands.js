/**
 * Example commands
 * Phantom Ozonix - https://github.com/Ishaan0132/Phantom-Ozonix
 *
 * Plugins make it easier to have custom commands and
 * modules while rebasing with the main repository.
 *
 * This file shows how to add commands.
 *
 * @license MIT license
 */

'use strict';

/**@type {{[k: string]: Command | string}} */
let commands = {
	about: {
		command(target, room, user) {
		if (!(room instanceof Users.User) && !user.hasRank(room, '+')) return;
		this.say(Config.username + ": https://github.com/FlyingPhantom/Phantom-Ozonix");
		},
	},
};

exports.commands = commands;
