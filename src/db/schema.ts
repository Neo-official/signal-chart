import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
	id       : integer('id').primaryKey({autoIncrement: true}),
	username : text('username').notNull().unique(),
	password : text('password').notNull(),
	token    : text('token'),
	createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
