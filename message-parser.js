/**
 * Message Parser
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * This file parses messages sent by the server.
 *
 * @license MIT license
 */

'use strict';

const capsRegex = new RegExp('[A-Z]', 'g');
const stretchRegex = new RegExp('(.+)\\1+', 'g');

const FLOOD_MINIMUM_MESSAGES = 5;
const FLOOD_MAXIMUM_TIME = 5 * 1000;
const STRETCHING_MINIMUM = 20;
const CAPS_MINIMUM = 30;
const PUNISHMENT_COOLDOWN = 5 * 1000;

class Context {
	/**
	 * @param {string} target
	 * @param {Room | User} room
	 * @param {User} user
	 * @param {string} command
	 * @param {string} originalCommand
	 * @param {number} [time]
	 */
	constructor(target, room, user, command, originalCommand, time) {
		this.target = target ? target.trim() : '';
		this.room = room;
		this.user = user;
		this.command = command;
		this.originalCommand = originalCommand;
		this.time = time || Date.now();
	}

	/**
	 * @param {string} text
	 */
	say(text) {
		this.room.say(text);
	}

	/**
	 * @param {string} message;
	 */
	sayHtml(message) {
		if (this.room instanceof Users.User) return this.pmHtml(this.room, message);
		this.room.say("/addhtmlbox " + message, true);
	}

	/**
	 * @param {User | string} user
	 * @param {string} message;
	 */
	pm(user, message) {
		if (typeof user === 'string') user = Users.add(user);
		user.say(message);
	}

	/**
	 * @param {User | string} user
	 * @param {string} message;
	 */
	pmHtml(user, message) {
		let room = this.room;
		if (room instanceof Users.User) {
			let botRoom;
			Users.self.rooms.forEach((rank, room) => {
				if (rank === '*') botRoom = room;
			});
			if (!botRoom) return this.pm(user, message);
			room = botRoom;
		}
		room.say("/pminfobox " + Tools.toId(user) + ", " + message, true);
	}

	/**
	 * @param {string} [newCommand]
	 * @param {string} [newTarget]
	 * @returns {boolean}
	 */
	run(newCommand, newTarget) {
		let command = this.command;
		let target = this.target;
		let originalCommand = this.originalCommand;
		if (newCommand) {
			newCommand = Tools.toId(newCommand);
			if (!Commands[newCommand]) return false;
			originalCommand = newCommand;
			if (typeof Commands[newCommand] === 'string') {
				// @ts-ignore Typescript bug - issue #10530
				newCommand = Commands[newCommand];
			}
			command = newCommand;
			if (newTarget) {
				target = newTarget.trim();
			} else {
				target = '';
			}
		}

		if (typeof Commands[command] !== 'function') return false;

		try {
			// @ts-ignore Typescript bug - issue #10530
			Commands[command].call(this, target, this.room, this.user, originalCommand, this.time);
		} catch (e) {
			let stack = e.stack;
			stack += 'Additional information:\n';
			stack += 'Command = ' + command + '\n';
			stack += 'Target = ' + target + '\n';
			stack += 'Time = ' + new Date(this.time).toLocaleString() + '\n';
			stack += 'User = ' + this.user.name + '\n';
			stack += 'Room = ' + (this.room instanceof Users.User ? 'in PM' : this.room.id);
			console.log(stack);
			return false;
		}
		return true;
	}
}

exports.Context = Context;

class MessageParser {
	constructor() {
		this.formatsList = [];
		this.formatsData = {};
		this.globalContext = new Context('', Rooms.globalRoom, Users.self, '', '');
	}

	/**
	 * @param {string} message
	 * @param {Room} room
	 */
	parse(message, room) {
		let splitMessage = message.split('|').slice(1);
		let messageType = splitMessage[0];
		splitMessage.shift();
		if (typeof Config.parseMessage === 'function') Config.parseMessage(room, messageType, splitMessage);
		if (Plugins) {
			for (let i = 0, len = Plugins.length; i < len; i++) {
				if (typeof Plugins[i].parseMessage === 'function') Plugins[i].parseMessage(room, messageType, splitMessage);
			}
		}
		switch (messageType) {
		case 'challstr':
			Client.challengeKeyId = splitMessage[0];
			Client.challenge = splitMessage[1];
			Client.login();
			break;
		case 'updateuser':
			if (splitMessage[0] !== Config.username) return;

			if (Client.connectTimeout) clearTimeout(Client.connectTimeout);
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
			if (Config.avatar) Client.send('|/avatar ' + Config.avatar);
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
		case 'formats': {
			this.formatsList = splitMessage.slice();
			this.parseFormats();
			break;
		}
		case 'tournament': {
			if (!Config.tournaments || !Config.tournaments.includes(room.id)) return;
			switch (splitMessage[0]) {
			case 'create': {
				let format = Tools.getFormat(splitMessage[1]);
				if (!format) throw new Error("Unknown format used in tournament (" + splitMessage[1] + ")");
				room.tour = Tournaments.createTournament(room, format, splitMessage[2]);
				if (splitMessage[3]) room.tour.playerCap = parseInt(splitMessage[3]);
				break;
			}
			case 'update': {
				let data = JSON.parse(splitMessage.slice(1).join("|"));
				if (!data || !(data instanceof Object)) return;
				if (!room.tour) {
					let format = Tools.getFormat(data.teambuilderFormat) || Tools.getFormat(data.format);
					if (!format) throw new Error("Unknown format used in tournament (" + (data.teambuilderFormat || data.format) + ")");
					room.tour = Tournaments.createTournament(room, format, data.generator);
					room.tour.started = true;
				}
				Object.assign(room.tour.updates, data);
				break;
			}
			case 'updateEnd':
				if (room.tour) room.tour.update();
				break;
			case 'end': {
				let data = JSON.parse(splitMessage.slice(1).join("|"));
				if (!data || !(data instanceof Object)) return;
				if (!room.tour) {
					let format = Tools.getFormat(data.teambuilderFormat) || Tools.getFormat(data.format);
					if (!format) throw new Error("Unknown format used in tournament (" + (data.teambuilderFormat || data.format) + ")");
					room.tour = Tournaments.createTournament(room, format, data.generator);
					room.tour.started = true;
				}
				Object.assign(room.tour.updates, data);
				room.tour.update();
				room.tour.end();
				break;
			}
			case 'forceend':
				if (room.tour) room.tour.end();
				break;
			case 'join':
				if (room.tour) room.tour.addPlayer(splitMessage[1]);
				break;
			case 'leave':
				if (room.tour) room.tour.removePlayer(splitMessage[1]);
				break;
			case 'disqualify':
				if (room.tour) room.tour.removePlayer(splitMessage[1]);
				break;
			case 'start':
				if (room.tour) room.tour.start();
				break;
			case 'battlestart':
				if (room.tour && !room.tour.isRoundRobin && room.tour.generator === 1 && room.tour.getRemainingPlayerCount() === 2) {
					room.say("/wall Final battle of " + room.tour.format.name + " tournament: <<" + splitMessage[3].trim() + ">>");
				}
				break;
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
			let time = Date.now();
			this.parseCommand(message, room, user, time);
			if (!user.hasRank(room, '+')) this.moderate(message, room, user, time);
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
			let time = parseInt(splitMessage[0]) * 1000;
			this.parseCommand(message, room, user, time);
			if (!user.hasRank(room, '+')) this.moderate(message, room, user, time);
			break;
		}
		case 'pm': {
			let user = Users.add(splitMessage[0]);
			if (!user) return;
			if (user.id === Users.self.id) return;
			this.parseCommand(splitMessage.slice(2).join('|'), user, user);
			break;
		}
		case 'raw': {
			let message = splitMessage.join('|');
			if (message.includes('<div class="broadcast-red">') && message.includes('The server is restarting soon.')) {
				Client.lockdown = true;
			} else if (message.includes('<div class="broadcast-green">') && message.includes('The server restart was canceled.')) {
				Client.lockdown = false;
			}
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
		let originalCommand = command;
		if (typeof Commands[command] === 'string') {
			// @ts-ignore Typescript bug - issue #10530
			command = Commands[command];
		}
		if (typeof Commands[command] !== 'function') return;

		return new Context(target, room, user, command, originalCommand, time).run();
	}

	parseFormats() {
		if (!this.formatsList.length) return;
		this.formatsData = {};
		let isSection = false;
		let section = '';
		for (let i = 0, len = this.formatsList.length; i < len; i++) {
			if (isSection) {
				section = this.formatsList[i];
				isSection = false;
			} else if (this.formatsList[i] === ',LL') {
				continue;
			} else if (this.formatsList[i] === '' || (this.formatsList[i].charAt(0) === ',' && !isNaN(parseInt(this.formatsList[i].substr(1))))) {
				isSection = true;
			} else {
				let name = this.formatsList[i];
				let searchShow = true;
				let challengeShow = true;
				let tournamentShow = true;
				let lastCommaIndex = name.lastIndexOf(',');
				let code = lastCommaIndex >= 0 ? parseInt(name.substr(lastCommaIndex + 1), 16) : NaN;
				if (!isNaN(code)) {
					name = name.substr(0, lastCommaIndex);
					if (!(code & 2)) searchShow = false;
					if (!(code & 4)) challengeShow = false;
					if (!(code & 8)) tournamentShow = false;
				} else {
					// Backwards compatibility: late 0.9.0 -> 0.10.0
					if (name.substr(name.length - 2) === ',#') { // preset teams
						name = name.substr(0, name.length - 2);
					}
					if (name.substr(name.length - 2) === ',,') { // search-only
						challengeShow = false;
						name = name.substr(0, name.length - 2);
					} else if (name.substr(name.length - 1) === ',') { // challenge-only
						searchShow = false;
						name = name.substr(0, name.length - 1);
					}
				}
				let id = Tools.toId(name);
				if (!id) continue;
				this.formatsData[id] = {
					name: name,
					id: id,
					section: section,
					searchShow: searchShow,
					challengeShow: challengeShow,
					tournamentShow: tournamentShow,
					playable: tournamentShow || ((searchShow || challengeShow) && tournamentShow !== false),
				};
			}
		}

		Tools.FormatCache.clear();
	}

	/**
	 * @param {string} message
	 * @param {Room} room
	 * @param {User} user
	 * @param {number} time
	 */
	moderate(message, room, user, time) {
		if (!Users.self.hasRank(room, '%')) return;
		if (typeof Config.allowModeration === 'object') {
			if (!Config.allowModeration[room.id]) return;
		} else {
			if (!Config.allowModeration) return;
		}
		if (!Config.punishmentPoints || !Config.punishmentActions) return;

		message = Tools.trim(message);

		let data = user.roomData.get(room);
		if (!data) {
			data = {messages: [], points: 0, lastAction: 0};
			user.roomData.set(room, data);
		}

		data.messages.unshift({message: message, time: time});

		// avoid escalating punishments for the same message(s) due to lag or the message queue
		if (data.lastAction && time - data.lastAction < PUNISHMENT_COOLDOWN) return;

		/**@type {Array<{action: string, rule: string, reason: string}>} */
		let punishments = [];

		if (typeof Config.moderate === 'function') {
			let result = Config.moderate(message, room, user, time);
			if (result instanceof Array) punishments = punishments.concat(result);
		}

		// flooding
		if (data.messages.length >= FLOOD_MINIMUM_MESSAGES) {
			let testTime = time - data.messages[FLOOD_MINIMUM_MESSAGES - 1].time;
			// account for the server's time changing
			if (testTime >= 0 && testTime <= FLOOD_MAXIMUM_TIME) {
				punishments.push({action: 'mute', rule: 'flooding', reason: 'please do not flood the chat'});
			}
		}

		// stretching
		let stretching = message.match(stretchRegex);
		if (stretching) {
			stretching.sort((a, b) => b.length - a.length);
			if (stretching[0].length >= STRETCHING_MINIMUM) {
				punishments.push({action: 'verbalwarn', rule: 'stretching', reason: 'please do not stretch'});
			}
		}

		// caps
		let caps = message.match(capsRegex);
		if (caps && caps.length >= CAPS_MINIMUM) {
			punishments.push({action: 'verbalwarn', rule: 'caps', reason: 'please do not abuse caps'});
		}

		if (!punishments.length) return;

		punishments.sort((a, b) => Config.punishmentPoints[b.action] - Config.punishmentPoints[a.action]);
		let punishment = punishments[0];
		let points = Config.punishmentPoints[punishment.action];
		let reason = punishment.reason;
		if (Config.punishmentReasons && Config.punishmentReasons[punishment.rule]) reason = Config.punishmentReasons[punishment.rule];
		let action = punishment.action;
		if (data.points >= points) {
			data.points++;
			points = data.points;
			if (Config.punishmentActions['' + points]) action = Config.punishmentActions['' + points];
		} else {
			data.points = points;
		}
		if (action === 'verbalwarn') return room.say(user.name + ", " + reason);
		if (action === 'roomban' && !Users.self.hasRank(room, '@')) action = 'hourmute';
		room.say("/" + action + " " + user.name + ", " + reason);
		data.lastAction = time;
	}
}

exports.MessageParser = new MessageParser();
