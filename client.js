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
const REQUEST_THROTTLE = 4000;
const BASE_RECONNECT_SECONDS = 60;
const RELOGIN_SECONDS = 60;

let server = 'play.pokemonshowdown.com';
if (Config.server && Config.server !== server) {
	server = Config.server.includes('.psim.us') ? Config.server : Config.server + '.psim.us';
}
let serverId = 'showdown';
let reconnections = 0;

/**@type {Array<string>} */
let bannedWords = Config.bannedWords && Array.isArray(Config.bannedWords) ? Config.bannedWords.map(x => x.toLowerCase()) : [];

let bootedWithForever = false;
let forever;
try {
	// @ts-ignore
	forever = require('forever');
} catch (e) {}
if (forever) {
	forever.list(false, /**@param {Error} err @param {Array} list*/(err, list) => {
		if (err || !list) return;
		for (let i = 0, len = list.length; i < len; i++) {
			if (list[i].pid === process.pid) {
				bootedWithForever = true;
				break;
			}
		}
	});
}

class Client {
	constructor() {
		this.serverId = serverId;
		this.challstr = '';
		/**@type {Array<string>} */
		this.messageQueue = [];
		this.messageQueueTimeout = null;
		/**@type {Array<Function>} */
		this.requestQueue = [];
		/**@type {?NodeJS.Timer} */
		this.requestQueueTimeout = null;
		this.connectTimeout = null;
		this.lockdown = false;

		this.client = new WebSocketClient();
		this.client.on('connect', connection => {
			this.connection = connection;

			this.connection.on('message', message => this.onMessage(message));
			this.connection.on('error', error => this.onConnectionError(error));
			this.connection.on('close', (code, description) => this.onConnectionClose(code, description));

			this.onConnect();
		});
		this.client.on('connectFailed', error => this.onConnectFail(error));
	}

	onConnect() {
		console.log('Successfully connected to server ' + server);
	}

	/**
	 * @param {Error} [error]
	 */
	onConnectFail(error) {
		if (this.connectTimeout) clearTimeout(this.connectTimeout);
		if (error) console.log(error.stack);
		reconnections++;
		let retryTime = BASE_RECONNECT_SECONDS * reconnections;
		console.log('Failed to connect to server ' + server + '\nRetrying in ' + retryTime + ' seconds' + (reconnections > 1 ? ' (' + reconnections + ')' : ''));
		this.connectTimeout = setTimeout(() => this.connect(), retryTime * 1000);
	}

	/**
	 * @param {Error} error
	 */
	onConnectionError(error) {
		console.log('Connection error: ' + error.stack);
		// 'close' is emitted directly after 'error' so reconnecting is handled in onConnectionClose
	}

	/**
	 * @param {number} code
	 * @param {string} description
	 */
	onConnectionClose(code, description) {
		if (this.connectTimeout) clearTimeout(this.connectTimeout);
		let reconnectTime;
		if (this.lockdown) {
			console.log("Connection closed: the server restarted");
			reconnections = 0;
			reconnectTime = 15;
			if (bootedWithForever) {
				setTimeout(() => process.exit(), reconnectTime * 1000);
				return;
			}
		} else {
			console.log('Connection closed: ' + description + ' (' + code + ')');
			reconnections++;
			reconnectTime = BASE_RECONNECT_SECONDS * reconnections;
		}
		console.log('Reconnecting in ' + reconnectTime + ' seconds' + (reconnections > 1 ? ' (' + reconnections + ')' : ''));
		Rooms.destroyRooms();
		Users.destroyUsers();
		this.connectTimeout = setTimeout(() => this.connect(), reconnectTime * 1000);
	}

	connect() {
		let options = {
			hostname: 'play.pokemonshowdown.com',
			path: '/crossdomain.php?' + querystring.stringify({host: server, path: ''}),
			method: 'GET',
		};

		https.get(options, response => {
			response.setEncoding('utf8');
			let data = '';
			response.on('data', chunk => {
				data += chunk;
			});
			response.on('end', () => {
				let configData = data.split('var config = ')[1];
				if (configData) {
					let config = JSON.parse(configData.split(';')[0]);
					if (typeof config === 'string') config = JSON.parse(config); // encoded twice by the server
					if (config.host) {
						if (config.id) this.serverId = config.id;
						this.client.connect('ws://' + (config.host === 'showdown' ? 'sim.smogon.com' : config.host) + ':' + (config.port || 8000) + '/showdown/websocket');
						return;
					}
				}
				console.log('Error: failed to get data for server ' + server);
			});
		}).on('error', error => {
			console.log('Error: ' + error.message);
		});

		this.connectTimeout = setTimeout(() => this.onConnectFail(), 30 * 1000);
	}

	/**
	 * @param {{type: string, utf8Data?: string}} message
	 */
	onMessage(message) {
		if (message.type !== 'utf8' || !message.utf8Data) return;
		let room = Rooms.add('lobby');
		if (!message.utf8Data.includes('\n')) return MessageParser.parse(message.utf8Data, room);

		let lines = message.utf8Data.split('\n');
		if (lines[0].charAt(0) === '>') {
			room = Rooms.add(lines[0].substr(1));
			lines.shift();
		}
		for (let i = 0, len = lines.length; i < len; i++) {
			if (lines[i].startsWith('|init|')) {
				MessageParser.parse(lines[i], room);
				lines = lines.slice(i + 1);
				for (let i = 0, len = lines.length; i < len; i++) {
					if (lines[i].startsWith('|users|')) {
						MessageParser.parse(lines[i], room);
						break;
					}
				}
				return;
			}
			MessageParser.parse(lines[i], room);
		}
	}

	login() {
		let action = url.parse('https://play.pokemonshowdown.com/~~' + this.serverId + '/action.php');
		let options = {
			hostname: action.hostname,
			path: action.pathname,
			agent: false,
		};
		if (action.port) options.port = parseInt(action.port);

		let postData;
		if (Config.password) {
			options.method = 'POST';
			postData = querystring.stringify({
				'act': 'login',
				'name': Config.username,
				'pass': Config.password,
				'challstr': this.challstr,
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
				'challstr': this.challstr,
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
				} else if (data.charAt(0) !== ']') {
					console.log('Failed to log in: ' + data);
					process.exit();
				} else if (data.startsWith('<!DOCTYPE html>')) {
					console.log('Failed to log in: connection timed out. Trying again in ' + RELOGIN_SECONDS + ' seconds');
					setTimeout(() => this.login(), RELOGIN_SECONDS * 1000);
					return;
				} else if (data.includes('heavy load')) {
					console.log('Failed to log in: the login server is under heavy load. Trying again in ' + RELOGIN_SECONDS + ' seconds');
					setTimeout(() => this.login(), RELOGIN_SECONDS * 1000);
					return;
				} else {
					if (Config.password) {
						let assertion = JSON.parse(data.substr(1));
						if (assertion.actionsuccess && assertion.assertion) {
							data = assertion.assertion;
						} else {
							console.log('Failed to log in: ' + JSON.stringify(assertion));
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

	/**
	 * @param {string} message
	 */
	send(message) {
		if (!message || !this.connection || !this.connection.connected) return;
		if (this.messageQueueTimeout) {
			this.messageQueue.push(message);
			return;
		}
		if (bannedWords.length) {
			let lower = message.toLowerCase();
			for (let i = 0, len = bannedWords.length; i < len; i++) {
				if (lower.includes(bannedWords[i])) return;
			}
		}
		this.connection.send(message);
		this.messageQueueTimeout = setTimeout(() => {
			this.messageQueueTimeout = null;
			let message = this.messageQueue.shift();
			if (message) this.send(message);
		}, MESSAGE_THROTTLE);
	}

	prepareNextRequest() {
		this.requestQueueTimeout = setTimeout(() => {
			this.requestQueueTimeout = null;
			let request = this.requestQueue.shift();
			if (!request) return;
			request();
		}, REQUEST_THROTTLE);
	}
}

module.exports = new Client();
