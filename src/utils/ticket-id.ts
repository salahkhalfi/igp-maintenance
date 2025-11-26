// Génération automatique des IDs de tickets
// Format simplifié: TYPE-YYYY-NNNN
// Exemple: CNC-2025-0001, FOUR-2025-0002

import type { D1Database } from '@cloudflare/workers-types';

/**
 * Abrège le type de machine pour l'ID du ticket
 * Convertit les noms longs en codes courts et lisibles
 * 
 * @param machineType - Type de machine complet
 * @returns string - Code abrégé en majuscules
 */
function getMachineTypeCode(machineType: string): string {
  const upperType = machineType.toUpperCase();
  
  // Mapping des types de machines vers leurs codes
  const typeMap: Record<string, string> = {
    'CNC': 'CNC',
    'DÉCOUPE': 'DEC',
    'DECOUPE': 'DEC',
    'FOUR': 'FOUR',
    'LAMINÉ': 'LAM',
    'LAMINE': 'LAM',
    'POLISSEUSE': 'POL',
    'THERMOS': 'THERMO',
    'WATERJET': 'WJ',
    'AUTRE': 'AUT'
  };
  
  return typeMap[upperType] || upperType.substring(0, 4).toUpperCase();
}

/**
 * Génère un ID de ticket unique au format TYPE-YYYY-NNNN
 * Utilise un compteur séquentiel basé sur le nombre de tickets créés dans l'année en cours
 * 
 * @param db - Instance de la base de données D1
 * @param machineType - Type de machine (ex: "CNC", "Four", "Polisseuse")
 * @returns Promise<string> - L'ID du ticket généré (ex: CNC-2025-0001)
 */
export async function generateTicketId(db: D1Database, machineType: string): Promise<string> {
  const year = new Date().getFullYear();
  const typeCode = getMachineTypeCode(machineType);
  
  // Compter le nombre de tickets créés cette année pour ce type de machine
  const result = await db.prepare(
    `SELECT COUNT(*) as count FROM tickets WHERE ticket_id LIKE ?`
  ).bind(`${typeCode}-${year}-%`).first() as { count: number } | null;
  
  const count = result?.count || 0;
  
  // Générer le numéro de séquence (commence à 1)
  const sequence = String(count + 1).padStart(4, '0');
  
  return `${typeCode}-${year}-${sequence}`;
}

/**
 * Valide le format d'un ID de ticket
 * Supporte tous les formats historiques et actuels:
 * - Format actuel: TYPE-YYYY-NNNN (ex: CNC-2025-0001)
 * - Format v2.9.3: IGP-YYYY-NNNN (ex: IGP-2025-0001)
 * - Format ancien: IGP-XXX-XXX-YYYYMMDD-NNN (ex: IGP-PDE-7500-20231025-001)
 * 
 * @param ticketId - L'ID du ticket à valider
 * @returns boolean - true si le format est valide
 */
export function isValidTicketId(ticketId: string): boolean {
  // Format actuel: TYPE-YYYY-NNNN (ex: CNC-2025-0001, FOUR-2025-0002)
  const currentPattern = /^[A-Z]{2,6}-\d{4}-\d{4,}$/;
  
  // Format v2.9.3: IGP-YYYY-NNNN (ex: IGP-2025-0001)
  const v293Pattern = /^IGP-\d{4}-\d{4}$/;
  
  // Format ancien: IGP-XXX-XXX-YYYYMMDD-NNN (ex: IGP-PDE-7500-20231025-001)
  const oldPattern = /^IGP-[A-Z0-9]+-[A-Z0-9]+-\d{8}-\d{3}$/;
  
  return currentPattern.test(ticketId) || v293Pattern.test(ticketId) || oldPattern.test(ticketId);
}
