export interface User {
    id: number;
    full_name: string;
    role: string;
    email: string;
    avatar_key?: string | null;
}

export interface Conversation {
    id: string;
    type: 'direct' | 'group';
    name: string | null;
    avatar_key?: string | null;
    last_message: string | null;
    last_message_time: string | null;
    unread_count: number;
    participant_count?: number;
    online_count?: number;
}

export interface Message {
    id: string;
    sender_id: number;
    sender_name: string;
    sender_avatar_key?: string | null;
    content: string;
    created_at: string;
    type: string;
    media_key?: string;
    transcription?: string;
    action_card?: ActionCard;
}

export interface ActionCard {
    id: string;
    status: 'open' | 'in_progress' | 'resolved' | 'cancelled';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    assignee_id?: number | null;
    created_by: number;
    updated_at: string;
}

export interface Participant {
    user_id: number;
    full_name: string;
    role: string;
    last_read_at: string;
    last_seen?: string | null;
    avatar_key?: string | null;
    active_in_conversation?: string | null; // Nom du groupe où l'utilisateur est actif
}
