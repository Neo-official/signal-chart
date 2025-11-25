import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
	id       : integer('id').primaryKey({autoIncrement: true}),
	username : text('username').notNull().unique(),
	password : text('password').notNull(),
	token    : text('token'),
	createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const devices = sqliteTable('devices', {
	id          : integer('id').primaryKey({autoIncrement: true}),
	socketId    : text('socket_id').notNull().unique(),
	state       : text('state', { enum: ['ban', 'pending', 'active'] }).notNull().default('pending'),
	status      : text('status', { enum: ['online', 'idle', 'offline'] }).notNull().default('offline'),
	vOut        : real('v_out').notNull().default(100),
	lastActivity: integer('last_activity').notNull().default(0),
	createdAt   : text('created_at').default(sql`CURRENT_TIMESTAMP`),
	updatedAt   : text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const deviceData = sqliteTable('device_data', {
	id       : integer('id').primaryKey({autoIncrement: true}),
	deviceId : integer('device_id').notNull().references(() => devices.id, { onDelete: 'cascade' }),
	vo       : real('vo').notNull(),
	io       : real('io').notNull(),
	timestamp: integer('timestamp').notNull(),
	createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const settings = sqliteTable('settings', {
	id             : integer('id').primaryKey({autoIncrement: true}),
	maxDataPoints  : integer('max_data_points').notNull().default(31557600),
	maxDataSend    : integer('max_data_send').notNull().default(300),
	isSingleDevice : integer('is_single_device', { mode: 'boolean' }).notNull().default(true),
	onlineTimeout  : integer('online_timeout').notNull().default(10000),
	idleTimeout    : integer('idle_timeout').notNull().default(30000),
	defaultTimeRange: integer('default_time_range').notNull().default(300),
	updatedAt      : text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Device = typeof devices.$inferSelect;
export type NewDevice = typeof devices.$inferInsert;
export type DeviceData = typeof deviceData.$inferSelect;
export type NewDeviceData = typeof deviceData.$inferInsert;
export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
