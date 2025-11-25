import { Database } from 'bun:sqlite';

const db = new Database(process.env.DATABASE_URL!);

const migrations = `
CREATE TABLE IF NOT EXISTS device_data (
	id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	device_id integer NOT NULL,
	vo real NOT NULL,
	io real NOT NULL,
	timestamp integer NOT NULL,
	created_at text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (device_id) REFERENCES devices(id) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS devices (
	id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	socket_id text NOT NULL,
	state text DEFAULT 'pending' NOT NULL,
	status text DEFAULT 'offline' NOT NULL,
	v_out real DEFAULT 100 NOT NULL,
	last_activity integer DEFAULT 0 NOT NULL,
	created_at text DEFAULT CURRENT_TIMESTAMP,
	updated_at text DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS devices_socket_id_unique ON devices (socket_id);

CREATE TABLE IF NOT EXISTS settings (
	id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	max_data_points integer DEFAULT 31557600 NOT NULL,
	max_data_send integer DEFAULT 300 NOT NULL,
	is_single_device integer DEFAULT 1 NOT NULL,
	online_timeout integer DEFAULT 10000 NOT NULL,
	idle_timeout integer DEFAULT 30000 NOT NULL,
	updated_at text DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO settings (id, max_data_points, max_data_send, is_single_device) 
VALUES (1, 31557600, 300, 1);

ALTER TABLE devices ADD COLUMN last_activity integer DEFAULT 0 NOT NULL;
ALTER TABLE settings ADD COLUMN online_timeout integer DEFAULT 10000 NOT NULL;
ALTER TABLE settings ADD COLUMN idle_timeout integer DEFAULT 30000 NOT NULL;
`;

db.exec(migrations);
console.log('Migration completed successfully!');
db.close();
