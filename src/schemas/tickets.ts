import { z } from 'zod';

export const createTicketSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères").max(200, "Le titre est trop long"),
  description: z.string().max(2000, "La description est trop longue").optional().default(""),
  reporter_name: z.string().min(1, "Le nom du rapporteur est requis"),
  machine_id: z.coerce.number().int().positive("ID machine invalide"),
  priority: z.enum(['low', 'medium', 'high', 'critical'], {
    errorMap: () => ({ message: "Priorité invalide (low, medium, high, critical)" })
  }),
  assigned_to: z.coerce.number().int().optional().nullable(),
  scheduled_date: z.string().optional().nullable(),
  created_at: z.string().optional()
});

export const updateTicketSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assigned_to: z.coerce.number().int().optional().nullable(),
  scheduled_date: z.string().optional().nullable(),
  comment: z.string().optional()
});

export const ticketIdParamSchema = z.object({
  id: z.coerce.number().int().positive("ID ticket invalide")
});

export const getTicketsQuerySchema = z.object({
  status: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional()
});
