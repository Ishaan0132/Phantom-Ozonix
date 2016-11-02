'use strict';

const assert = require('assert');
require('./../app.js');

const room = Rooms.add('mocha');
const users = [];
for (let i = 0; i < 4; i++) {
	let user = Users.add("User " + i);
	room.onJoin(user, ' ');
	users.push(user);
}

describe('Games', function () {
	for (let i in Games.games) {
		let game = Games.games[i];
		describe(game.name, function () {
			beforeEach(function () {
				Games.createGame(game.name, room);
			});
			afterEach(function () {
				if (room.game) room.game.forceEnd();
			});
			it('should properly create a game', function () {
				assert(room.game instanceof game.game);
			});
			it('should properly run through a round', function () {
				room.game.signups();
				if (!room.game.freeJoin) {
					let len = users.length;
					for (let i = 0; i < len; i++) {
						CommandParser.parse(Config.commandCharacter + 'joingame', room, users[i]);
					}
					assert.strictEqual(room.game.playerCount, len);
					room.game.start();
				}
				assert(room.game.started);
				room.game.nextRound();
			});
			it('should support ending at any time', function () {
				room.game.signups();
				room.game.end();

				Games.createGame(game.id, room);
				if (!room.game.freeJoin) {
					room.game.signups();
					for (let i = 0, len = users.length; i < len; i++) {
						CommandParser.parse(Config.commandCharacter + 'joingame', room, users[i]);
					}
					room.game.start();
					room.game.end();
					Games.createGame(game.id, room);
				}

				room.game.signups();
				if (!room.game.freeJoin) {
					for (let i = 0, len = users.length; i < len; i++) {
						CommandParser.parse(Config.commandCharacter + 'joingame', room, users[i]);
					}
					room.game.start();
				}
				room.game.nextRound();
				room.game.end();
			});
		});
	}
});
