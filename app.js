/**
 * App
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * This is the main file that starts Cassius.
 *
 * @license MIT license
 */

'use strict';

global.Tools = require('./tools.js');

global.Config = require('./config.js');
if (!Config.username) throw new Error("Please specify a username in config.js");

global.Commands = require('./commands.js');

global.CommandParser = require('./command-parser.js');

global.Rooms = require('./rooms.js');

global.Users = require('./users.js');

global.Client = require('./client.js');

Client.connect();
