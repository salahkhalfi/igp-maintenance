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
