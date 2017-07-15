'use strict';

require('./../app.js');

// tsc is run this way to allow the default config.js file to be created
const execSync = require('child_process').execSync;
try {
	execSync('tsc', {stdio: 'inherit'});
} catch (e) {
	console.log(e.stack);
	process.exit(1);
}

const room = Rooms.add('mocha');

/**
 * @param {string} message
 * @param {Function} listener
 */
room.on = function (message, listener) {
	listener();
};
