import { compare, hash } from "bcryptjs";
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

export function checkTokenIsExpired(token: string): boolean {
	const JWT_SECRET = process.env.JWT_SECRET || '';
	if (!JWT_SECRET) {
		throw new Error('JWT_SECRET is not defined in environment variables');
	}

	try {
		const decoded = verifyToken(token, JWT_SECRET);

		// Check if token has expired
		if (decoded.exp) {
			const currentTimestamp = Math.floor(Date.now() / 1000);
			return decoded.exp < currentTimestamp;
		}

		return false;
	}
	catch (error) {
		// Token is invalid or expired
		return true;
	}
}

export function checkTokenIsExpiredClient(token: string, JWT_SECRET: string): boolean {
	if (!token) return true;
	try {
		console.log('token', verify(token, ''))
		const decoded = verifyToken(token, JWT_SECRET);
		console.log('decoded', decoded)
		if (decoded.exp) {
			const currentTimestamp = Math.floor(Date.now() / 1000);
			return decoded.exp < currentTimestamp;
		}
		return true;
	}
	catch (error) {
		return false;
	}
}

export function verifyToken(token: string, JWT_SECRET: string): JwtPayload {
	try {
		return verify(token, JWT_SECRET) as JwtPayload;
	}
	catch (error) {
		throw new Error('Invalid token');
	}
}

export function generateToken(payload: any) {
	return sign(payload, process.env.JWT_SECRET || '', {expiresIn: '24h'});
}