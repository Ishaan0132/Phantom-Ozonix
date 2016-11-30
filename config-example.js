/**
 * Config (example)
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * Copy this file to 'config.js' before starting Cassius.
 *
 * @license MIT license
 */

'use strict';

// The username and password that Cassius will use to login
exports.username = 'Example Username';
// leave this blank if the username is unregistered
exports.password = '';

// The server address to which Cassius will connect
exports.server = '';

// Rooms that Cassius will attempt to join after logging in
// example: exports.rooms = ['room1', 'room2', 'room3'];
exports.rooms = [];

// Rooms where scripted games are enabled
exports.games = [];

// The character that determines which messages are read as commands
exports.commandCharacter = '.';

// Symbols and rankings for the server's user groups
exports.groups = {
	'‽': 0,
	'!': 0,
	' ': 0,
	'+': 1,
	'%': 2,
	'@': 3,
	'*': 3,
	'#': 4,
	'&': 5,
	'~': 6,
};

// Userids of those who have debug access to Cassius
// example: exports.developers = ['devuser1', 'devuser2', 'devuser3'];
exports.developers = [];
