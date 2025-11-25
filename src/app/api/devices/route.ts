import { NextResponse } from 'next/server';
import { dbService } from '@/db/service';

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const activeOnly = searchParams.get('active') === 'true';
		
		const settings = await dbService.getSettings();
		const devices = await dbService.getAllDevicesWithData(settings.maxDataSend, activeOnly);
		
		return NextResponse.json({ success: true, data: devices });
	} catch (error) {
		console.error('Error fetching devices:', error);
		return NextResponse.json({ success: false, error: 'Failed to fetch devices' }, { status: 500 });
	}
}
