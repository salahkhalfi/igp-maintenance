// Génération automatique des IDs de tickets
// Format simplifié: TYPE-MMYY-NNNN
// Exemple: CNC-1125-0001 (Novembre 2025), FOUR-0125-0042 (Janvier 2025)

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
  
  // Génère un code court à partir du type (3 premières lettres)
  // Ex: "Camion" -> "CAM", "Ordinateur" -> "ORD", "Polisseuse" -> "POL"
  return upperType.substring(0, 3).toUpperCase();
}

/**
 * Génère un ID de ticket unique au format TYPE-MMYY-NNNN
 * Utilise un compteur séquentiel basé sur le nombre de tickets créés dans le mois/année en cours
 * 
 * @param db - Instance de la base de données D1
 * @param machineType - Type de machine (ex: "CNC", "Four", "Polisseuse")
 * @returns Promise<string> - L'ID du ticket généré (ex: CNC-1125-0001 pour Nov 2025)
 */
export async function generateTicketId(db: D1Database, machineType: string): Promise<string> {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0'); // 01-12
  const year = String(now.getFullYear()).slice(-2); // 25 pour 2025
  const mmyy = `${month}${year}`; // Ex: 1125 pour Novembre 2025
  
  const typeCode = getMachineTypeCode(machineType);
  
  // Compter le nombre de tickets créés ce mois pour ce type de machine
  const result = await db.prepare(
    `SELECT COUNT(*) as count FROM tickets WHERE ticket_id LIKE ?`
  ).bind(`${typeCode}-${mmyy}-%`).first() as { count: number } | null;
  
  const count = result?.count || 0;
  
  // Générer le numéro de séquence (commence à 1)
  const sequence = String(count + 1).padStart(4, '0');
  
  return `${typeCode}-${mmyy}-${sequence}`;
}

/**
 * Valide le format d'un ID de ticket
 * Supporte tous les formats historiques et actuels:
 * - Format actuel: TYPE-MMYY-NNNN (ex: CNC-1125-0001, FOUR-0125-0042)
 * - Format v2.9.4: TYPE-YYYY-NNNN (ex: CNC-2025-0001)
 * - Format v2.9.3: LEGACY-YYYY-NNNN (ex: LEGACY-2025-0001)
 * - Format ancien: LEGACY-XXX-XXX-YYYYMMDD-NNN (ex: LEGACY-PDE-7500-20231025-001)
 * 
 * @param ticketId - L'ID du ticket à valider
 * @returns boolean - true si le format est valide
 */
export function isValidTicketId(ticketId: string): boolean {
  // Format actuel v2.9.5: TYPE-MMYY-NNNN (ex: CNC-1125-0001, FOUR-0125-0042)
  // MMYY = 4 chiffres (mois+année: 0125 = Janvier 2025, 1125 = Novembre 2025)
  const currentPattern = /^[A-Z]{2,6}-\d{4}-\d{4,}$/;
  
  // Format v2.9.4: TYPE-YYYY-NNNN (ex: CNC-2025-0001)
  // Note: Ce pattern est identique au currentPattern (4 chiffres)
  // Pas besoin de pattern séparé car structure identique
  
  // Format Legacy v2.9.3: ex COMP-2025-0001 (conservé pour compatibilité)
  const legacyV2Pattern = /^[A-Z]{3}-\d{4}-\d{4}$/;
  
  // Format Legacy Ancien: ex COMP-PDE-7500-20231025-001 (conservé pour compatibilité)
  const legacyOldPattern = /^[A-Z]{3}-[A-Z0-9]+-[A-Z0-9]+-\d{8}-\d{3}$/;
  
  return currentPattern.test(ticketId) || legacyV2Pattern.test(ticketId) || legacyOldPattern.test(ticketId);
}
