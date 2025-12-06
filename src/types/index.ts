// Types TypeScript pour l'application

export interface User {
  id: number;
  email: string;
  full_name: string; // Keep for backwards compatibility
  first_name: string;
  last_name: string;
  role: 'admin' | 'supervisor' | 'technician' | 'operator';
  created_at: string;
  updated_at: string;
}

export interface Machine {
  id: number;
  machine_type: string;
  model: string;
  serial_number: string;
  location: string;
  status: 'operational' | 'maintenance' | 'out_of_service';
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: number;
  ticket_id: string;
  title: string;
  description: string;
  machine_id: number;
  machine?: Machine;
  status: 'received' | 'diagnostic' | 'in_progress' | 'waiting_parts' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  reported_by: number;
  reporter?: User;
  assigned_to: number | null;
  assignee?: User;
  scheduled_date: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  media?: Media[];
  timeline?: TimelineEntry[];
}

export interface Media {
  id: number;
  ticket_id: number;
  file_key: string;
  file_name: string;
  file_type: string;
  file_size: number;
  url: string;
  uploaded_by: number;
  created_at: string;
}

export interface TimelineEntry {
  id: number;
  ticket_id: number;
  user_id: number;
  user?: User;
  action: string;
  old_status: string | null;
  new_status: string | null;
  comment: string | null;
  created_at: string;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  reporter_name: string;
  machine_id: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to?: number | null;
  scheduled_date?: string | null;
  created_at?: string; // Timestamp optionnel de l'appareil de l'utilisateur
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  status?: 'received' | 'diagnostic' | 'in_progress' | 'waiting_parts' | 'completed' | 'archived';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assigned_to?: number | null;
  scheduled_date?: string | null;
  comment?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'supervisor' | 'technician' | 'operator';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ChatGuest {
  id: number;
  email: string;
  full_name: string;
  company?: string;
  role: 'guest';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Bindings Cloudflare
export interface Bindings {
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
  JWT_SECRET?: string;
  CRON_SECRET?: string;
  TV_ACCESS_KEY?: string;
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
  PUSH_ENABLED?: string;
  ENVIRONMENT?: string; // 'production' | 'development' | 'staging'
  ASSETS: Fetcher;
}
