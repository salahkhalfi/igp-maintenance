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
  full_name?: string; // Souvent calculé côté backend ou frontend
  role: UserRole;
  last_login?: string;
  created_at?: string;
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
