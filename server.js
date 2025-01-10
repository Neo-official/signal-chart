const {createServer} = require('http');
const {parse} = require('url');
const next = require('next');
const {Server} = require("socket.io");
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const app = next({dev});
const handle = app.getRequestHandler();

const DEFAULT_SETTING = {
	maxDataPoints: 31557600, // 31557600 seconds - save data for 1 year
	maxDataSend: 300 // 300 seconds - send last 5 minute of data
};

const dataDir = './data';
const saveDataTimer = process.env.SAVE_DATA_TIMER || 1000 * 60 * 5; // 5 min

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
			const devices = JSON.parse(fs.readFileSync(`${dataDir}/devices.json`, 'utf8'));

			return devices;
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

	}
};

const db = {
	settings: data.settings(),
	devices: data.devices(),
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

function createDevice(socketId) {
	return {
		id: Object.keys(db.devices).length + 1,
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
		// noinspection JSIgnoredPromiseFromCall
		handle(req, res, parsedUrl);
	});

	const io = new Server(server);

	// Create namespaces
	const userNS = io.of('/user');
	const adminNS = io.of('/admin');
	const deviceNS = io.of('/device');

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

		socket.on('devices', () => {
			console.log('get admin device list');
			socket.emit('devices', db.adminDevices);
			socket.emit('settings', db.settings);
		});

		socket.on('device:V-out', (device) => {
			console.log('device:V-out', device.v_out);
			db.devices[device.socketId].v_out = device.v_out;
			deviceNS.to(device.socketId).emit('device:V-out', device.v_out);
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

	deviceNS.on('connection', (socket) => {
		console.log('A device connected');
		if (!db.devices[socket.id]) {
			db.devices[socket.id] = createDevice(socket.id);
			console.log("Device is connected", socket.id);
			socket.join(`Device:${socket.id}`);
			socket.emit('device:V-out', db.devices[socket.id].v_out);
			adminNS.emit('devices', db.adminDevices);
		}

		// socket.on('_connect', (device) => {
		// 	console.log('device connected', device);
		// 	db.devices[device.socketId] = {
		// 		...device,
		// 		data: [],
		// 		labels: []
		// 	};
		// 	adminNS.emit('devices', db.adminDevices);
		// });

		socket.on('data:add', (dataValue) => {
			// console.log('data:add', dataValue);
			let device = db.devices[socket.id];
			if (!device) {
				device = createDevice(socket.id)
				db.devices[socket.id] = device;
				console.log("Device is connected", socket.id);
				socket.join(`Device:${socket.id}`);
				socket.emit('device:V-out', device.v_out);

				// io.emit('devices', db.devices);
			}
			adminNS.emit('devices', db.adminDevices);

			if (device.state !== 'active')
				return;

			const label = Date.now();

			device.data.push(dataValue);
			device.labels.push(label);

			if (db.settings.maxDataPoints < device.data.length)
				device.data.shift();

			if (db.settings.maxDataPoints < device.labels.length)
				device.labels.shift();

			userNS.emit('devices', db.userDevices);
		});

		socket.on('disconnect', () => {
			console.log('device disconnected');
			// delete db.devices[socket.id];
			if (db.devices[socket.id])
				db.devices[socket.id].status = 'offline';
			adminNS.emit('devices', db.adminDevices);
		});
	});

	/*io.on('connection', (socket) => {
		// const projects = await fetchProjects(socket);
		//
		// projects.forEach(project => socket.join("project:" + project.id));
		//
		// and then later
		// io.to("project:4321").emit("project updated");
		console.log('A user connected');

		if (db.devices[socket.id]) {
			console.log("Device is connected", socket.id);
			socket.emit('scale:update', db.devices[socket.id].scale);
		}

		socket.emit('devices', db.userDevices);
		socket.emit('admin:devices', db.adminDevices);
		socket.emit('admin:settings', db.settings);

		socket.on('_connect', (isAdmin = false) => {
			console.log('User connected', isAdmin);
			if (isAdmin) {
				socket.emit('admin:devices', db.adminDevices);
				socket.emit('admin:settings', db.settings);

				socket.on('admin:devices', () => {
					console.log('get admin device list');
					socket.emit('admin:devices', db.adminDevices);
					socket.emit('admin:settings', db.settings);
				});

				socket.on('device:scale', (device) => {
					console.log('device:scale', device.scale);
					db.devices[device.socketId].scale = device.scale;
					io.emit('device:scale', device.scale);
				});

				socket.on('device:state', (device) => {
					console.log('device:state', device.state);
					db.devices[device.socketId].state = device.state;
					io.emit('devices', db.userDevices);
					io.emit('admin:devices', db.adminDevices);
				});

				socket.on('admin:settings', (settings) => {
					console.log('admin:settings', settings);
					db.settings.maxDataPoints = settings.maxDataPoints;
					db.settings.maxDataSend = settings.maxDataSend;
					io.emit('admin:settings', db.settings);

					for (const device of Object.values(db.devices)) {
						device.data = device.data.slice(-settings.maxDataPoints);
						device.labels = device.labels.slice(-settings.maxDataPoints);
					}
				});

			} else {
				socket.emit('devices', db.userDevices);

				socket.on('devices', () => {
					console.log('get user device list');
					socket.emit('devices', db.userDevices);
				});
			}
		});

		socket.on('disconnect', () => {
			console.log('User disconnected');
		});

		socket.on('data:add', (dataValue) => {
			// console.log('data:add', dataValue);
			let device = db.devices[socket.id];
			if (!device) {
				device = {
					state: 'pending', // ban, pending, active
					id: Object.keys(db.devices).length + 1,
					socketId: socket.id,
					data: [],
					labels: [],
					scale: 100
				};
				db.devices[socket.id] = device;
				console.log("Device is connected", socket.id);
				socket.emit('scale:update', device.scale);

				// io.emit('devices', db.devices);
			}
			io.emit('admin:devices', db.adminDevices);

			if (device.state !== 'active')
				return;

			const label = Date.now();

			device.data.push(dataValue);
			device.labels.push(label);

			if (db.settings.maxDataPoints < device.data.length)
				device.data.shift();

			if (db.settings.maxDataPoints < device.labels.length)
				device.labels.shift();

			io.emit('devices', db.userDevices);
		});

		// Add your Socket.IO event handlers here
	});*/

	server.listen(3000, (err) => {
		if (err) throw err;
		console.log('> Ready on http://localhost:3000');
		// save data every  5 minutes
		setInterval(() => {
			console.log('Saving data');
			// save data to file
			fs.writeFileSync(`${dataDir}/devices.json`, JSON.stringify(db.devices), 'utf-8');
			fs.writeFileSync(`${dataDir}/settings.json`, JSON.stringify(db.settings), 'utf-8');

			console.log('data has been saved');
		}, saveDataTimer);
	});
});