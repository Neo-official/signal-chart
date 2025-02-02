import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { db } from '@/db';

export async function getUserByUsername(username: string) {
	const result = await db
	.select()
	.from(users)
	.where(eq(users.username, username))
	.limit(1);
	// const result = await db.query.users.findFirst() || []

	return result[0];
}

