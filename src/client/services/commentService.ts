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
    // Utilisation standard pour GET
    const res = await client.api.comments.ticket[':ticketId'].$get(
      { param: { ticketId: ticketId.toString() } },
      { headers: getAuthHeaders() }
    );

    if (!res.ok) {
      throw new Error('Failed to fetch comments');
    }
    return res.json();
  },

  create: async (data: CreateCommentRequest): Promise<{ comment: any }> => {
    console.log('[CLIENT] Sending comment via FETCH:', data);
    
    const token = getAuthToken() || '';
    console.log('[CLIENT] Using token length:', token.length);

    // Utilisation FETCH DIRECT pour contourner les potentiels bugs RPC/Typage
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
        throw new Error('Server returned invalid JSON: ' + text.substring(0, 50));
    }

    if (!response.ok) {
      console.error('[CLIENT] Comment failed:', result);
      throw new Error((result as any).error || result.details || 'Failed to add comment');
    }
    
    console.log('[CLIENT] Comment success:', result);
    return result;
  },

  delete: async (id: number): Promise<void> => {
    const res = await client.api.comments[':id'].$delete(
      { param: { id: id.toString() } },
      { headers: getAuthHeaders() }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error((error as any).error || 'Failed to delete comment');
    }
  }
};
