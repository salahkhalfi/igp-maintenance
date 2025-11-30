import axios from 'axios';
import { CreateTicketRequest, TicketPriority, TicketStatus } from '../types';

// Types internes pour le service (si non définis dans types.ts)
export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  machine_id: number;
  machine_name?: string;
  created_by: number;
  created_by_name?: string;
  assigned_to?: number;
  assigned_to_name?: string;
  created_at: string;
  updated_at?: string;
  scheduled_date?: string;
}

export interface CreateTicketResponse {
  success: boolean;
  ticketId: number;
  message: string;
}

export interface TicketStats {
  total: number;
  open: number;
  critical: number;
  avg_resolution_time?: string;
}

/**
 * Service de gestion des tickets
 * Gère toutes les interactions API liées aux tickets de maintenance
 */

// Récupérer tous les tickets (avec filtres optionnels)
export const getTickets = async (filters?: { 
  status?: TicketStatus; 
  priority?: TicketPriority;
  assigned_to?: number;
  machine_id?: number; 
}): Promise<Ticket[]> => {
  try {
    // Construction de la query string
    const params = new URLSearchParams();
    if (filters) {
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.assigned_to) params.append('assigned_to', filters.assigned_to.toString());
      if (filters.machine_id) params.append('machine_id', filters.machine_id.toString());
    }

    const response = await axios.get(`/api/tickets?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des tickets:', error);
    throw error;
  }
};

// Récupérer un ticket spécifique par ID
export const getTicketDetails = async (ticketId: number): Promise<Ticket> => {
  try {
    const response = await axios.get(`/api/tickets/${ticketId}`);
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération du ticket ${ticketId}:`, error);
    throw error;
  }
};

// Créer un nouveau ticket
export const createTicket = async (data: CreateTicketRequest): Promise<CreateTicketResponse> => {
  try {
    const response = await axios.post('/api/tickets', data);
    return {
      success: true,
      ticketId: response.data.id,
      message: 'Ticket créé avec succès'
    };
  } catch (error) {
    console.error('Erreur lors de la création du ticket:', error);
    throw error;
  }
};

// Mettre à jour le statut d'un ticket
export const updateTicketStatus = async (ticketId: number, status: TicketStatus): Promise<void> => {
  try {
    await axios.patch(`/api/tickets/${ticketId}/status`, { status });
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du statut du ticket ${ticketId}:`, error);
    throw error;
  }
};

// Assigner un ticket à un technicien
export const assignTicket = async (ticketId: number, technicianId: number | null, scheduledDate?: string): Promise<void> => {
  try {
    await axios.post(`/api/tickets/${ticketId}/assign`, { 
      technician_id: technicianId,
      scheduled_date: scheduledDate
    });
  } catch (error) {
    console.error(`Erreur lors de l'assignation du ticket ${ticketId}:`, error);
    throw error;
  }
};

// Récupérer les statistiques globales
export const getTicketStats = async (): Promise<TicketStats> => {
  try {
    const response = await axios.get('/api/tickets/stats');
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    // Retourner des valeurs par défaut en cas d'erreur pour ne pas bloquer l'UI
    return { total: 0, open: 0, critical: 0 };
  }
};

// Téléverser un média pour un ticket
export const uploadTicketMedia = async (file: File, ticketId?: number): Promise<{ id: number, url: string, type: string }> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (ticketId) {
      formData.append('ticket_id', ticketId.toString());
    }

    const response = await axios.post('/api/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors du téléversement du média:', error);
    throw error;
  }
};

// Récupérer les machines (pour le formulaire de création)
export const getMachines = async (): Promise<Array<{ id: number; name: string; zone: string }>> => {
  try {
    const response = await axios.get('/api/machines');
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des machines:', error);
    return [];
  }
};

// Récupérer les techniciens (pour l'assignation)
export const getTechnicians = async (): Promise<Array<{ id: number; first_name: string; last_name: string }>> => {
  try {
    const response = await axios.get('/api/users?role=technician'); // Ou endpoint spécifique
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des techniciens:', error);
    return [];
  }
};
