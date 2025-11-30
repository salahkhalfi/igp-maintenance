import { User } from '../types';
import { client, getAuthHeaders } from '../api';

// Types for API Requests
interface CreateUserRequest {
  email: string;
  password?: string;
  first_name: string;
  last_name?: string;
  role: string;
}

interface UpdateUserRequest {
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}

interface ResetPasswordRequest {
  new_password: string;
}

// API Calls
export const userService = {
  getUsers: async (): Promise<User[]> => {
    const res = await client.api.users.team.$get(
      undefined,
      { headers: getAuthHeaders() }
    );
    
    if (!res.ok) {
      throw new Error('Failed to fetch users');
    }
    const data = await res.json();
    return Array.isArray(data.users) ? data.users : [];
  },

  createUser: async (user: CreateUserRequest): Promise<void> => {
    // Ensure explicit undefined if fields are missing (though required by interface)
    // Cast role to match enum expected by backend schema if needed, but string usually works if valid
    const res = await client.api.users.$post(
      { json: {
          email: user.email,
          password: user.password || '', // Password is required for creation in schema
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role as any
        } 
      },
      { headers: getAuthHeaders() }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error((error as any).error || 'Failed to create user');
    }
  },

  updateUser: async (id: number, user: UpdateUserRequest): Promise<void> => {
    const res = await client.api.users[':id'].$put(
      { 
        param: { id: id.toString() },
        json: {
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name || '', // Ensure empty string if undefined/null for clear update
          role: user.role as any,
          password: user.password
        }
      },
      { headers: getAuthHeaders() }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error((error as any).error || 'Failed to update user');
    }
  },

  deleteUser: async (id: number): Promise<void> => {
    const res = await client.api.users[':id'].$delete(
      { param: { id: id.toString() } },
      { headers: getAuthHeaders() }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error((error as any).error || 'Failed to delete user');
    }
  },

  resetPassword: async (id: number, req: ResetPasswordRequest): Promise<void> => {
    const res = await client.api.users[':id']['reset-password'].$post(
      { 
        param: { id: id.toString() },
        json: { new_password: req.new_password }
      },
      { headers: getAuthHeaders() }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error((error as any).error || 'Failed to reset password');
    }
  }
};
