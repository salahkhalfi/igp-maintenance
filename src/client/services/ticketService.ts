import { Machine, CreateTicketRequest, MediaUploadResponse } from '../types';

const API_URL = '/api';

export const ticketService = {
  createTicket: async (data: CreateTicketRequest): Promise<{ ticket: { id: number } }> => {
    const response = await fetch(`${API_URL}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create ticket');
    }
    
    return response.json();
  },

  uploadMedia: async (ticketId: number, file: File): Promise<MediaUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('ticket_id', ticketId.toString());

    const response = await fetch(`${API_URL}/media/upload`, {
      method: 'POST',
      body: formData, // No Content-Type header, browser sets it with boundary
    });

    if (!response.ok) {
      throw new Error('Failed to upload media');
    }

    return response.json();
  },

  getMachines: async (): Promise<Machine[]> => {
    const response = await fetch(`${API_URL}/machines`);
    if (!response.ok) throw new Error('Failed to fetch machines');
    const data = await response.json();
    return Array.isArray(data.machines) ? data.machines : [];
  },

  getTechnicians: async (): Promise<{ id: number; first_name: string }[]> => {
    const response = await fetch(`${API_URL}/technicians`);
    if (!response.ok) throw new Error('Failed to fetch technicians');
    const data = await response.json();
    return Array.isArray(data.technicians) ? data.technicians : [];
  }
};
