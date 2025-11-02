// Génération automatique des IDs de tickets
// Format: IGP-[TYPE]-[MODEL]-[YYYYMMDD]-[SEQUENCE]
// Exemple: IGP-PDE-7500-20231025-001

export function generateTicketId(machineType: string, model: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  // Génère un numéro de séquence aléatoire (en production, utiliser une vraie séquence)
  const sequence = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  
  return `IGP-${machineType.toUpperCase()}-${model.toUpperCase()}-${dateStr}-${sequence}`;
}

export function isValidTicketId(ticketId: string): boolean {
  // Format: IGP-XXX-XXX-YYYYMMDD-NNN
  const pattern = /^IGP-[A-Z0-9]+-[A-Z0-9]+-\d{8}-\d{3}$/;
  return pattern.test(ticketId);
}
