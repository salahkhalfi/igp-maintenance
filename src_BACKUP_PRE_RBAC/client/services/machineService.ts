import { client, getAuthHeaders } from '../api';
import { Machine } from '../types';

// Types
interface CreateMachineRequest {
  machine_type: string;
  model: string;
  serial_number: string;
  location?: string;
}

interface UpdateMachineRequest {
  machine_type?: string;
  model?: string;
  serial_number?: string;
  location?: string;
  status?: 'operational' | 'maintenance' | 'broken' | 'offline';
}

// Service
export const machineService = {
  getAll: async (status?: 'operational' | 'maintenance' | 'broken' | 'offline'): Promise<{ machines: Machine[] }> => {
    const query = status ? { status } : undefined;
    
    const res = await client.api.machines.$get(
      { query },
      { headers: getAuthHeaders() }
    );

    if (!res.ok) {
      throw new Error('Failed to fetch machines');
    }
    return res.json();
  },

  getById: async (id: number): Promise<{ machine: Machine }> => {
    const res = await client.api.machines[':id'].$get(
      { param: { id: id.toString() } },
      { headers: getAuthHeaders() }
    );

    if (!res.ok) {
      throw new Error('Failed to fetch machine');
    }
    return res.json();
  },

  create: async (data: CreateMachineRequest): Promise<{ machine: Machine }> => {
    const res = await client.api.machines.$post(
      { json: data },
      { headers: getAuthHeaders() }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error((error as any).error || 'Failed to create machine');
    }
    return res.json();
  },

  update: async (id: number, data: UpdateMachineRequest): Promise<{ machine: Machine }> => {
    const res = await client.api.machines[':id'].$patch(
      { 
        param: { id: id.toString() },
        json: data
      },
      { headers: getAuthHeaders() }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error((error as any).error || 'Failed to update machine');
    }
    return res.json();
  },

  delete: async (id: number): Promise<void> => {
    const res = await client.api.machines[':id'].$delete(
      { param: { id: id.toString() } },
      { headers: getAuthHeaders() }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error((error as any).error || 'Failed to delete machine');
    }
  }
};
