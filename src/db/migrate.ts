// src/db/migrate.ts
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './index';

// This will automatically run needed migrations on the database
migrate(db, {migrationsFolder: './drizzle'});
