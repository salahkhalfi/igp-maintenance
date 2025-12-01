// Utilitaire pour la gestion des fuseaux horaires

import type { Bindings } from '../types';

/**
 * Récupère le décalage horaire depuis les paramètres système
 * @param db - Instance de base de données D1
 * @returns Décalage horaire en heures (défaut: 0 si non configuré)
 */
export async function getTimezoneOffset(db: D1Database): Promise<number> {
  try {
    const result = await db.prepare(`
      SELECT setting_value FROM system_settings WHERE setting_key = 'timezone_offset_hours'
    `).first<{ setting_value: string }>();
    
    return result ? parseInt(result.setting_value) : 0;
  } catch (error) {
    console.error('Erreur récupération timezone_offset_hours:', error);
    return 0; // Défaut: UTC si erreur
  }
}

/**
 * Convertit une date UTC en heure locale basée sur le décalage système
 * @param utcDate - Date en UTC (string ou Date)
 * @param timezoneOffset - Décalage horaire en heures
 * @returns Date formatée en heure locale (YYYY-MM-DD HH:MM:SS)
 */
export function convertToLocalTime(utcDate: string | Date, timezoneOffset: number): string {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  const localDate = new Date(date.getTime() + (timezoneOffset * 60 * 60 * 1000));
  return localDate.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Récupère la date/heure actuelle en heure locale
 * @param db - Instance de base de données D1
 * @returns Date/heure locale formatée (YYYY-MM-DD HH:MM:SS)
 */
export async function getCurrentLocalTime(db: D1Database): Promise<string> {
  const offset = await getTimezoneOffset(db);
  return convertToLocalTime(new Date(), offset);
}
