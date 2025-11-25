'use server'

import { dbService } from '@/db/service';

export async function getActiveDevices() {
  try {
    const settings = await dbService.getSettings();
    const devices = await dbService.getAllDevicesWithData(settings.maxDataSend, true);
    return { success: true, data: devices };
  } catch (error) {
    console.error('Error fetching devices:', error);
    return { success: false, error: 'Failed to fetch devices' };
  }
}

export async function getAllDevices() {
  try {
    const settings = await dbService.getSettings();
    const devices = await dbService.getAllDevicesWithData(settings.maxDataSend, false);
    return { success: true, data: devices };
  } catch (error) {
    console.error('Error fetching devices:', error);
    return { success: false, error: 'Failed to fetch devices' };
  }
}

export async function getSettings() {
  try {
    const settings = await dbService.getSettings();
    return { success: true, data: settings };
  } catch (error) {
    console.error('Error fetching settings:', error);
    return { success: false, error: 'Failed to fetch settings' };
  }
}
