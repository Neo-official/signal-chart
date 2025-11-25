import { db } from './index';
import { Device, deviceData, DeviceData, devices, NewDevice, settings, Settings } from './schema';
import { and, desc, eq, gte } from 'drizzle-orm';

export class DatabaseService {
	// Settings
	async getSettings(): Promise<Partial<Settings>> {
		try {
			const result = await db.select().from(settings).limit(1);
			if (result.length === 0) {
				const [newSettings] = await db.insert(settings).values({}).returning();
				return newSettings;
			}
			return result[0];
		} catch (error) {
			console.error('Error getting settings:', error);
			return {
				id: 1,
				maxDataPoints: 31557600,
				maxDataSend: 300,
				isSingleDevice: true,
				updatedAt: new Date().toISOString()
			};
		}
	}

	async updateSettings(data: Partial<Settings>): Promise<Settings> {
		try {
			const current = await this.getSettings();
			const [updated] = await db.update(settings)
				.set({ ...data, updatedAt: new Date().toISOString() })
				.where(eq(settings.id, current.id))
				.returning();
			return updated;
		} catch (error) {
			console.error('Error updating settings:', error);
			throw error;
		}
	}

	// Devices
	async getDeviceBySocketId(socketId: string): Promise<Device | undefined> {
		try {
			const result = await db.select().from(devices).where(eq(devices.socketId, socketId)).limit(1);
			return result[0];
		} catch (error) {
			console.error('Error getting device:', error);
			return undefined;
		}
	}

	async getAllDevices(): Promise<Device[]> {
		try {
			return await db.select().from(devices);
		} catch (error) {
			console.error('Error getting all devices:', error);
			return [];
		}
	}

	async getActiveDevices(): Promise<Device[]> {
		try {
			return await db.select().from(devices).where(eq(devices.state, 'active'));
		} catch (error) {
			console.error('Error getting active devices:', error);
			return [];
		}
	}

	async createDevice(data: NewDevice): Promise<Device> {
		if (!data.socketId || typeof data.socketId !== 'string') throw new Error('Invalid socketId');
		if (data.socketId.length > 255) throw new Error('socketId too long');
		
		const [device] = await db.insert(devices).values(data).returning();
		return device;
	}

	async updateDevice(socketId: string, data: Partial<Device>): Promise<Device | undefined> {
		if (!socketId) throw new Error('Invalid socketId');
		
		const sanitizedData = { ...data };
		delete (sanitizedData as any).id;
		delete (sanitizedData as any).socketId;
		
		const [updated] = await db.update(devices)
			.set({ ...sanitizedData, updatedAt: new Date().toISOString() })
			.where(eq(devices.socketId, socketId))
			.returning();
		return updated;
	}

	async deleteDevice(socketId: string): Promise<void> {
		try {
			if (!socketId) throw new Error('Invalid socketId');
			await db.delete(devices).where(eq(devices.socketId, socketId));
		} catch (error) {
			console.error('Error deleting device:', error);
			throw error;
		}
	}

	// Device Data
	async addDeviceData(deviceId: number, vo: number, io: number, timestamp: number): Promise<DeviceData> {
		if (!Number.isFinite(deviceId) || deviceId <= 0) throw new Error('Invalid deviceId');
		if (!Number.isFinite(vo)) throw new Error('Invalid vo value');
		if (!Number.isFinite(io)) throw new Error('Invalid io value');
		if (!Number.isFinite(timestamp) || timestamp <= 0) throw new Error('Invalid timestamp');
		
		const [data] = await db.insert(deviceData).values({ deviceId, vo, io, timestamp }).returning();
		return data;
	}

	async getDeviceData(deviceId: number, limit?: number): Promise<DeviceData[]> {
		const query = db.select().from(deviceData)
			.where(eq(deviceData.deviceId, deviceId))
			.orderBy(desc(deviceData.timestamp));
		
		if (limit) {
			return query.limit(limit);
		}
		return query;
	}

	async getDeviceDataSince(deviceId: number, timestamp: number): Promise<DeviceData[]> {
		return db.select().from(deviceData)
			.where(and(
				eq(deviceData.deviceId, deviceId),
				gte(deviceData.timestamp, timestamp)
			))
			.orderBy(desc(deviceData.timestamp));
	}

	async cleanOldDeviceData(deviceId: number, maxPoints: number): Promise<void> {
		try {
			const allData = await db.select().from(deviceData)
				.where(eq(deviceData.deviceId, deviceId))
				.orderBy(desc(deviceData.timestamp));
			
			if (allData.length > maxPoints) {
				const toDelete = allData.slice(maxPoints);
				const ids = toDelete.map(d => d.id);
				for (const id of ids) {
					await db.delete(deviceData).where(eq(deviceData.id, id));
				}
			}
		} catch (error) {
			console.error('Error cleaning old device data:', error);
		}
	}

	async getDeviceWithData(deviceId: number, maxDataSend: number) {
		const device = await db.select().from(devices).where(eq(devices.id, deviceId)).limit(1);
		if (!device[0]) return null;

		const data = await this.getDeviceData(deviceId, maxDataSend);
		return {
			id: device[0].id,
			socketId: device[0].socketId,
			state: device[0].state,
			status: device[0].status,
			v_out: device[0].vOut,
			data: data.map(d => [d.vo, d.io] as [number, number]).reverse(),
			labels: data.map(d => d.timestamp).reverse()
		};
	}

	async getAllDevicesWithData(maxDataSend: number, activeOnly = false) {
		const devicesList = activeOnly ? await this.getActiveDevices() : await this.getAllDevices();

		return await Promise.all(
			devicesList.map(async (device) => {
				const data = await this.getDeviceData(device.id, maxDataSend);
				return {
					id      : device.id,
					socketId: device.socketId,
					state   : device.state,
					status  : device.status,
					v_out   : device.vOut,
					data    : data.map(d => [d.vo, d.io] as [number, number]).reverse(),
					labels  : data.map(d => d.timestamp).reverse()
				};
			})
		);
	}
}

export const dbService = new DatabaseService();
