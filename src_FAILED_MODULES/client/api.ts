import { hc } from 'hono/client';
import type { AppType } from '../types/rpc';

// Création du client RPC typé
// L'URL de base est '/' car le client est servi par le même domaine que l'API
export const client = hc<AppType>('/');

// Helper pour obtenir le token d'authentification
export const getAuthToken = () => localStorage.getItem('auth_token');

// Helper pour les headers avec auth
export const getAuthHeaders = () => ({
  Authorization: `Bearer ${getAuthToken()}`
});
