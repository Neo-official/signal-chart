import { NextResponse } from 'next/server';
import { generateToken, getUserByUsername, verifyPassword } from '@/lib/auth';
import { db } from '@/db';
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
	try {
		const {username, password} = await request.json();
		// console.log('Username:', username)
		// Get user from database
		const user = await getUserByUsername(username);
		// console.log('User:', user)

		if (!user) {
			return NextResponse.json(
				{error: 'Invalid credentials'},
				{status: 401},
			);
		}

		// Verify password
		const isValid = await verifyPassword(password, user.password);

		if (!isValid) {
			return NextResponse.json(
				{error: 'Invalid credentials'},
				{status: 401},
			);
		}

		// Create JWT token
		const token = generateToken({
			userId  : user.id,
			username: user.username,
		});
		// console.log('Token:', token)
		await db
		.update(users)
		.set({token})
		.where(eq(users.id, user.id))

		return NextResponse.json({token});
	}
	catch (error) {
		console.error('Login error:', error);
		return NextResponse.json(
			{error: 'Internal server error'},
			{status: 500},
		);
	}
}
