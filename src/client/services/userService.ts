import { User } from '../types';

// Constants
const API_URL = '/api';

// Types for API Requests
interface CreateUserRequest {
  email: string;
  password?: string;
  first_name: string;
  last_name?: string;
  role: string;
}

interface UpdateUserRequest {
  email: string;
  first_name: string;
  last_name?: string;
  role: string;
}

interface ResetPasswordRequest {
  new_password: string;
}

// API Calls
export const userService = {
  getUsers: async (): Promise<User[]> => {
    const response = await fetch(`${API_URL}/users/team`);
    if (!response.ok) throw new Error('Failed to fetch users');
    const data = await response.json();
    return Array.isArray(data.users) ? data.users : [];
  },

  createUser: async (user: CreateUserRequest): Promise<void> => {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create user');
    }
  },

  updateUser: async (id: number, user: UpdateUserRequest): Promise<void> => {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update user');
    }
  },

  deleteUser: async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete user');
    }
  },

  resetPassword: async (id: number, req: ResetPasswordRequest): Promise<void> => {
    const response = await fetch(`${API_URL}/users/${id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reset password');
    }
  }
};
