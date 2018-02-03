/**
 * YouTube
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * Fetches YouTube video information and handles
 * adding videos to the database
 *
 * @license MIT license
 */

'use strict';

const https = require('https');
const youtubeRegex = /https:\/\/(youtu\.be\/|(www\.)?youtube\.com\/watch\?v=)[A-Za-z0-9\-_]{11}/g;
const linkCooldowns = {};

/**
 * @param {Room} room
 * @param {string} messageType
 * @param {Array<string>} splitMessage
 */
function parseMessage(room, messageType, splitMessage) {
	switch (messageType) {
	case 'c': {
		let message = splitMessage.slice(1).join('|');
		let link = message.match(youtubeRegex);
		if (link) {
			for (let i = 0, len = link.length; i < len; i++) {
				parseYouTubeLink(room, link[i]);
			}
		}
		break;
	}
	case 'c:': {
		let message = splitMessage.slice(2).join('|');
		let link = message.match(youtubeRegex);
		if (link) {
			for (let i = 0, len = link.length; i < len; i++) {
				parseYouTubeLink(room, link[i]);
			}
		}
		break;
	}
	}
}

exports.parseMessage = parseMessage;

/**
 * @param {Room} room
 * @param {string} link
 */
function parseYouTubeLink(room, link) {
	if (Client.requestQueueTimeout) {
		Client.requestQueue.push(() => parseYouTubeLink(room, link));
		return;
	}
	let now = Date.now();
	if (link in linkCooldowns && now - linkCooldowns[link] < (2 * 60 * 1000)) return;
	linkCooldowns[link] = now;

	let requestOptions = {
		host: 'www.youtube.com',
		port: 443,
		path: '/oembed?url=' + encodeURIComponent(link) + '&format=json',
	};
	https.get(requestOptions, response => {
		response.setEncoding('utf8');
		let data = '';
		response.on('data', /**@param {string} chunk*/ chunk => {
			data += chunk;
		});
		response.on('end', () => {
			if (data) {
				try {
					let parsed = JSON.parse(data);
					if (parsed.title) {
						let title = Tools.trim(parsed.title);
						if (title.charAt(0) === '/' || title.charAt(0) === '!') return room.say("Unable to fetch title.");
						let titleLower = title.toLowerCase();
						for (let i = 0, len = Config.bannedWords.length; i < len; i++) {
							if (titleLower.includes(Config.bannedWords[i])) return room.say("Unable to fetch title.");
						}
						room.say(title + " - by " + parsed['author_name']);
					}
				} catch (e) {}
			}
		});
	}).on('error', /**@param {Error} error*/ error => {
		console.log('HTTPS error: ' + error.stack);
	});

	Client.prepareNextRequest();
}

/**@type {{[k: string]: Command | string}} */
let commands = {
	addvideo: function (target, room, user) {
		if (room instanceof Users.User || !user.hasRank(room, '%')) return;
		if (room.id !== 'youtube') return;
		let database = Storage.databases[room.id];
		if (!database) return;
		if (!target.includes("youtube.com/watch?v=")) return this.say("You can only add YouTube video links.");
		let link = target.substr(target.indexOf("youtube.com/watch?v=")).trim();
		if (!database.youtubeLinks) database.youtubeLinks = [];
		if (database.youtubeLinks.includes(link)) return this.say("That video is already in the database.");
		database.youtubeLinks.push(link);
		this.say("That video has been added to the database.");
	},
	removevideo: 'deletevideo',
	deletevideo: function (target, room, user) {
		if (room instanceof Users.User || !user.hasRank(room, '%')) return;
		if (room.id !== 'youtube') return;
		let database = Storage.databases[room.id];
		if (!database) return;
		if (!target.includes("youtube.com/watch?v=")) return this.say("You can only add YouTube video links.");
		let link = target.substr(target.indexOf("youtube.com/watch?v=")).trim();
		if (!database.youtubeLinks) database.youtubeLinks = [];
		if (!database.youtubeLinks.includes(link)) return this.say("That video is not in the database.");
		database.youtubeLinks.splice(database.youtubeLinks.indexOf(link), 1);
		this.say("That video has been removed from the database.");
	},
	getvideo: function (target, room, user) {
		if (room instanceof Users.User || !user.hasRank(room, '+')) return;
		if (room.id !== 'youtube') return;
		let database = Storage.databases[room.id];
		if (!database || !database.youtubeLinks) return this.say("There are no videos stored in the database.");
		this.say("Random stored video: " + Tools.sampleOne(database.youtubeLinks));
	},
};

exports.commands = commands;