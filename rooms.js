/**
 * Rooms
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * This file tracks information about the rooms that the bot joins.
 *
 * @license MIT license
 */

'use strict';

class Room {
	constructor(id) {
		this.id = id;
		this.clientId = id === 'lobby' ? '' : id;
		this.users = new Map();
		this.listeners = {};
	}

	onJoin(user, rank) {
		this.users.set(user, rank);
		user.rooms.set(this, rank);
	}

	onLeave(user) {
		this.users.delete(user);
		user.rooms.delete(this);
	}

	onRename(user, newName) {
		let rank = newName.charAt(0);
		newName = Tools.toName(newName);
		let id = Tools.toId(newName);
		let oldName = user.name;
		if (id === user.id) {
			user.name = newName;
		} else {
			delete Users.users[user.id];
			if (Users.users[id]) {
				user = Users.users[id];
				user.name = newName;
			} else {
				user.name = newName;
				user.id = id;
				Users.users[id] = user;
			}
		}
		this.users.set(user, rank);
		user.rooms.set(this, rank);
		if (this.game) this.game.renamePlayer(user, oldName);
	}

	say(message) {
		message = Tools.normalizeMessage(message, this);
		if (!message) return;
		Client.send(this.clientId + '|' + message);
	}

	on(message, listener) {
		message = Tools.normalizeMessage(message, this);
		if (!message) return;
		this.listeners[Tools.toId(message)] = listener;
	}

	parseMessage(messageType, splitMessage) {
		let user, rank;
		switch (messageType) {
		case 'J':
		case 'j':
			user = Users.add(splitMessage[0]);
			if (!user) return;
			this.onJoin(user, splitMessage[0].charAt(0));
			break;
		case 'L':
		case 'l':
			user = Users.add(splitMessage[0]);
			if (!user) return;
			this.onLeave(user);
			break;
		case 'N':
		case 'n':
			user = Users.add(splitMessage[1]);
			if (!user) return;
			this.onRename(user, splitMessage[0]);
			break;
		case 'c': {
			user = Users.get(splitMessage[0]);
			if (!user) return;
			rank = splitMessage[0].charAt(0);
			if (user.rooms.get(this) !== rank) user.rooms.set(this, rank);
			let message = splitMessage.slice(1).join('|');
			if (user.id === Users.self.id) {
				message = Tools.toId(message);
				if (message in this.listeners) this.listeners[message]();
				return;
			}
			CommandParser.parse(message, this, user);
			break;
		}
		case 'c:': {
			user = Users.get(splitMessage[1]);
			if (!user) return;
			rank = splitMessage[1].charAt(0);
			if (user.rooms.get(this) !== rank) user.rooms.set(this, rank);
			let message = splitMessage.slice(2).join('|');
			if (user.id === Users.self.id) {
				message = Tools.toId(message);
				if (message in this.listeners) this.listeners[message]();
				return;
			}
			CommandParser.parse(message, this, user, splitMessage[0] * 1000);
			break;
		}

		}
	}
}

class Rooms {
	constructor() {
		this.rooms = {};
	}

	get(id) {
		if (id && id.users) return id;
		return this.rooms[id];
	}

	add(id) {
		let room = this.get(id);
		if (!room) {
			room = new Room(id);
			this.rooms[id] = room;
		}
		return room;
	}

	destroy(room) {
		room = this.get(room);
		if (!room) return;
		room.users.forEach(function (value, user) {
			user.rooms.delete(room);
		});
		delete this.rooms[room.id];
	}
}

module.exports = new Rooms();
