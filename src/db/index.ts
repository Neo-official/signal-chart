import { drizzle } from 'drizzle-orm/better-sqlite3';
// import { drizzle } from 'drizzle-orm/libsql';
// import { createClient } from '@libsql/client';
import Database from 'better-sqlite3';
import * as schema from './schema';

const sqlite = new Database(process.env.DATABASE_URL!);
// const sqlite = process.env.DATABASE_URL!;
export const db = drizzle(sqlite as any, { schema } as any);
// export function initDB() {
// 	const client = createClient({
// 		url      : process.env.DATABASE_URL!,
// 		authToken: process.env.DATABASE_AUTH_TOKEN!,
// 	});
// 	return drizzle(client, {schema})
// }
//
// export const db = initDB();