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

class PluginManager {
	constructor() {
		this.name = "Example";
		this.data = {};
	}

	onLoad() {
		this.loadData();
	}

	loadData() {
		// initialization that requires the plugin to be in the global namespace
	}

}

let Plugin = new PluginManager();

let commands = {
	about: function (target, room, user) {
		if (room !== user && !user.hasRank(room, '+')) return;
		this.say(Config.username + " code by sirDonovan: https://github.com/sirDonovan/Cassius");
	},
};
Plugin.commands = commands;

module.exports = Plugin;
