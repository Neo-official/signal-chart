import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { WebSocketServer, WebSocket } from 'ws';
import crypto from 'crypto';
import { dbService } from '@/db/service';
import { validateNumber, rateLimit } from '@/lib/security';
import { SocketMessage } from '@/types/socket';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const deviceConnections = new Map<string, WebSocket>();
let io: Server;

const generateUniqueId = (isSingleDevice: boolean): string => 
	isSingleDevice ? 'single-device' : crypto.randomBytes(16).toString('hex');

const parseMessage = (message: string) => {
	try {
		return JSON.parse(message.toString());
	} catch {
		return {};
	}
};

const sendJSON = (ws: WebSocket, type: string, data: any) => {
	if (ws.readyState === WebSocket.OPEN) {
		try {
			ws.send(JSON.stringify({ type, data }));
		} catch (error) {
			console.error('Send error:', error);
		}
	}
};

const broadcast = (event: string, data: any) => io.emit(event, data);

app.prepare().then(async () => {
	const server = createServer((req, res) => {
		const parsedUrl = parse(req.url!, true);
		handle(req, res, parsedUrl);
	});

	const wsServer = createServer();
	io = new Server(server, { 
		path: '/socket.io',
		cors: { origin: '*' },
		connectionStateRecovery: {}
	});

	const wss = new WebSocketServer({ server: wsServer });

	// Socket.IO Unified Handler
	const handleAction = async (msg: SocketMessage) => {
		switch (msg.resource) {
			case 'device':
				switch (msg.action) {
					case 'delete':
						if (!msg.socketId) return;
						await dbService.deleteDevice(msg.socketId);
						deviceConnections.get(msg.socketId)?.close();
						deviceConnections.delete(msg.socketId);
						broadcast('action', { resource: 'device', action: 'delete', socketId: msg.socketId });
						break;

					case 'update':
						if (!msg.socketId || !msg.key) return;
						
						if (msg.key === 'vOut') {
							if (!validateNumber(msg.value, 0, 10000)) return;
							await dbService.updateDevice(msg.socketId, { vOut: msg.value });
							sendJSON(deviceConnections.get(msg.socketId)!, 'device:V-out', msg.value);
						} else if (msg.key === 'state') {
							if (!['ban', 'pending', 'active'].includes(msg.value)) return;
							await dbService.updateDevice(msg.socketId, { state: msg.value });
							broadcast('action', { resource: 'device', action: 'update', socketId: msg.socketId, key: 'state', value: msg.value });
						}
						break;
				}
				break;

			case 'settings':
				if (msg.action === 'update') {
					const settings = msg.value;
					if (!validateNumber(settings.maxDataPoints, 1, 100000000)) return;
					if (!validateNumber(settings.maxDataSend, 1, 100000)) return;
					if (settings.onlineTimeout) validateNumber(settings.onlineTimeout, 1000, 60000);
					if (settings.idleTimeout) validateNumber(settings.idleTimeout, 1000, 120000);
					await dbService.updateSettings(settings);
					const devices = await dbService.getAllDevices();
					await Promise.all(devices.map(d => dbService.cleanOldDeviceData(d.id, settings.maxDataPoints)));
					const newSettings = await dbService.getSettings();
					broadcast('action', { resource: 'settings', action: 'update', value: newSettings });
				}
				break;
		}
	};

	io.on('connection', (socket) => {
		const isAdmin = socket.handshake.auth?.role === 'admin';
		console.log(`${isAdmin ? 'Admin' : 'User'} connected:`, socket.id);

		if (isAdmin) {
			socket.on('action', async (msg: SocketMessage) => {
				try {
					await handleAction(msg);
				} catch (error) {
					console.error('Action error:', error);
				}
			});
		}

		socket.on('disconnect', () => console.log(`${isAdmin ? 'Admin' : 'User'} disconnected:`, socket.id));
	});

	// Device Status Monitor
	const checkDeviceStatus = async () => {
		const settings = await dbService.getSettings();
		const devices = await dbService.getAllDevices();
		const now = Date.now();

		for (const device of devices) {
			const timeSinceActivity = now - device.lastActivity;
			let newStatus = device.status;

			if (timeSinceActivity > settings.idleTimeout) {
				newStatus = 'offline';
			} else if (timeSinceActivity > settings.onlineTimeout) {
				newStatus = 'idle';
			} else {
				newStatus = 'online';
			}

			if (newStatus !== device.status) {
				await dbService.updateDevice(device.socketId, { status: newStatus });
				broadcast('action', { resource: 'device', action: 'update', socketId: device.socketId, key: 'status', value: newStatus });
			}
		}
	};

	setInterval(checkDeviceStatus, 5000);

	// WebSocket Device Handler
	const handleDeviceConnection = async (ws: any) => {
		const settings = await dbService.getSettings();
		const socketId = generateUniqueId(settings.isSingleDevice);
		ws.id = socketId;
		deviceConnections.set(socketId, ws);
		console.log('Device connected:', socketId);

		let device = await dbService.getDeviceBySocketId(socketId);
		if (!device) {
			device = await dbService.createDevice({ socketId, status: 'online' });
		} else {
			await dbService.updateDevice(socketId, { status: 'online' });
		}

		const deviceData = await dbService.getDeviceWithData(device.id, settings.maxDataSend);
		broadcast('action', { resource: 'device', action: 'create', value: deviceData });

		ws.on('message', async (message: Buffer) => {
			if (!rateLimit(`ws:${socketId}`, 100, 60000)) return;
			
			const { type, data } = parseMessage(message.toString());
			if (type !== 'device:data:add') return;

			let device = await dbService.getDeviceBySocketId(socketId);
			if (!device) {
				device = await dbService.createDevice({ socketId, status: 'online', lastActivity: Date.now() });
				sendJSON(ws, 'device:V-out', device.vOut);
				const settings = await dbService.getSettings();
				const deviceData = await dbService.getDeviceWithData(device.id, settings.maxDataSend);
				broadcast('action', { resource: 'device', action: 'create', value: deviceData });
			}

			await dbService.updateDevice(socketId, { lastActivity: Date.now() });

			if (device.state !== 'active' || !Array.isArray(data) || data.length < 2) return;
			if (!validateNumber(data[0], -1000000, 1000000) || !validateNumber(data[1], -1000000, 1000000)) return;

			const timestamp = Date.now();
			await dbService.addDeviceData(device.id, data[0], data[1], timestamp);
			await dbService.cleanOldDeviceData(device.id, settings.maxDataPoints);
			broadcast('action', { resource: 'device', action: 'update', socketId, key: 'data', value: [data[0], data[1], timestamp] });
		});

		ws.on('close', async () => {
			console.log('Device disconnected:', socketId);
			deviceConnections.delete(socketId);
			await dbService.updateDevice(socketId, { status: 'offline' });
			broadcast('action', { resource: 'device', action: 'update', socketId, key: 'status', value: 'offline' });
		});
	};

	wss.on('connection', handleDeviceConnection);

	wsServer.listen(3000, () => console.log('> WebSocket ready on ws://localhost:3000'));
	server.listen(8000, () => console.log('> Server ready on http://localhost:8000'));
});
