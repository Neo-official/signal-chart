import { compare, hash } from 'bcryptjs';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import jwt from "jsonwebtoken";

export async function hashPassword(password: string): Promise<string> {
	return await hash(password, 12);
}

export async function verifyPassword(
	password: string,
	hashedPassword: string,
): Promise<boolean> {
	return await compare(password, hashedPassword);
}

export async function getUserByUsername(username: string) {
	const result = await db
	.select()
	.from(users)
	.where(eq(users.username, username))
	.limit(1);
	// const result = await db.query.users.findFirst() || []

	return result[0];
}

export async function checkTokenIsExpired(token: string) {
	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET || '');
		return false;
	}
	catch (error) {
		return true;
	}
}

export function generateToken(payload: any) {
	return jwt.sign(payload, process.env.JWT_SECRET || '', {expiresIn: '24h'});
}