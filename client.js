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
const Room = require('./rooms').Room; // eslint-disable-line no-unused-vars
const MESSAGE_THROTTLE = 600;
const RETRY_SECONDS = 60;

let server = 'play.pokemonshowdown.com';
if (Config.server && Config.server !== server) {
	server = Config.server.includes('.psim.us') ? Config.server : Config.server + '.psim.us';
}
let serverId = 'showdown';

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
		this.challengeKeyId = '';
		this.challenge = '';
		/**@type {Array<string>} */
		this.messageQueue = [];
		this.messageQueueTimeout = null;
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
	 * @param {Error} error
	 */
	onConnectFail(error) {
		if (this.connectTimeout) clearTimeout(this.connectTimeout);
		console.log('Failed to connect to server ' + server + ':\n' + error.stack + '\nRetrying in ' + RETRY_SECONDS + ' seconds');
		this.connectTimeout = setTimeout(() => this.connect(), RETRY_SECONDS * 1000);
	}

	/**
	 * @param {Error} error
	 */
	onConnectionError(error) {
		if (this.connectTimeout) clearTimeout(this.connectTimeout);
		console.log('Connection error: ' + error.stack);
		this.connectTimeout = setTimeout(() => this.connect(), RETRY_SECONDS * 1000);
	}

	/**
	 * @param {number} code
	 * @param {string} description
	 */
	onConnectionClose(code, description) {
		if (this.connectTimeout) clearTimeout(this.connectTimeout);
		let retryTime = RETRY_SECONDS;
		if (this.lockdown) {
			console.log("Connection closed: the server restarted");
			retryTime = 15;
			if (bootedWithForever) {
				setTimeout(() => process.exit(), retryTime * 1000);
				return;
			}
		} else {
			console.log('Connection closed: ' + description + ' (' + code + ')');
		}
		console.log('Reconnecting in ' + retryTime + ' seconds');
		this.connectTimeout = setTimeout(() => this.connect(), retryTime * 1000);
	}

	connect() {
		let characters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '_'];
		let string = '';
		for (let i = 0, len = characters.length; i < 8; i++) {
			string += characters[Math.floor((Math.random() * len))];
		}

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

	/**
	 * @param {{type: string, utf8Data?: string}} incomingMessage
	 */
	onMessage(incomingMessage) {
		if (incomingMessage.type !== 'utf8' || !incomingMessage.utf8Data || incomingMessage.utf8Data.charAt(0) !== 'a') return;
		/**@type {Array<string>} */
		let message = JSON.parse(incomingMessage.utf8Data.substr(1));
		if (!(message instanceof Array)) message = [message];
		for (let i = 0, len = message.length; i < len; i++) {
			if (!message[i]) continue;
			let room = Rooms.add('lobby');
			if (!message[i].includes('\n')) return MessageParser.parse(message[i], room);

			let lines = message[i].split('\n');
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
	}

	login() {
		let action = url.parse('https://play.pokemonshowdown.com/~~' + serverId + '/action.php');
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
						let assertion = JSON.parse(data.substr(1));
						if (assertion.actionsuccess) {
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
		message = JSON.stringify([message]);
		this.connection.send(message);
		this.messageQueueTimeout = setTimeout(() => {
			this.messageQueueTimeout = null;
			let message = this.messageQueue.shift();
			if (message) this.send(message);
		}, MESSAGE_THROTTLE);
	}
}

module.exports = new Client();
