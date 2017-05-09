/**
 * Example module
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * Plugins are ignored by GitHub, which makes it easier to have custom commands
 * and modules while still being up-to-date with changes in the main repository.
 *
 * This file shows how to add a module.
 *
 * @license MIT license
 */

'use strict';

class Plugin {
	constructor() {
		this.name = "Example";
		this.data = {};
		this.commands = {
			about: function (target, room, user) {
				if (room !== user && !user.hasRank(room, '+')) return;
				this.say("test");
			},
		};
	}

	onLoad() {
		this.loadData();
	}

	loadData() {
		// initialization that requires the plugin to be in the global namespace
	}

}

module.exports = new Plugin();
