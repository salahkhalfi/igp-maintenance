import { z } from 'zod';

const LIMITS = {
  NAME_MIN: 2,
  NAME_MAX: 50,
  EMAIL_MAX: 100,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 100,
  AI_CONTEXT_MAX: 500 // Max characters for AI context field
};

const validRoles = [
  'admin', 'director', 'supervisor', 'coordinator', 'planner',
  'senior_technician', 'technician', 'team_leader', 'furnace_operator',
  'operator', 'safety_officer', 'quality_inspector', 'storekeeper', 'viewer'
] as const;

export const createUserSchema = z.object({
  email: z.string().email("Format email invalide").max(LIMITS.EMAIL_MAX, "Email trop long"),
  password: z.string().min(LIMITS.PASSWORD_MIN, `Le mot de passe doit contenir au moins ${LIMITS.PASSWORD_MIN} caractères`).max(LIMITS.PASSWORD_MAX, "Mot de passe trop long"),
  first_name: z.string().min(LIMITS.NAME_MIN, "Prénom trop court").max(LIMITS.NAME_MAX, "Prénom trop long"),
  last_name: z.string().max(LIMITS.NAME_MAX, "Nom trop long").optional().or(z.literal('')),
  role: z.enum(validRoles, { errorMap: () => ({ message: "Rôle invalide" }) }),
  ai_context: z.string().max(LIMITS.AI_CONTEXT_MAX, "Informations trop longues").optional().nullable().or(z.literal(''))
});

export const updateUserSchema = z.object({
  email: z.string().email("Format email invalide").max(LIMITS.EMAIL_MAX).optional(),
  password: z.string().min(LIMITS.PASSWORD_MIN).max(LIMITS.PASSWORD_MAX).optional(),
  first_name: z.string().min(LIMITS.NAME_MIN).max(LIMITS.NAME_MAX).optional(),
  last_name: z.string().max(LIMITS.NAME_MAX).optional().or(z.literal('')),
  role: z.enum(validRoles).optional(),
  ai_context: z.string().max(LIMITS.AI_CONTEXT_MAX).optional().nullable().or(z.literal(''))
});

export const resetPasswordSchema = z.object({
  new_password: z.string().min(LIMITS.PASSWORD_MIN, `Le mot de passe doit contenir au moins ${LIMITS.PASSWORD_MIN} caractères`).max(LIMITS.PASSWORD_MAX)
});

export const userIdParamSchema = z.object({
  id: z.coerce.number().int().positive("ID utilisateur invalide")
});
