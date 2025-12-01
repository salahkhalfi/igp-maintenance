import { z } from 'zod';

export const createCommentSchema = z.object({
  ticket_id: z.coerce.number().int().positive("ID ticket invalide"),
  user_name: z.string().min(1, "Le nom de l'utilisateur est requis"),
  user_role: z.string().optional(),
  comment: z.string().min(1, "Le commentaire ne peut pas être vide"),
  created_at: z.string().optional()
});

export const ticketIdParamSchema = z.object({
  ticketId: z.coerce.number().int().positive("ID ticket invalide")
});

export const commentIdParamSchema = z.object({
  id: z.coerce.number().int().positive("ID commentaire invalide")
});
