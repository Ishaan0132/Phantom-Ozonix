/**
 * Rooms
 * Phantom Ozonix - https://github.com/Ishaan0132/Phantom-Ozonix
 *
 * This file tracks information about the rooms that the bot joins.
 *
 * @license MIT license
 */

'use strict';

class Room {
	/**
	 * @param {string} id
	 */
	constructor(id) {
		this.id = id;
		this.clientId = id === 'lobby' ? '' : id;
		/**@type {Map<User, string>} */
		this.users = new Map();
		/**@type {{[k: string]: Function}} */
		this.listeners = {};
		/**@type {?Game} */
		this.game = null;
		/**@type {?Tournament} */
		this.tour = null;
	}

	/**
	 * @param {User} user
	 * @param {string} rank
	 */
	onJoin(user, rank) {
		this.users.set(user, rank);
		user.rooms.set(this, rank);
	}

	/**
	 * @param {User} user
	 */
	onLeave(user) {
		this.users.delete(user);
		user.rooms.delete(this);
	}

	/**
	 * @param {User} user
	 * @param {string} newName
	 */
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
		if (this.tour) this.tour.renamePlayer(user, oldName);
	}

	/**
	 * @param {string} message
	 * @param {boolean} [skipNormalization]
	 */
	say(message, skipNormalization) {
		if (!skipNormalization) message = Tools.normalizeMessage(message, this);
		if (!message) return;
		Client.send(this.clientId + '|' + message);
	}

	/**
	 * @param {string} message
	 * @param {Function} listener
	 */
	on(message, listener) {
		message = Tools.normalizeMessage(message, this);
		if (!message) return;
		this.listeners[Tools.toId(message)] = listener;
	}
}

exports.Room = Room;

class Rooms {
	constructor() {
		/**@type {{[k: string]: Room}} */
		this.rooms = {};

		this.Room = Room;
		this.globalRoom = this.add('global');
	}

	/**
	 * @param {Room | string} id
	 * @return {Room}
	 */
	get(id) {
		if (id instanceof Room) return id;
		return this.rooms[id];
	}

	/**
	 * @param {string} id
	 * @return {Room}
	 */
	add(id) {
		let room = this.get(id);
		if (!room) {
			room = new Room(id);
			this.rooms[id] = room;
		}
		return room;
	}

	/**
	 * @param {Room | string} id
	 */
	destroy(id) {
		let room = this.get(id);
		if (!room) return;
		if (room.game) room.game.forceEnd();
		if (room.tour) room.tour.end();
		room.users.forEach(function (value, user) {
			user.rooms.delete(room);
		});
		delete this.rooms[room.id];
	}

	destroyRooms() {
		for (let i in this.rooms) {
			this.destroy(i);
		}
	}
}

exports.Rooms = new Rooms();
