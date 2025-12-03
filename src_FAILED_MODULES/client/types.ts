export type UserRole = 
  | 'admin' 
  | 'director' 
  | 'supervisor' 
  | 'coordinator' 
  | 'planner' 
  | 'senior_technician' 
  | 'technician' 
  | 'team_leader' 
  | 'furnace_operator' 
  | 'operator' 
  | 'safety_officer' 
  | 'quality_inspector' 
  | 'storekeeper' 
  | 'viewer';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name?: string;
  full_name?: string;
  role: UserRole;
  last_login?: string;
  created_at?: string;
}

export interface Machine {
  id: number;
  machine_type: string;
  model: string;
  location: string;
  zone: string;
}

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketStatus = 'received' | 'diagnostic' | 'in_progress' | 'waiting_parts' | 'completed' | 'archived';

export interface CreateTicketRequest {
  title: string;
  description: string;
  machine_id: number;
  priority: TicketPriority;
  reporter_name: string;
  assigned_to?: number;
  scheduled_date?: string;
  created_at: string;
}

export interface MediaUploadResponse {
  success: boolean;
  url: string;
  type: string;
}

export type RoleVariant = 'blue' | 'green';

// Modal Types
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: NotificationType;
  title?: string;
  message: string;
}

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

export interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title?: string;
  message?: string;
  placeholder?: string;
  inputType?: 'text' | 'password' | 'email';
  defaultValue?: string;
}

// Messaging Types
export type MessageType = 'public' | 'private';

export interface Message {
  id: number;
  sender_id: number;
  sender_name: string;
  sender_role: UserRole;
  recipient_id?: number;
  content?: string;
  message_type: MessageType;
  audio_file_key?: string;
  audio_duration?: number;
  created_at: string;
  is_read?: boolean;
}

export interface Conversation {
  contact_id: number;
  contact_name: string;
  contact_role: UserRole;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export interface SendMessageRequest {
  message_type: MessageType;
  content?: string;
  recipient_id?: number;
}

export interface SendAudioRequest {
  message_type: MessageType;
  recipient_id?: number;
  duration: number;
  audio: Blob;
}
