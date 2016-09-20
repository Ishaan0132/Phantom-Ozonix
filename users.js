/**
 * Users
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * This file tracks information about users.
 *
 * @license MIT license
 */

'use strict';

const PRUNE_INTERVAL = 60 * 60 * 1000;

class User {
	constructor(name, id) {
		this.name = Tools.toName(name);
		this.id = id;
		this.rooms = new Map();
	}

	hasRank(room, targetRank) {
		if (!Config.groups) return false;
		let rank = this.rooms.get(room) || room;
		return Config.groups[rank] >= Config.groups[targetRank];
	}

	isDeveloper() {
		return Config.developers && Config.developers.indexOf(this.id) !== -1;
	}

	say(message) {
		message = Tools.normalizeMessage(message);
		if (!message) return;
		Client.send('|/pm ' + this.id + ', ' + message);
	}
}

class Users {
	constructor() {
		this.users = {};
		this.self = this.add(Config.username);
		this.pruneUsersInterval = setInterval(() => this.pruneUsers(), PRUNE_INTERVAL);
	}

	get(name) {
		if (name && name.rooms) return name;
		return this.users[Tools.toId(name)];
	}

	add(name) {
		let id = Tools.toId(name);
		if (!id) return;
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

module.exports = new Users();
