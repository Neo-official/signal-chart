// Security utilities

export function sanitizeInput(input: string, maxLength: number = 255): string {
	return input.trim().slice(0, maxLength);
}

export function validateSocketId(socketId: string): boolean {
	if (!socketId) return false;
	if (socketId.length > 255) return false;
	// Allow alphanumeric, hyphens, and underscores
	return /^[a-zA-Z0-9_-]+$/.test(socketId);
}

export function validateNumber(value: any, min?: number, max?: number): boolean {
	return Number.isFinite(value) && (min === undefined || value >= min) && (max === undefined || value <= max) || false;

}

export function sanitizeDeviceState(state: string): 'ban' | 'pending' | 'active' {
	const validStates = ['ban', 'pending', 'active'] as const;
	return validStates.includes(state as any) ? (state as any) : 'pending';
}

export function sanitizeDeviceStatus(status: string): 'online' | 'offline' {
	return status === 'online' ? 'online' : 'offline';
}

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
	// Simple in-memory rate limiter
	const now = Date.now();
	const rateLimitMap = (global as any).__rateLimit || ((global as any).__rateLimit = new Map());

	const record = rateLimitMap.get(key) || {count: 0, resetTime: now + windowMs};

	if (now > record.resetTime) {
		record.count = 1;
		record.resetTime = now + windowMs;
	}
	else {
		record.count++;
	}

	rateLimitMap.set(key, record);

	// Cleanup old entries
	if (rateLimitMap.size > 10000) {
		for (const [k, v] of rateLimitMap.entries()) {
			if (now > v.resetTime) rateLimitMap.delete(k);
		}
	}

	return record.count <= limit;
}
