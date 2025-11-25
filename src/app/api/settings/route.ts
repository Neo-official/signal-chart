import { NextResponse } from 'next/server';
import { dbService } from '@/db/service';

export async function GET() {
	try {
		const settings = await dbService.getSettings();
		return NextResponse.json({ success: true, data: settings });
	} catch (error) {
		console.error('Error fetching settings:', error);
		return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
	}
}
