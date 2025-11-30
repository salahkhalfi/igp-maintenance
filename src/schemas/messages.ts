import { z } from 'zod';

export const sendMessageSchema = z.object({
  message_type: z.enum(['public', 'private'], {
    errorMap: () => ({ message: "Le type de message doit être 'public' ou 'private'" })
  }),
  recipient_id: z.coerce.number().int().optional().nullable(),
  content: z.string().min(1, "Le contenu du message est requis").max(2000, "Le message est trop long")
}).refine((data) => {
  if (data.message_type === 'private' && !data.recipient_id) {
    return false;
  }
  return true;
}, {
  message: "Le destinataire est requis pour un message privé",
  path: ["recipient_id"]
});

export const getMessagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

export const contactIdParamSchema = z.object({
  contactId: z.coerce.number().int().positive()
});

export const messageIdParamSchema = z.object({
  messageId: z.coerce.number().int().positive()
});

export const bulkDeleteMessagesSchema = z.object({
  message_ids: z.array(z.coerce.number().int()).min(1, "Au moins un ID de message est requis").max(100, "Maximum 100 messages par suppression")
});
