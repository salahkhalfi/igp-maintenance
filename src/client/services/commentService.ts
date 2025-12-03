import { client, getAuthHeaders, getAuthToken } from '../api';

interface CreateCommentRequest {
  ticket_id: number;
  user_name: string;
  user_role?: string;
  comment: string;
  created_at?: string;
}

// Service de gestion des commentaires (Version Fetch Directe pour Diagnostic)
export const commentService = {
  
  getAllByTicketId: async (ticketId: number): Promise<{ comments: any[] }> => {
    const token = getAuthToken() || '';
    // Use FETCH DIRECTLY to avoid RPC issues
    const response = await fetch(`/api/comments/ticket/${ticketId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('[CLIENT] Failed to fetch comments:', response.status);
      throw new Error('Failed to fetch comments');
    }
    return response.json();
  },

  create: async (data: CreateCommentRequest): Promise<{ comment: any }> => {
    console.log('[CLIENT] Sending comment via FETCH:', data);
    
    const token = getAuthToken() || '';

    const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    });

    let result;
    const text = await response.text();
    try {
        result = text ? JSON.parse(text) : {};
    } catch (e) {
        console.error('[CLIENT] Failed to parse response:', text);
        throw new Error('Server returned invalid JSON');
    }

    if (!response.ok) {
      console.error('[CLIENT] Comment failed:', result);
      throw new Error((result as any).error || result.details || 'Failed to add comment');
    }
    
    console.log('[CLIENT] Comment success:', result);
    return result;
  },

  delete: async (id: number): Promise<void> => {
    const token = getAuthToken() || '';
    const response = await fetch(`/api/comments/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error((error as any).error || 'Failed to delete comment');
    }
  }
};
