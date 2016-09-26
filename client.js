/**
 * Client
 * Cassius - https://github.com/sirDonovan/Cassius
 *
 * This file connects to the server and handles incoming/outgoing messages.
 *
 * @license MIT license
 */

'use strict';

const WebSocketClient = require('websocket').client;
const https = require('https');
const url = require('url');
const querystring = require('querystring');
const MESSAGE_THROTTLE = 600;
const RETRY_SECONDS = 60;

let server = 'play.pokemonshowdown.com';
if (Config.server && Config.server !== server) {
	server = Config.server.includes('.psim.us') ? Config.server : Config.server + '.psim.us';
}
let serverId = 'showdown';

class Client {
	constructor() {
		this.connection = null;
		this.challengeKeyId = '';
		this.challenge = '';
		this.messageQueue = [];
		this.messageQueueTimeout = null;

		let client = new WebSocketClient();
		client.on('connect', connection => this.onConnect(connection));
		client.on('connectFailed', error => this.onConnectFail(error));
		this.client = client;
	}

	onConnect(connection) {
		console.log('Successfully connected to server ' + server);

		connection.on('message', message => {
			if (message.type !== 'utf8' || message.utf8Data.charAt(0) !== 'a') return;
			this.onMessage(message.utf8Data);
		});

		connection.on('error', error => console.log('Connection error: ' + error.stack));

		connection.on('close', (code, description) => {
			console.log('Connection closed: ' + description + ' (' + code + ')\nReconnecting in ' + RETRY_SECONDS + ' seconds');
			setTimeout(() => this.connect(), RETRY_SECONDS * 1000);
		});

		this.connection = connection;
	}

	onConnectFail(error) {
		console.log('Failed to connect to server ' + server + ':\n' + error.stack + '\nRetrying in ' + RETRY_SECONDS + ' seconds');
		setTimeout(() => this.connect(), RETRY_SECONDS * 1000);
	}

	connect() {
		let characters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '_'];
		let string = '';
		for (let i = 0, len = characters.length; i < 8; i++) {
			string += characters[Math.floor((Math.random() * len))];
		}

		https.get('https://play.pokemonshowdown.com/crossdomain.php?' + querystring.stringify({host: server, path: ''}), response => {
			response.setEncoding('utf8');
			let data = '';
			response.on('data', chunk => {
				data += chunk;
			});
			response.on('end', () => {
				let config = data.split('var config = ')[1];
				if (config) {
					config = JSON.parse(config.split(';')[0]);
					if (typeof config === 'string') config = JSON.parse(config); // encoded twice by the server
					if (config.host) {
						if (config.id) serverId = config.id;
						this.client.connect('ws://' + (config.host === 'showdown' ? 'sim.smogon.com' : config.host) + ':' + (config.port || 8000) + '/showdown/' + Math.floor(Math.random() * 1000) + '/' + string + '/websocket');
						return;
					}
				}
				console.log('Error: failed to get data for server ' + server);
			});
		}).on('error', error => {
			console.log('Error: ' + error.message);
		});
	}

	onMessage(message) {
		message = JSON.parse(message.substr(1));
		if (!(message instanceof Array)) message = [message];
		for (let i = 0, len = message.length; i < len; i++) {
			if (!message[i]) continue;
			let room = Rooms.add('lobby');
			if (!message[i].includes('\n')) return this.parseMessage(message[i], room);

			let lines = message[i].split('\n');
			if (lines[0].charAt(0) === '>') {
				room = Rooms.add(lines.shift().substr(1));
			}
			for (let i = 0, len = lines.length; i < len; i++) {
				if (lines[i].startsWith('|init|')) {
					this.parseMessage(lines[i], room);
					lines = lines.slice(i + 1);
					for (let i = 0, len = lines.length; i < len; i++) {
						if (lines[i].startsWith('|users|')) {
							this.parseMessage(lines[i], room);
							break;
						}
					}
					return;
				}
				this.parseMessage(lines[i], room);
			}
		}
	}

	parseMessage(message, room) {
		let splitMessage = message.split('|').slice(1);
		let messageType = splitMessage.shift();
		if (typeof Config.parseMessage === 'function') {
			if (Config.parseMessage(room, messageType, splitMessage) === false) return;
		}
		switch (messageType) {
		case 'challstr':
			this.challengeKeyId = splitMessage[0];
			this.challenge = splitMessage[1];
			this.login();
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
					this.send('|/join ' + Config.rooms[i]);
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
		case 'users':
			if (splitMessage[0] === '0') return;
			let users = splitMessage[0].split(",");
			for (let i = 1, len = users.length; i < len; i++) {
				let user = Users.add(users[i].substr(1));
				let rank = users[i].charAt(0);
				room.users.set(user, rank);
				user.rooms.set(room, rank);
			}
			break;
		case 'pm':
			let user = Users.add(splitMessage[0]);
			if (!user) return;
			if (user.id === Users.self.id) return;
			CommandParser.parse(splitMessage.slice(2).join('|'), user, user);
			break;
		default:
			room.parseMessage(messageType, splitMessage);
		}
	}

	login() {
		let action = url.parse('https://play.pokemonshowdown.com/~~' + serverId + '/action.php');
		let options = {
			hostname: action.hostname,
			port: action.port,
			path: action.pathname,
			agent: false,
		};
		let postData;
		if (Config.password) {
			options.method = 'POST';
			postData = querystring.stringify({
				'act': 'login',
				'name': Config.username,
				'pass': Config.password,
				'challengekeyid': this.challengeKeyId,
				'challenge': this.challenge,
			});
			options.headers = {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': postData.length,
			};
		} else {
			options.method = 'GET';
			options.path += '?' + querystring.stringify({
				'act': 'getassertion',
				'userid': Tools.toId(Config.username),
				'challengekeyid': this.challengeKeyId,
				'challenge': this.challenge,
			});
		}

		let request = https.request(options, response => {
			response.setEncoding('utf8');
			let data = '';
			response.on('data', chunk => {
				data += chunk;
			});
			response.on('end', () => {
				if (data === ';') {
					console.log('Failed to log in: invalid password');
					process.exit();
				} else if (data.startsWith('<!DOCTYPE html>')) {
					console.log('Failed to log in: connection timed out. Trying again in ' + RETRY_SECONDS + ' seconds');
					setTimeout(() => this.login(), RETRY_SECONDS * 1000);
					return;
				} else if (data.includes('heavy load')) {
					console.log('Failed to log in: the login server is under heavy load. Trying again in ' + RETRY_SECONDS + ' seconds');
					setTimeout(() => this.login(), RETRY_SECONDS * 1000);
					return;
				} else if (data.length < 50) {
					console.log('Failed to log in: ' + data);
					process.exit();
				} else {
					if (Config.password) {
						data = JSON.parse(data.substr(1));
						if (data.actionsuccess) {
							data = data.assertion;
						} else {
							console.log('Failed to log in: ' + JSON.stringify(data));
							process.exit();
						}
					}
					this.send('|/trn ' + Config.username + ',0,' + data);
				}
			});
		});

		request.on('error', error => console.log('Login error: ' + error.stack));

		if (postData) request.write(postData);
		request.end();
	}

	send(message) {
		if (!message || !this.connection || !this.connection.connected) return;
		if (this.messageQueueTimeout) {
			this.messageQueue.push(message);
			return;
		}
		message = JSON.stringify([message]);
		this.connection.send(message);
		this.messageQueueTimeout = setTimeout(() => {
			this.messageQueueTimeout = null;
			this.send(this.messageQueue.shift());
		}, MESSAGE_THROTTLE);
	}
}

module.exports = new Client();
