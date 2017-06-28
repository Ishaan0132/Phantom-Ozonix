'use strict';

require('./../app.js');

// tsc is run this way to allow the default config.js file to be created
const execSync = require('child_process').execSync;
execSync('tsc', {stdio: 'inherit'});

const room = Rooms.add('mocha');

/**
 * @param {string} message
 * @param {Function} listener
 */
room.on = function (message, listener) {
	listener();
};
