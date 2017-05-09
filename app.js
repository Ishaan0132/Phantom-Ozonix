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
	let fileName = plugins[i];
	if (!fileName.endsWith('.js') || fileName === 'example-commands.js' || fileName === 'example-module.js') continue;
	let file = require('./plugins/' + fileName);
	if (file.name) {
		global[file.name] = file;
		if (typeof global[file.name].onLoad === 'function') global[file.name].onLoad();
	}
	if (file.commands) Object.assign(Commands, file.commands);
}

if (require.main === module) {
	Client.connect();
}
