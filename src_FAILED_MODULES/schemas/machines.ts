import { z } from 'zod';

export const machineIdParamSchema = z.object({
  id: z.coerce.number().int().positive("ID machine invalide")
});

export const getMachinesQuerySchema = z.object({
  status: z.enum(['operational', 'maintenance', 'broken', 'offline']).optional()
});

export const createMachineSchema = z.object({
  machine_type: z.string().min(2, "Type trop court").max(100, "Type trop long"),
  model: z.string().max(100, "Modèle trop long").optional().nullable(),
  serial_number: z.string().max(50, "Numéro de série trop long").optional().nullable(),
  location: z.string().max(100, "Localisation trop longue").optional().nullable()
});

export const updateMachineSchema = z.object({
  machine_type: z.string().min(2).max(100).optional(),
  model: z.string().max(100).optional().nullable(),
  serial_number: z.string().max(50).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  status: z.enum(['operational', 'maintenance', 'broken', 'offline']).optional()
});
