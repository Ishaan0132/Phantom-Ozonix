/**
 * Users
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * This file tracks information about users.
 *
 * @license MIT license
 */

'use strict';

const Game = require('./games').Game; // eslint-disable-line no-unused-vars
const Room = require('./rooms').Room; // eslint-disable-line no-unused-vars

const PRUNE_INTERVAL = 60 * 60 * 1000;

class User {
	/**
	 * @param {string} name
	 * @param {string} id
	 */
	constructor(name, id) {
		this.name = Tools.toName(name);
		this.id = id;
		/**@type {Map<Room, string>} */
		this.rooms = new Map();
		/**@type {Map<Room, {messages: Array<{time: number, message: string}>, points: number, lastAction: number}>} */
		this.roomData = new Map();
		/**@type {?Game} */
		this.game = null;
	}

	/**
	 * @param {Room | string} room
	 * @param {string} targetRank
	 * @return {boolean}
	 */
	hasRank(room, targetRank) {
		if (!Config.groups) return false;
		let rank;
		if (typeof room === 'string') {
			rank = room;
		} else {
			rank = this.rooms.get(room);
		}
		if (!rank) return false;
		return Config.groups[rank] >= Config.groups[targetRank];
	}

	/**
	 * @return {boolean}
	 */
	isDeveloper() {
		return Config.developers && Config.developers.indexOf(this.id) !== -1;
	}

	/**
	 * @param {string} message
	 */
	say(message) {
		message = Tools.normalizeMessage(message);
		if (!message) return;
		Client.send('|/pm ' + this.id + ', ' + message);
	}
}

exports.User = User;

class Users {
	constructor() {
		this.users = {};
		this.self = this.add(Config.username);
		this.pruneUsersInterval = setInterval(() => this.pruneUsers(), PRUNE_INTERVAL);

		this.User = User;
	}

	/**
	 * @param {User | string} name
	 * @return {User}
	 */
	get(name) {
		if (name instanceof User) return name;
		return this.users[Tools.toId(name)];
	}

	/**
	 * @param {string} name
	 * @return {User}
	 */
	add(name) {
		let id = Tools.toId(name);
		let user = this.get(id);
		if (!user) {
			user = new User(name, id);
			this.users[id] = user;
		}
		return user;
	}

	pruneUsers() {
		let users = Object.keys(this.users);
		users.splice(users.indexOf(this.self.id), 1);
		for (let i = 0, len = users.length; i < len; i++) {
			let user = this.users[users[i]];
			if (!user.rooms.size) {
				delete this.users[user.id];
			}
		}
	}
}

exports.Users = new Users();
