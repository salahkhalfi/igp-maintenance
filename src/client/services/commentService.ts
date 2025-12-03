import { client, getAuthHeaders } from '../api';

interface CreateCommentRequest {
  ticket_id: number;
  user_name: string;
  user_role?: string;
  comment: string;
  created_at?: string;
}

// Service de gestion des commentaires (Version RPC + Zod)
export const commentService = {
  
  getAllByTicketId: async (ticketId: number): Promise<{ comments: any[] }> => {
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
    const res = await client.api.comments.$post(
      { json: data },
      { headers: getAuthHeaders() }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error((error as any).error || 'Failed to add comment');
    }
    return res.json();
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
