'use strict';

require('./../app.js');

const room = Rooms.add('mocha');

/**
 * @param {string} message
 * @param {Function} listener
 */
room.on = function (message, listener) {
	listener();
};
