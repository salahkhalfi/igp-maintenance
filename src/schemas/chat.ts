import { z } from 'zod';

// Schémas de validation pour les routes chat (v2)

// Paramètres d'ID
export const conversationIdParamSchema = z.object({
  id: z.string().min(1, "ID conversation requis")
});

export const messageIdParamSchema = z.object({
  id: z.string().min(1, "ID conversation requis"),
  messageId: z.string().min(1, "ID message requis")
});

export const userIdParamSchema = z.object({
  id: z.string().min(1, "ID conversation requis"),
  userId: z.coerce.number().int().positive("ID utilisateur invalide")
});

export const guestIdParamSchema = z.object({
  id: z.coerce.number().int().positive("ID invité invalide")
});

// Création de conversation
export const createConversationSchema = z.object({
  name: z.string().max(100, "Nom trop long").optional(),
  type: z.enum(['private', 'group']).default('private'),
  participant_ids: z.array(z.number().int().positive()).optional()
});

// Mise à jour de conversation
export const updateConversationSchema = z.object({
  name: z.string().max(100, "Nom trop long").optional()
});

// Envoi de message
export const sendMessageSchema = z.object({
  conversation_id: z.string().min(1, "ID conversation requis"),
  content: z.string().max(10000, "Message trop long").optional(),
  type: z.enum(['text', 'audio', 'image', 'file', 'action_card']).default('text'),
  reply_to: z.string().optional()
});

// Ajout de participant
export const addParticipantSchema = z.object({
  user_id: z.number().int().positive("ID utilisateur invalide")
});

// Création d'invité
export const createGuestSchema = z.object({
  email: z.string().email("Email invalide"),
  name: z.string().min(2, "Nom trop court").max(100, "Nom trop long"),
  password: z.string().min(6, "Mot de passe trop court").max(100)
});

// Mise à jour transcription
export const updateTranscriptionSchema = z.object({
  transcription: z.string().max(10000, "Transcription trop longue")
});

// Action card
export const createActionCardSchema = z.object({
  card_type: z.enum(['ticket_created', 'ticket_updated', 'status_change', 'assignment', 'mention', 'custom']),
  title: z.string().max(200, "Titre trop long"),
  description: z.string().max(1000, "Description trop longue").optional(),
  ticket_id: z.number().int().positive().optional(),
  metadata: z.record(z.unknown()).optional()
});
