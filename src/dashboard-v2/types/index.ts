/**
 * Dashboard V2 - Types centralisés
 * 
 * Types partagés pour le nouveau dashboard moderne.
 * Réutilise les types API existants pour compatibilité.
 */

// =====================
// Types de base
// =====================

export interface User {
  id: number;
  username: string;
  role: string;
  team_id?: number;
  team_name?: string;
  email?: string;
  display_name?: string;
}

export interface Ticket {
  id: number;
  ticket_id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  machine_id?: number;
  machine_name?: string;
  assigned_to?: number;
  assigned_name?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  due_date?: string;
}

export interface Machine {
  id: number;
  name: string;
  code?: string;
  location?: string;
  status: 'operational' | 'maintenance' | 'broken';
  last_maintenance?: string;
}

// =====================
// Types UI
// =====================

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
}

// =====================
// Types API Response
// =====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// =====================
// Types Config (from system_settings)
// =====================

export interface AppConfig {
  app_name: string;
  app_base_url: string;
  primary_color: string;
  secondary_color: string;
  ai_expert_name: string;
  ai_expert_avatar_key: string;
}
