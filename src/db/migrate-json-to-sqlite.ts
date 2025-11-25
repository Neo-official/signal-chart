import { dbService } from './service';
import fs from 'fs';
import path from 'path';

const dataDir = path.resolve(process.cwd(), 'data');

async function migrateData() {
	console.log('Starting migration from JSON to SQLite...\n');

	// Read JSON files
	const devicesPath = path.join(dataDir, 'devices.json');
	const settingsPath = path.join(dataDir, 'settings.json');

	if (!fs.existsSync(devicesPath)) {
		console.log('No devices.json found. Skipping device migration.');
		return;
	}

	const jsonDevices = JSON.parse(fs.readFileSync(devicesPath, 'utf8'));
	const jsonSettings = fs.existsSync(settingsPath) 
		? JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
		: null;

	// Migrate settings
	if (jsonSettings) {
		console.log('Migrating settings...');
		await dbService.updateSettings({
			maxDataPoints: jsonSettings.maxDataPoints,
			maxDataSend: jsonSettings.maxDataSend,
			isSingleDevice: jsonSettings.isSingleDevice
		});
		console.log('✓ Settings migrated\n');
	}

	// Migrate devices
	const deviceEntries = Object.entries(jsonDevices);
	console.log(`Migrating ${deviceEntries.length} devices...\n`);

	for (const [socketId, deviceData] of deviceEntries) {
		const device: any = deviceData;
		
		// Create device
		const existingDevice = await dbService.getDeviceBySocketId(socketId);
		if (existingDevice) {
			console.log(`Device ${socketId} already exists, skipping...`);
			continue;
		}

		const newDevice = await dbService.createDevice({
			socketId,
			state: device.state || 'pending',
			status: device.status || 'offline',
			vOut: device.v_out || 100
		});

		console.log(`✓ Created device: ${socketId} (ID: ${newDevice.id})`);

		// Migrate device data
		if (device.data && device.labels && device.data.length > 0) {
			console.log(`  Migrating ${device.data.length} data points...`);
			
			for (let i = 0; i < device.data.length; i++) {
				const dataPoint = device.data[i];
				const timestamp = device.labels[i];
				
				await dbService.addDeviceData(
					newDevice.id,
					dataPoint[0] || 0,
					dataPoint[1] || 0,
					timestamp
				);
			}
			
			console.log(`  ✓ Migrated ${device.data.length} data points\n`);
		}
	}

	console.log('\n✅ Migration completed successfully!');
	console.log('\nBackup your data directory before deleting it.');
}

migrateData().catch(console.error);
