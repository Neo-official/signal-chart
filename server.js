const {createServer} = require('http');
const {parse} = require('url');
const next = require('next');
const {Server} = require("socket.io");
const {WebSocketServer} = require('ws');
const fs = require('fs');
const crypto = require("crypto");

const dev = process.env.NODE_ENV !== 'production';
const app = next({dev});
const handle = app.getRequestHandler();

const DEFAULT_SETTING = {
	maxDataPoints: 31557600, // 31557600 seconds - save data for 1 year
	maxDataSend: 300 // 300 seconds - send last 5 minute of data
};
const DEFAULT_SIZES = {
	devices: 0
};

const dataDir = './data';
const deletedDevicesDir = '/_deletedDevices';
const saveDataTimer = process.env.SAVE_DATA_TIMER || 1000 * 60; // 1 min

const data = {
	devices() {
		if (!fs.existsSync(dataDir))
			fs.mkdirSync(dataDir);

		if (!fs.existsSync(`${dataDir}/devices.json`)) {
			const devices = {};
			fs.writeFileSync(`${dataDir}/devices.json`, JSON.stringify(devices));
			return devices;
		}

		try {
			return JSON.parse(fs.readFileSync(`${dataDir}/devices.json`, 'utf8'));
		} catch (e) {
			console.log(e);
		}

		return {};
	},
	settings() {
		if (!fs.existsSync(dataDir))
			fs.mkdirSync(dataDir);

		if (!fs.existsSync(`${dataDir}/settings.json`)) {
			const settings = DEFAULT_SETTING;
			fs.writeFileSync(`${dataDir}/settings.json`, JSON.stringify(settings));
			return settings;
		}

		try {
			const settings = JSON.parse(fs.readFileSync(`${dataDir}/settings.json`, 'utf8'));

			return {...DEFAULT_SETTING, ...settings};
		} catch (e) {
			console.log(e);
		}

		return {};

	},
	sizes() {
		if (!fs.existsSync(dataDir))
			fs.mkdirSync(dataDir);

		if (!fs.existsSync(`${dataDir}/sizes.json`)) {
			const sizes = DEFAULT_SIZES;
			fs.writeFileSync(`${dataDir}/sizes.json`, JSON.stringify(sizes));
			return sizes;
		}

		try {
			const sizes = JSON.parse(fs.readFileSync(`${dataDir}/sizes.json`, 'utf8'));

			return {...DEFAULT_SIZES, ...sizes};
		} catch (e) {
			console.log(e);
		}

		return {};

	},
	save() {
		fs.writeFileSync(`${dataDir}/devices.json`, JSON.stringify(db.devices));
		fs.writeFileSync(`${dataDir}/settings.json`, JSON.stringify(db.settings));
		fs.writeFileSync(`${dataDir}/sizes.json`, JSON.stringify(db.sizes));
	},
	deleteDevice(deviceSocketId) {
		if (!fs.existsSync(dataDir + deletedDevicesDir))
			fs.mkdirSync(dataDir + deletedDevicesDir);

		const device = db.devices[deviceSocketId];
		if (device) {
			fs.writeFileSync(`${dataDir + deletedDevicesDir}/device-${deviceSocketId}.json`, JSON.stringify(device));
			delete db.devices[deviceSocketId];
			this.save();
		}
	}
};

const db = {
	settings: data.settings(),
	devices: data.devices(),
	sizes: data.sizes(),
	get _devices() {
		return Object.values(this.devices)
			.map(device => ({
				...device,
				data: device.data.slice(-this.settings.maxDataSend),
				labels: device.labels.slice(-this.settings.maxDataSend)
			}));
	},
	get userDevices() {
		return this._devices.filter(d => d.state === 'active');
	},
	get adminDevices() {
		return this._devices;
	}
};

// Helper functions
function generateUniqueId() {
	return crypto.randomBytes(16).toString('hex');
}

function parseMessage(message) {
	try {
		return JSON.parse(message);
	} catch (error) {
		console.error('Error parsing message:', error);
		return {};
	}
}

function sendJSON(ws, type, data) {
	if (ws.readyState === WebSocket.OPEN) {
		try {
			ws.send(JSON.stringify({type, data}));
		} catch (error) {
			console.error('Error sending message:', error);
		}
	}
}

function createDevice(socketId) {
	return {
		id: (db.sizes.devices++),
		state: 'pending', // ban, pending, active
		status: 'online', // online, offline
		socketId,
		data: [],
		labels: [],
		v_out: 100
	};
}

app.prepare().then(() => {
	const server = createServer((req, res) => {
		const parsedUrl = parse(req.url, true);
		handle(req, res, parsedUrl);
	});
	const wsServer = createServer();
	// Socket.IO setup with namespaces
	const io = new Server(server, {
		path: '/socket.io'
	});

	// Create Socket.IO namespaces
	const userNS = io.of('/user');
	const adminNS = io.of('/admin');

	// WebSocket server for devices
	const wss = new WebSocketServer({
		server: wsServer
		// path: '/device'
	});


	userNS.on('connection', (socket) => {
		console.log('A user connected');
		socket.emit('devices', db.userDevices);

		socket.on('devices', () => {
			console.log('get user device list');
			socket.emit('devices', db.userDevices);
		});

		socket.on('_connect', () => {
			console.log('user connected');
			socket.emit('devices', db.userDevices);
		});

		socket.on('disconnect', () => {
			console.log('user disconnected');
		});
	});

	adminNS.on('connection', (socket) => {
		console.log('A admin connected');

		socket.emit('devices', db.adminDevices);
		socket.emit('settings', db.settings);

		// device:get (deviceId) => device
		socket.on('device:get', (deviceId) => {
			console.log('device:get', deviceId);
			const device = db.devices[deviceId];
			if (device)
				socket.emit('device:get', device);
		});

		// device:delete (deviceId) => void
		socket.on('device:delete', (deviceSocketId) => {
			console.log('device:delete', deviceSocketId);
			data.deleteDevice(deviceSocketId);
			deviceConnections[deviceSocketId]?.close();
			delete deviceConnections[deviceSocketId];
			userNS.emit('devices', db.userDevices);
			adminNS.emit('devices', db.adminDevices);
		});

		socket.on('devices', () => {
			console.log('get admin device list');
			socket.emit('devices', db.adminDevices);
			socket.emit('settings', db.settings);
		});

		socket.on('device:V-out', (device) => {
			console.log('device:V-out', device.v_out);
			db.devices[device.socketId].v_out = device.v_out;
			// deviceNS.to(device.socketId).emit('device:V-out', device.v_out);
			sendJSON(deviceConnections[device.socketId], 'device:V-out', device.v_out);
		});

		socket.on('device:state', (device) => {
			console.log('device:state', device.state);
			db.devices[device.socketId].state = device.state;
			userNS.emit('devices', db.userDevices);
			adminNS.emit('devices', db.adminDevices);
		});

		socket.on('settings', (settings) => {
			console.log('admin:settings', settings);
			db.settings.maxDataPoints = settings.maxDataPoints;
			db.settings.maxDataSend = settings.maxDataSend;
			adminNS.emit('settings', db.settings);

			for (const device of Object.values(db.devices)) {
				device.data = device.data.slice(-settings.maxDataPoints);
				device.labels = device.labels.slice(-settings.maxDataPoints);
			}
		});

		socket.on('_connect', () => {
			console.log('admin connected');
			socket.emit('devices', db.adminDevices);
			socket.emit('settings', db.settings);
		});

		socket.on('disconnect', () => {
			console.log('admin disconnected');
		});
	});

	// deviceNS.on('connection', (socket) => {
	// 	console.log('A device connected');
	// 	if (!db.devices[socket.id]) {
	// 		db.devices[socket.id] = createDevice(socket.id);
	// 		console.log("Device is connected", socket.id);
	// 		socket.join(`Device:${socket.id}`);
	// 		socket.emit('device:V-out', db.devices[socket.id].v_out);
	// 		adminNS.emit('devices', db.adminDevices);
	// 	}
	//
	// 	// socket.on('_connect', (device) => {
	// 	// 	console.log('device connected', device);
	// 	// 	db.devices[device.socketId] = {
	// 	// 		...device,
	// 	// 		data: [],
	// 	// 		labels: []
	// 	// 	};
	// 	// 	adminNS.emit('devices', db.adminDevices);
	// 	// });
	//
	// 	socket.on('data:add', (dataValue) => {
	// 		// console.log('data:add', dataValue);
	// 		let device = db.devices[socket.id];
	// 		if (!device) {
	// 			device = createDevice(socket.id);
	// 			db.devices[socket.id] = device;
	// 			console.log("Device is connected", socket.id);
	// 			socket.join(`Device:${socket.id}`);
	// 			socket.emit('device:V-out', device.v_out);
	//
	// 			// io.emit('devices', db.devices);
	// 		}
	// 		adminNS.emit('devices', db.adminDevices);
	//
	// 		if (device.state !== 'active')
	// 			return;
	//
	// 		const label = Date.now();
	//
	// 		device.data.push(dataValue);
	// 		device.labels.push(label);
	//
	// 		if (db.settings.maxDataPoints < device.data.length)
	// 			device.data.shift();
	//
	// 		if (db.settings.maxDataPoints < device.labels.length)
	// 			device.labels.shift();
	//
	// 		userNS.emit('devices', db.userDevices);
	// 	});
	//
	// 	socket.on('disconnect', () => {
	// 		console.log('device disconnected');
	// 		// delete db.devices[socket.id];
	// 		if (db.devices[socket.id])
	// 			db.devices[socket.id].status = 'offline';
	// 		adminNS.emit('devices', db.adminDevices);
	// 	});
	// });

	// Store device WebSocket connections
	const deviceConnections = {};
	// WebSocket handlers for devices
	wss.on('connection', (ws) => {
		ws.id = generateUniqueId();
		const deviceSocketId = ws.id;
		console.log('Device connected via WebSocket: ', deviceSocketId);

		// Store the WebSocket connection
		deviceConnections[deviceSocketId] = ws;

		// Create new device
		if (!db.devices[deviceSocketId])
			db.devices[deviceSocketId] = createDevice(deviceSocketId);

		db.devices[deviceSocketId].status = 'online';
		adminNS.emit('devices', db.adminDevices);

		ws.on('message', (message) => {
			const {type, data} = parseMessage(message);

			// console.log(message, ({type, data}));
			switch (type) {
				case 'device:data:add':
					let device = db.devices[deviceSocketId];
					if (!device) {
						device = createDevice(deviceSocketId);
						db.devices[deviceSocketId] = device;
						console.log("Device is connected", deviceSocketId);
						sendJSON(ws, 'device:V-out', device.v_out);
					}
					adminNS.emit('devices', db.adminDevices);

					if (device.state !== 'active') return;

					const label = Date.now();
					device.data.push(data);
					device.labels.push(label);

					if (device.data.length > db.settings.maxDataPoints) {
						device.data = device.data.slice(-db.settings.maxDataPoints);
						device.labels = device.labels.slice(-db.settings.maxDataPoints);
					}

					userNS.emit('devices', db.userDevices);
					break;
			}

		});
		ws.on('close', () => {
			console.log('Device disconnected via WebSocket: ', deviceSocketId);
			// Remove the WebSocket connection
			delete deviceConnections[deviceSocketId];
			if (db.devices[deviceSocketId])
				db.devices[deviceSocketId].status = 'offline';

			adminNS.emit('devices', db.adminDevices);
			userNS.emit('devices', db.userDevices);
		});

	});

	// Start servers on different ports
	wsServer.listen(3000, (err) => {
		if (err) throw err;
		console.log('> WebSocket Server ready on ws://localhost:3000');
	});

	server.listen(8000, (err) => {
		if (err) throw err;
		console.log('> Next.js + Socket.IO Server ready on http://localhost:8000');
		// save data every  5 minutes
		setInterval(() => {
			console.log('Saving data');
			// save data to file
			data.save();
			console.log('data has been saved');
		}, saveDataTimer);
	});
});