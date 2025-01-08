import { compare, hash } from 'bcryptjs';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { JwtPayload, sign, verify } from "jsonwebtoken";

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

export async function checkTokenIsExpired(token: string): Promise<boolean> {
	if (!process.env.JWT_SECRET) {
		throw new Error('JWT_SECRET is not defined in environment variables');
	}

	try {
		const decoded = verify(token, process.env.JWT_SECRET) as JwtPayload;

		// Check if token has expired
		if (decoded.exp) {
			const currentTimestamp = Math.floor(Date.now() / 1000);
			return decoded.exp < currentTimestamp;
		}

		return false;
	} catch (error) {
		// Token is invalid or expired
		return true;
	}
}

export function generateToken(payload: any) {
	return sign(payload, process.env.JWT_SECRET || '', {expiresIn: '24h'});
}