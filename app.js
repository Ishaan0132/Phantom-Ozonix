/**
 * App
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * This is the main file that starts Cassius.
 *
 * @license MIT license
 */

'use strict';

const fs = require('fs');

global.Tools = require('./tools.js');

try {
	fs.accessSync('./config.js');
} catch (e) {
	if (e.code !== 'ENOENT') throw e;
	console.log("Creating a default config.js file");
	fs.writeFileSync('./config.js', fs.readFileSync('./config-example.js'));
}

global.Config = require('./config.js');
if (!Config.username) throw new Error("Please specify a username in config.js");

global.Commands = require('./commands.js');

global.CommandParser = require('./command-parser.js');

global.Rooms = require('./rooms.js');

global.Users = require('./users.js');

global.Client = require('./client.js');

global.Games = require('./games.js');
Games.loadGames();

global.Storage = require('./storage.js');
Storage.importDatabases();

let plugins = fs.readdirSync('./plugins');
for (let i = 0, len = plugins.length; i < len; i++) {
	let file = plugins[i];
	if (!file.endsWith('.js') || file === 'example-commands.js' || file === 'example-module.js') continue;
	file = require('./plugins/' + file);
	if (file.name) {
		global[file.name] = file;
		if (typeof global[file.name].onLoad === 'function') global[file.name].onLoad();
	}
	if (file.commands) Object.assign(Commands, file.commands);
}

if (require.main === module) {
	Client.connect();
}
