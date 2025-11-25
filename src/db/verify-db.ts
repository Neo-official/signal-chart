import { Database } from 'bun:sqlite';

const db = new Database(process.env.DATABASE_URL!);

console.log('Checking database tables...\n');

const tables = db.query("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables);

if (tables.some((t: any) => t.name === 'settings')) {
	const settings = db.query("SELECT * FROM settings").all();
	console.log('\nSettings:', settings);
}

if (tables.some((t: any) => t.name === 'devices')) {
	const devices = db.query("SELECT * FROM devices").all();
	console.log('\nDevices:', devices);
}

db.close();
