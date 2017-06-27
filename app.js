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

global.Rooms = require('./rooms.js').Rooms;

global.Users = require('./users.js').Users;

global.CommandParser = require('./command-parser.js').CommandParser;

global.Client = require('./client.js');

global.Games = require('./games.js').Games;
Games.loadGames();

global.Storage = require('./storage.js');
Storage.importDatabases();

let plugins = fs.readdirSync('./plugins');
for (let i = 0, len = plugins.length; i < len; i++) {
	let fileName = plugins[i];
	if (!fileName.endsWith('.js') || fileName === 'example-commands.js' || fileName === 'example-module.js') continue;
	let file = require('./plugins/' + fileName);
	if (file.name) {
		// @ts-ignore
		global[file.name] = file;
		if (typeof file.onLoad === 'function') file.onLoad();
	}
	if (file.commands) Object.assign(Commands, file.commands);
}

if (require.main === module) {
	Client.connect();
}
