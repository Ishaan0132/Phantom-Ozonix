/**
 * Storage
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * This file handles the storage of room databases
 *
 * @license MIT license
 */

'use strict';

const fs = require('fs');
const BACKUP_INTERVAL = 60 * 60 * 1000;

class StorageManager {
	constructor() {
		this.databases = {};
	}

	importDatabase(roomid) {
		let file = '{}';
		try {
			file = fs.readFileSync('./databases/' + roomid + '.json').toString();
		} catch (e) {}
		this.databases[roomid] = JSON.parse(file);
	}

	exportDatabase(roomid) {
		if (!(roomid in this.databases)) return;
		fs.writeFileSync('./databases/' + roomid + '.json', JSON.stringify(this.databases[roomid]));
	}

	importDatabases() {
		let databases = fs.readdirSync('./databases');
		for (let i = 0, len = databases.length; i < len; i++) {
			let file = databases[i];
			if (!file.endsWith('.json')) continue;
			this.importDatabase(file.substr(0, file.indexOf('.json')));
		}
	}

	exportDatabases() {
		for (let roomid in this.databases) {
			this.exportDatabase(roomid);
		}
	}

	addPoints(points, user, roomid) {
		points = parseInt(points);
		if (isNaN(points)) return;
		if (!(roomid in this.databases)) this.databases[roomid] = {};
		let database = this.databases[roomid];
		if (!('leaderboard' in database)) database.leaderboard = {};
		if (!(user.id in database.leaderboard)) database.leaderboard[user.id] = {points: 0};
		database.leaderboard[user.id].points += points;
		if (database.leaderboard[user.id].name !== user.name) database.leaderboard[user.id].name = user.name;
	}

	removePoints(points, user, roomid) {
		this.addPoints(-points, user, roomid);
	}

	getPoints(user, roomid) {
		if (!(roomid in this.databases)) this.databases[roomid] = {};
		let database = this.databases[roomid];
		if (!('leaderboard' in database)) database.leaderboard = {};
		if (!(user.id in database.leaderboard)) return 0;
		return database.leaderboard[user.id].points;
	}
}

let Storage = new StorageManager();
Storage.backupInterval = setInterval(() => Storage.exportDatabases(), BACKUP_INTERVAL);

module.exports = Storage;
