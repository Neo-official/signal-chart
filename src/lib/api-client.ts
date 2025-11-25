import axios from 'axios';
import { DeviceType, Settings } from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const client = {
  devices: {
    getAll: async (active?: boolean) => {
      const { data } = await api.get<{ success: boolean; data: DeviceType[] }>(
        `/devices${active ? '?active=true' : ''}`
      );
      return data.data;
    },
    get: async (id: number) => {
      const { data } = await api.get<{ success: boolean; data: DeviceType }>(`/devices/${id}`);
      return data.data;
    },
    update: async (id: number, updates: Partial<DeviceType>) => {
      const { data } = await api.put<{ success: boolean; data: DeviceType }>(`/devices/${id}`, updates);
      return data.data;
    },
  },
  settings: {
    get: async () => {
      const { data } = await api.get<{ success: boolean; data: Settings }>('/settings');
      return data.data;
    },
    update: async (updates: Partial<Settings>) => {
      const { data } = await api.put<{ success: boolean; data: Settings }>('/settings', updates);
      return data.data;
    },
  },
};
