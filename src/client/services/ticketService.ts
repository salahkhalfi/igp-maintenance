import { client, getAuthHeaders, getAuthToken } from '../api';
import { Ticket, CreateTicketRequest, TicketStatus, User } from '../types';

// --- Named Exports for Components ---

export const getTicketDetails = async (id: number): Promise<Ticket> => {
  const res = await client.api.tickets[':id'].$get(
    { param: { id: id.toString() } },
    { headers: getAuthHeaders() }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch ticket details');
  }
  const data = await res.json();
  return data.ticket;
};

export const getTickets = async (status?: TicketStatus, priority?: string): Promise<Ticket[]> => {
  const query: any = {};
  if (status) query.status = status;
  if (priority) query.priority = priority;

  const res = await client.api.tickets.$get(
    { query },
    { headers: getAuthHeaders() }
  );
  
  if (!res.ok) {
    throw new Error('Failed to fetch tickets');
  }
  const data = await res.json();
  return data.tickets;
};

export const createTicket = async (ticketData: CreateTicketRequest): Promise<Ticket> => {
  const res = await client.api.tickets.$post(
    { json: ticketData },
    { headers: getAuthHeaders() }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error((error as any).error || 'Failed to create ticket');
  }
  const data = await res.json();
  return data.ticket;
};

export const updateTicketStatus = async (id: number, status: TicketStatus): Promise<Ticket> => {
  const res = await client.api.tickets[':id'].$patch(
    { 
      param: { id: id.toString() },
      json: { status }
    },
    { headers: getAuthHeaders() }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error((error as any).error || 'Failed to update status');
  }
  const data = await res.json();
  return data.ticket;
};

export const assignTicket = async (id: number, techId: number | null): Promise<Ticket> => {
  const res = await client.api.tickets[':id'].$patch(
    { 
      param: { id: id.toString() },
      json: { assigned_to: techId }
    },
    { headers: getAuthHeaders() }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error((error as any).error || 'Failed to assign ticket');
  }
  const data = await res.json();
  return data.ticket;
};

export const getTechnicians = async (): Promise<User[]> => {
  // We fetch all users and filter for technical roles
  // Ideally this should be a specific endpoint or filter param in getUsers
  const res = await client.api.users.team.$get(
    undefined,
    { headers: getAuthHeaders() }
  );
  
  if (!res.ok) {
    throw new Error('Failed to fetch users');
  }
  const data = await res.json();
  const users = Array.isArray(data.users) ? data.users : [];
  
  // Filter for technicians, supervisors, admins
  return users.filter(u => 
    ['technician', 'senior_technician', 'supervisor', 'admin', 'team_leader'].includes(u.role)
  );
};

export const getMachines = async (): Promise<any[]> => {
  const res = await client.api.machines.$get(
    { query: {} },
    { headers: getAuthHeaders() }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch machines');
  }
  const data = await res.json();
  return data.machines;
};

export const uploadTicketMedia = async (ticketId: number, file: Blob): Promise<{ media: any }> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('ticket_id', ticketId.toString());

  const token = getAuthToken();
  // Using direct fetch for media upload as it's not yet migrated to RPC/Drizzle
  const response = await fetch('/api/media/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error((error as any).error || 'Failed to upload media');
  }
  return response.json();
};

// Default export object for compatibility if needed elsewhere
export const ticketService = {
  getAll: getTickets,
  getById: getTicketDetails,
  create: createTicket,
  updateStatus: updateTicketStatus,
  assign: assignTicket,
  getTechnicians,
  getMachines,
  uploadMedia: uploadTicketMedia
};
