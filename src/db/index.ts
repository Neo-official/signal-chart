import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import path from 'path';

const dbFile = process.env.DATABASE_URL || 'sqlite.db';
const dbPath = path.resolve(process.cwd(), dbFile);
const client = createClient({
	url: `file:${dbPath}`
});

export const db = drizzle(client as any, { schema } as any);