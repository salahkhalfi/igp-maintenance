import { Message, Conversation, User, SendMessageRequest } from '../types';
import { client, getAuthHeaders, getAuthToken } from '../api';

const API_URL = '/api';

export const messageService = {
  getPublicMessages: async (): Promise<{ messages: Message[] }> => {
    const res = await client.api.messages.public.$get(
      { query: { page: '1', limit: '50' } },
      { headers: getAuthHeaders() }
    );
    
    if (!res.ok) {
      throw new Error('Failed to fetch public messages');
    }
    return res.json();
  },

  getConversations: async (): Promise<{ conversations: Conversation[] }> => {
    const res = await client.api.messages.conversations.$get(
      undefined,
      { headers: getAuthHeaders() }
    );

    if (!res.ok) {
      throw new Error('Failed to fetch conversations');
    }
    return res.json();
  },

  getPrivateMessages: async (contactId: number): Promise<{ messages: Message[] }> => {
    const res = await client.api.messages.private[':contactId'].$get(
      { param: { contactId: contactId.toString() } },
      { headers: getAuthHeaders() }
    );

    if (!res.ok) {
      throw new Error('Failed to fetch private messages');
    }
    return res.json();
  },

  getAvailableUsers: async (): Promise<{ users: User[] }> => {
    const res = await client.api.messages['available-users'].$get(
      undefined,
      { headers: getAuthHeaders() }
    );

    if (!res.ok) {
      throw new Error('Failed to fetch available users');
    }
    return res.json();
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const res = await client.api.messages['unread-count'].$get(
      undefined,
      { headers: getAuthHeaders() }
    );

    if (!res.ok) {
      throw new Error('Failed to fetch unread count');
    }
    return res.json();
  },

  sendMessage: async (data: SendMessageRequest): Promise<void> => {
    const res = await client.api.messages.$post(
      { json: data },
      { headers: getAuthHeaders() }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error((error as any).error || 'Failed to send message');
    }
  },

  sendAudioMessage: async (data: { message_type: string, recipient_id?: number, duration: number, audio: Blob }): Promise<void> => {
    const formData = new FormData();
    const extension = data.audio.type.includes('mp4') ? 'mp4' : data.audio.type.includes('ogg') ? 'ogg' : 'webm';
    formData.append('audio', data.audio, `audio-message.${extension}`);
    formData.append('message_type', data.message_type);
    formData.append('duration', data.duration.toString());
    if (data.recipient_id) {
      formData.append('recipient_id', data.recipient_id.toString());
    }

    const authToken = getAuthToken();
    const response = await fetch(`${API_URL}/messages/audio`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send audio message');
    }
  },

  deleteMessage: async (messageId: number): Promise<void> => {
    const res = await client.api.messages[':messageId'].$delete(
      { param: { messageId: messageId.toString() } },
      { headers: getAuthHeaders() }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error((error as any).error || 'Failed to delete message');
    }
  },

  bulkDeleteMessages: async (messageIds: number[]): Promise<void> => {
    const res = await client.api.messages['bulk-delete'].$post(
      { json: { message_ids: messageIds } },
      { headers: getAuthHeaders() }
    );

    if (!res.ok) {
      const error = await res.json();
      throw new Error((error as any).error || 'Failed to delete messages');
    }
  }
};
