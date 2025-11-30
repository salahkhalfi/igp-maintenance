import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
  rememberMe: z.boolean().optional()
});

export const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  first_name: z.string().min(2, "Prénom trop court"),
  last_name: z.string().optional(),
  role: z.string().min(1, "Rôle requis") // On laisse la validation stricte du rôle à la logique métier ou DB si besoin, ou on utilise un enum partagé
});
