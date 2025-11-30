import { Message, Conversation, User, SendMessageRequest } from '../types';

const API_URL = '/api';

export const messageService = {
  getPublicMessages: async (): Promise<{ messages: Message[] }> => {
    const response = await fetch(`${API_URL}/messages/public`);
    if (!response.ok) throw new Error('Failed to fetch public messages');
    return response.json();
  },

  getConversations: async (): Promise<{ conversations: Conversation[] }> => {
    const response = await fetch(`${API_URL}/messages/conversations`);
    if (!response.ok) throw new Error('Failed to fetch conversations');
    return response.json();
  },

  getPrivateMessages: async (contactId: number): Promise<{ messages: Message[] }> => {
    const response = await fetch(`${API_URL}/messages/private/${contactId}`);
    if (!response.ok) throw new Error('Failed to fetch private messages');
    return response.json();
  },

  getAvailableUsers: async (): Promise<{ users: User[] }> => {
    const response = await fetch(`${API_URL}/messages/available-users`);
    if (!response.ok) throw new Error('Failed to fetch available users');
    return response.json();
  },

  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await fetch(`${API_URL}/messages/unread-count`);
    if (!response.ok) throw new Error('Failed to fetch unread count');
    return response.json();
  },

  sendMessage: async (data: SendMessageRequest): Promise<void> => {
    const response = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send message');
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

    const response = await fetch(`${API_URL}/messages/audio`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send audio message');
    }
  },

  deleteMessage: async (messageId: number): Promise<void> => {
    const response = await fetch(`${API_URL}/messages/${messageId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete message');
    }
  },

  bulkDeleteMessages: async (messageIds: number[]): Promise<void> => {
    const response = await fetch(`${API_URL}/messages/bulk-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_ids: messageIds }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete messages');
    }
  }
};
