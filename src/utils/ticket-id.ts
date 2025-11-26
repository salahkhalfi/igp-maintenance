// Génération automatique des IDs de tickets
// Format simplifié: IGP-YYYY-NNNN
// Exemple: IGP-2024-0001

import type { D1Database } from '@cloudflare/workers-types';

/**
 * Génère un ID de ticket unique au format IGP-YYYY-NNNN
 * Utilise un compteur séquentiel basé sur le nombre de tickets créés dans l'année en cours
 * 
 * @param db - Instance de la base de données D1
 * @returns Promise<string> - L'ID du ticket généré (ex: IGP-2024-0001)
 */
export async function generateTicketId(db: D1Database): Promise<string> {
  const year = new Date().getFullYear();
  
  // Compter le nombre de tickets créés cette année
  // Utilise LIKE pour matcher le format IGP-YYYY-% (compatible avec anciens et nouveaux formats)
  const result = await db.prepare(
    `SELECT COUNT(*) as count FROM tickets WHERE ticket_id LIKE ?`
  ).bind(`IGP-${year}-%`).first() as { count: number } | null;
  
  const count = result?.count || 0;
  
  // Générer le numéro de séquence (commence à 1)
  const sequence = String(count + 1).padStart(4, '0');
  
  return `IGP-${year}-${sequence}`;
}

/**
 * Valide le format d'un ID de ticket
 * Supporte à la fois l'ancien format (IGP-XXX-XXX-YYYYMMDD-NNN) et le nouveau (IGP-YYYY-NNNN)
 * 
 * @param ticketId - L'ID du ticket à valider
 * @returns boolean - true si le format est valide
 */
export function isValidTicketId(ticketId: string): boolean {
  // Nouveau format: IGP-YYYY-NNNN (ex: IGP-2024-0001)
  const newPattern = /^IGP-\d{4}-\d{4}$/;
  
  // Ancien format: IGP-XXX-XXX-YYYYMMDD-NNN (ex: IGP-PDE-7500-20231025-001)
  const oldPattern = /^IGP-[A-Z0-9]+-[A-Z0-9]+-\d{8}-\d{3}$/;
  
  return newPattern.test(ticketId) || oldPattern.test(ticketId);
}
