/**
 * Message Parser
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * This file parses messages sent by the server.
 *
 * @license MIT license
 */

'use strict';

const Room = require('./rooms').Room; // eslint-disable-line no-unused-vars
const User = require('./users').User; // eslint-disable-line no-unused-vars

class Context {
	/**
	 * @param {string} target
	 * @param {Room | User} room
	 * @param {User} user
	 * @param {string} command
	 * @param {number} [time]
	 */
	constructor(target, room, user, command, time) {
		this.target = target ? target.trim() : '';
		this.room = room;
		this.user = user;
		this.command = command;
		this.time = time || Date.now();
	}

	/**
	 * @param {string} text
	 */
	say(text) {
		this.room.say(text);
	}

	/**
	 * @param {string} [command]
	 * @param {string} [target]
	 */
	run(command, target) {
		if (command) {
			command = Tools.toId(command);
			if (!Commands[command]) return;
			if (typeof Commands[command] === 'string') {
				// @ts-ignore Typescript bug - issue #10530
				command = Commands[command];
			}
			target = target.trim();
		} else {
			command = this.command;
			target = this.target;
		}

		if (typeof Commands[command] !== 'function') return;

		try {
			// @ts-ignore Typescript bug - issue #10530
			Commands[command].call(this, target, this.room, this.user, this.command, this.time);
		} catch (e) {
			let stack = e.stack;
			stack += 'Additional information:\n';
			stack += 'Command = ' + command + '\n';
			stack += 'Target = ' + target + '\n';
			stack += 'Time = ' + new Date(this.time).toLocaleString() + '\n';
			stack += 'User = ' + this.user.name + '\n';
			stack += 'Room = ' + (this.room instanceof Users.User ? 'in PM' : this.room.id);
			console.log(stack);
		}
	}
}

exports.Context = Context;

class MessageParser {
	constructor() {
		this.globalContext = new Context('', Rooms.globalRoom, Users.self, '');
	}

	/**
	 * @param {string} message
	 * @param {Room} room
	 */
	parse(message, room) {
		let splitMessage = message.split('|').slice(1);
		let messageType = splitMessage[0];
		splitMessage.shift();
		if (typeof Config.parseMessage === 'function') {
			if (Config.parseMessage(room, messageType, splitMessage) === false) return;
		}
		switch (messageType) {
		case 'challstr':
			Client.challengeKeyId = splitMessage[0];
			Client.challenge = splitMessage[1];
			Client.login();
			break;
		case 'updateuser':
			if (splitMessage[0] !== Config.username) return;
			if (splitMessage[1] !== '1') {
				console.log('Failed to log in');
				process.exit();
			}

			console.log('Successfully logged in');
			if (Config.rooms) {
				if (!(Config.rooms instanceof Array)) throw new Error("Config.rooms must be an array");
				for (let i = 0, len = Config.rooms.length; i < len; i++) {
					Client.send('|/join ' + Config.rooms[i]);
				}
			}
			break;
		case 'init':
			room.onJoin(Users.self, ' ');
			console.log('Joined room: ' + room.id);
			break;
		case 'noinit':
			console.log('Could not join room: ' + room.id);
			Rooms.destroy(room);
			break;
		case 'deinit':
			Rooms.destroy(room);
			break;
		case 'users': {
			if (splitMessage[0] === '0') return;
			let users = splitMessage[0].split(",");
			for (let i = 1, len = users.length; i < len; i++) {
				let user = Users.add(users[i].substr(1));
				let rank = users[i].charAt(0);
				room.users.set(user, rank);
				user.rooms.set(room, rank);
			}
			break;
		}
		case 'J':
		case 'j': {
			let user = Users.add(splitMessage[0]);
			if (!user) return;
			room.onJoin(user, splitMessage[0].charAt(0));
			break;
		}
		case 'L':
		case 'l': {
			let user = Users.add(splitMessage[0]);
			if (!user) return;
			room.onLeave(user);
			break;
		}
		case 'N':
		case 'n': {
			let user = Users.add(splitMessage[1]);
			if (!user) return;
			room.onRename(user, splitMessage[0]);
			break;
		}
		case 'c': {
			let user = Users.get(splitMessage[0]);
			if (!user) return;
			let rank = splitMessage[0].charAt(0);
			if (user.rooms.get(room) !== rank) user.rooms.set(room, rank);
			let message = splitMessage.slice(1).join('|');
			if (user.id === Users.self.id) {
				message = Tools.toId(message);
				if (message in room.listeners) room.listeners[message]();
				return;
			}
			this.parseCommand(message, room, user);
			break;
		}
		case 'c:': {
			let user = Users.get(splitMessage[1]);
			if (!user) return;
			let rank = splitMessage[1].charAt(0);
			if (user.rooms.get(room) !== rank) user.rooms.set(room, rank);
			let message = splitMessage.slice(2).join('|');
			if (user.id === Users.self.id) {
				message = Tools.toId(message);
				if (message in room.listeners) room.listeners[message]();
				return;
			}
			this.parseCommand(message, room, user, parseInt(splitMessage[0]) * 1000);
			break;
		}
		case 'pm': {
			let user = Users.add(splitMessage[0]);
			if (!user) return;
			if (user.id === Users.self.id) return;
			this.parseCommand(splitMessage.slice(2).join('|'), user, user);
			break;
		}
		}
	}

	/**
	 * @param {string} message
	 * @param {Room | User} room
	 * @param {User} user
	 * @param {number} [time]
	 */
	parseCommand(message, room, user, time) {
		message = message.trim();
		if (message.charAt(0) !== Config.commandCharacter) return;

		message = message.substr(1);
		let spaceIndex = message.indexOf(' ');
		let target = '';
		let command = '';
		if (spaceIndex !== -1) {
			command = message.substr(0, spaceIndex);
			target = message.substr(spaceIndex + 1);
		} else {
			command = message;
		}
		command = Tools.toId(command);
		if (!Commands[command]) return;
		if (typeof Commands[command] === 'string') {
			// @ts-ignore Typescript bug - issue #10530
			command = Commands[command];
		}
		if (typeof Commands[command] !== 'function') return;

		new Context(target, room, user, command, time).run();
	}
}

exports.MessageParser = new MessageParser();
