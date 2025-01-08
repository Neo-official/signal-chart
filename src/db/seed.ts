import { users } from "./schema";
import { hash } from "bcryptjs";
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
// import { faker } from "@faker-js/faker";
import * as dotenv from "dotenv";

dotenv.config({path: "./.env"});

export async function hashPassword(password: string): Promise<string> {
	return await hash(password, 12);
}

async function seed() {
	console.log('Seeding database...')
	if (!process.env.DATABASE_URL) 
		throw new Error('DATABASE_URL not set');
	
	const sqlite = new Database(process.env.DATABASE_URL!);
	const db = drizzle(sqlite, {schema});

	const hashedPassword = await hashPassword('admin');

	await db.insert(users).values({
		username: 'admin',
		password: hashedPassword,
	});

	console.log('Database seeded!');
}

seed().catch(console.error);
