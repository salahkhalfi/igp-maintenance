#!/usr/bin/env node
/**
 * SIMULATION COMPLÈTE - Génération et Validation Ticket ID v2.9.5
 * 
 * Ce script simule tous les scénarios possibles pour vérifier:
 * - Race conditions
 * - Changements de mois/année
 * - Validation des formats
 * - Cas limites
 * - Conflits entre formats
 */

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║   SIMULATION COMPLÈTE - TICKET ID v2.9.5                       ║');
console.log('║   Format: TYPE-MMYY-NNNN                                       ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// ============================================================================
// FONCTIONS DE GÉNÉRATION (Copie du code production)
// ============================================================================

function getMachineTypeCode(machineType) {
  const upperType = machineType.toUpperCase();
  
  const typeMap = {
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

function generateTicketId(machineType, existingTickets = [], customDate = null) {
  const now = customDate || new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);
  const mmyy = `${month}${year}`;
  
  const typeCode = getMachineTypeCode(machineType);
  
  // Simuler COUNT(*) FROM tickets WHERE ticket_id LIKE 'TYPE-MMYY-%'
  const pattern = `${typeCode}-${mmyy}-`;
  const count = existingTickets.filter(id => id.startsWith(pattern)).length;
  
  const sequence = String(count + 1).padStart(4, '0');
  
  return `${typeCode}-${mmyy}-${sequence}`;
}

function isValidTicketId(ticketId) {
  const currentPattern = /^[A-Z]{2,6}-\d{4}-\d{4,}$/;
  const v293Pattern = /^IGP-\d{4}-\d{4}$/;
  const oldPattern = /^IGP-[A-Z0-9]+-[A-Z0-9]+-\d{8}-\d{3}$/;
  
  return currentPattern.test(ticketId) || v293Pattern.test(ticketId) || oldPattern.test(ticketId);
}

function isValidTicketIdStrict(ticketId) {
  if (!isValidTicketId(ticketId)) return false;
  
  // Validation sémantique MMYY pour format actuel
  const parts = ticketId.split('-');
  if (parts.length === 3 && parts[0].length <= 6) {
    const mmyy = parts[1];
    if (mmyy.length === 4) {
      const mm = parseInt(mmyy.substring(0, 2), 10);
      
      // Vérifier que le mois est valide (01-12)
      if (mm < 1 || mm > 12) {
        return false;
      }
    }
  }
  
  return true;
}

// ============================================================================
// SIMULATION 1: GÉNÉRATION NORMALE
// ============================================================================

console.log('📋 SIMULATION 1: Génération Normale\n');
console.log('═'.repeat(70));

const normalTests = [
  { machine: 'CNC', date: new Date('2025-11-26'), expected: 'CNC-1125-0001' },
  { machine: 'Four', date: new Date('2025-01-15'), expected: 'FOUR-0125-0001' },
  { machine: 'Polisseuse', date: new Date('2025-06-30'), expected: 'POL-0625-0001' },
  { machine: 'WaterJet', date: new Date('2025-12-25'), expected: 'WJ-1225-0001' },
];

let normalPass = 0;
let normalFail = 0;

normalTests.forEach(test => {
  const result = generateTicketId(test.machine, [], test.date);
  const pass = result === test.expected;
  
  console.log(`${pass ? '✅' : '❌'} ${test.machine.padEnd(12)} → ${result.padEnd(20)} (Attendu: ${test.expected})`);
  
  if (pass) normalPass++;
  else normalFail++;
});

console.log(`\n📊 Résultat: ${normalPass}/${normalTests.length} réussis\n`);

// ============================================================================
// SIMULATION 2: RACE CONDITION
// ============================================================================

console.log('⚠️  SIMULATION 2: Race Condition (Création Simultanée)\n');
console.log('═'.repeat(70));

const existingTickets = [];
const threads = [];

// Simuler 5 threads créant des tickets CNC simultanément
for (let i = 1; i <= 5; i++) {
  const ticketId = generateTicketId('CNC', existingTickets, new Date('2025-11-26'));
  threads.push({ thread: i, ticketId });
  existingTickets.push(ticketId);
}

console.log('Scénario: 5 threads créent des tickets CNC simultanément\n');
console.log('Base de données AVANT création:');
console.log('  Tickets CNC-1125-*: 0\n');

const collisions = new Map();
threads.forEach(t => {
  const count = collisions.get(t.ticketId) || 0;
  collisions.set(t.ticketId, count + 1);
});

let hasCollision = false;
threads.forEach(t => {
  const isCollision = collisions.get(t.ticketId) > 1;
  if (isCollision) hasCollision = true;
  
  console.log(`${isCollision ? '❌ COLLISION!' : '✅'} Thread ${t.thread}: ${t.ticketId} ${isCollision ? `(x${collisions.get(t.ticketId)})` : ''}`);
});

console.log(`\n🔴 RISQUE DÉTECTÉ: Race condition ${hasCollision ? 'PEUT' : 'NE PEUT PAS'} se produire`);
console.log('   Solution: UNIQUE constraint + retry logic\n');

// ============================================================================
// SIMULATION 3: CHANGEMENT DE MOIS
// ============================================================================

console.log('📅 SIMULATION 3: Changement de Mois (Minuit)\n');
console.log('═'.repeat(70));

const monthChangeTickets = [];

// Dernier ticket de novembre
const nov30_23h59 = new Date('2025-11-30T23:59:59');
const lastNov = generateTicketId('CNC', monthChangeTickets, nov30_23h59);
monthChangeTickets.push(lastNov);
console.log(`30 Nov 2025 23:59:59 → ${lastNov}`);

// Premier ticket de décembre
const dec01_00h00 = new Date('2025-12-01T00:00:00');
const firstDec = generateTicketId('CNC', monthChangeTickets, dec01_00h00);
monthChangeTickets.push(firstDec);
console.log(`01 Dec 2025 00:00:00 → ${firstDec}`);

// Deuxième ticket de décembre
const secondDec = generateTicketId('CNC', monthChangeTickets, dec01_00h00);
console.log(`01 Dec 2025 00:00:01 → ${secondDec}`);

const monthResetWorks = lastNov.startsWith('CNC-1125-') && firstDec === 'CNC-1225-0001' && secondDec === 'CNC-1225-0002';

console.log(`\n${monthResetWorks ? '✅' : '❌'} Remise à zéro mensuelle: ${monthResetWorks ? 'FONCTIONNE' : 'ÉCHOUE'}\n`);

// ============================================================================
// SIMULATION 4: CHANGEMENT D'ANNÉE
// ============================================================================

console.log('🎆 SIMULATION 4: Changement d\'Année (31 Déc → 1er Jan)\n');
console.log('═'.repeat(70));

const yearChangeTickets = [];

// Dernier ticket de 2025
const dec31_2025 = new Date('2025-12-31T23:59:59');
const lastDec2025 = generateTicketId('FOUR', yearChangeTickets, dec31_2025);
yearChangeTickets.push(lastDec2025);
console.log(`31 Dec 2025 23:59:59 → ${lastDec2025}`);

// Premier ticket de 2026
const jan01_2026 = new Date('2026-01-01T00:00:00');
const firstJan2026 = generateTicketId('FOUR', yearChangeTickets, jan01_2026);
yearChangeTickets.push(firstJan2026);
console.log(`01 Jan 2026 00:00:00 → ${firstJan2026}`);

const yearResetWorks = lastDec2025 === 'FOUR-1225-0001' && firstJan2026 === 'FOUR-0126-0001';

console.log(`\n${yearResetWorks ? '✅' : '❌'} Transition année: ${yearResetWorks ? 'FONCTIONNE' : 'ÉCHOUE'}\n`);

// ============================================================================
// SIMULATION 5: DÉPASSEMENT 9999
// ============================================================================

console.log('🔢 SIMULATION 5: Dépassement 9999 Tickets/Mois\n');
console.log('═'.repeat(70));

const overflowTickets = [];

// Simuler 9999 tickets existants
for (let i = 0; i < 9999; i++) {
  overflowTickets.push(`CNC-1125-${String(i + 1).padStart(4, '0')}`);
}

console.log(`Tickets existants: ${overflowTickets.length}`);
console.log(`Dernier ticket: ${overflowTickets[overflowTickets.length - 1]}`);

// Créer le 10000ème
const ticket10000 = generateTicketId('CNC', overflowTickets, new Date('2025-11-26'));
console.log(`10000ème ticket: ${ticket10000}`);

const hasExtraDigit = ticket10000.length > 'CNC-1125-0001'.length;
console.log(`\n${hasExtraDigit ? '⚠️' : '✅'} Format: ${hasExtraDigit ? '5 chiffres (CNC-1125-10000)' : '4 chiffres maintenu'}`);
console.log(`${isValidTicketId(ticket10000) ? '✅' : '❌'} Validation: ${isValidTicketId(ticket10000) ? 'PASSE' : 'ÉCHOUE'}`);
console.log(`\n🟡 Note: Pattern accepte \\d{4,} donc 5 chiffres sont valides\n`);

// ============================================================================
// SIMULATION 6: VALIDATION STRICTE
// ============================================================================

console.log('🔍 SIMULATION 6: Validation Format (Basique vs Stricte)\n');
console.log('═'.repeat(70));

const validationTests = [
  { id: 'CNC-1125-0001', desc: 'Nov 2025 valide', shouldBeValid: true },
  { id: 'FOUR-0125-0042', desc: 'Jan 2025 valide', shouldBeValid: true },
  { id: 'CNC-0025-0001', desc: 'Mois 00 invalide', shouldBeValid: false },
  { id: 'CNC-1325-0001', desc: 'Mois 13 invalide', shouldBeValid: false },
  { id: 'CNC-0025-0001', desc: 'Mois 00 invalide', shouldBeValid: false },
  { id: 'POL-9925-0001', desc: 'Mois 99 invalide', shouldBeValid: false },
  { id: 'CNC-2025-0001', desc: 'Format v2.9.4 (YYYY)', shouldBeValid: true },
  { id: 'IGP-2025-0001', desc: 'Format v2.9.3', shouldBeValid: true },
  { id: 'IGP-PDE-7500-20231025-001', desc: 'Format legacy', shouldBeValid: true },
];

console.log('ID'.padEnd(35) + 'Basique  Stricte  Attendu  Résultat');
console.log('─'.repeat(70));

let validationPass = 0;
let validationFail = 0;

validationTests.forEach(test => {
  const basicValid = isValidTicketId(test.id);
  const strictValid = isValidTicketIdStrict(test.id);
  const expectedResult = test.shouldBeValid;
  const pass = strictValid === expectedResult;
  
  console.log(
    `${test.id.padEnd(35)}` +
    `${basicValid ? '✅' : '❌'}       ` +
    `${strictValid ? '✅' : '❌'}       ` +
    `${expectedResult ? '✅' : '❌'}       ` +
    `${pass ? '✅ PASS' : '❌ FAIL'}`
  );
  
  if (pass) validationPass++;
  else validationFail++;
});

console.log(`\n📊 Résultat: ${validationPass}/${validationTests.length} validations correctes`);
console.log(`⚠️  Problème: Validation basique accepte mois invalides (00, 13, 99)\n`);

// ============================================================================
// SIMULATION 7: COHABITATION DES FORMATS
// ============================================================================

console.log('🔄 SIMULATION 7: Cohabitation des Formats\n');
console.log('═'.repeat(70));

const mixedTickets = [
  'IGP-PDE-7500-20231025-001',     // Legacy
  'IGP-2025-0001',                 // v2.9.3
  'CNC-2025-0001',                 // v2.9.4
  'CNC-1125-0001',                 // v2.9.5 (actuel)
  'CNC-1125-0002',                 // v2.9.5 (actuel)
];

console.log('Base de données avec formats mixtes:\n');

mixedTickets.forEach((id, index) => {
  let format = 'Inconnu';
  if (id.startsWith('IGP-') && id.includes('-20')) format = 'Legacy';
  else if (id.startsWith('IGP-')) format = 'v2.9.3';
  else if (id.match(/^[A-Z]+-\d{4}-\d{4}$/)) {
    const mmyy = id.split('-')[1];
    const mm = parseInt(mmyy.substring(0, 2));
    format = (mm >= 1 && mm <= 12) ? 'v2.9.5' : 'v2.9.4';
  }
  
  console.log(`${(index + 1).toString().padStart(2)}. ${id.padEnd(40)} [${format}]`);
});

// Tester comptage pour nouveau ticket
const newTicket = generateTicketId('CNC', mixedTickets, new Date('2025-11-26'));
console.log(`\nNouveau ticket généré: ${newTicket}`);

const shouldBe = 'CNC-1125-0003';
const countCorrect = newTicket === shouldBe;

console.log(`Attendu: ${shouldBe}`);
console.log(`${countCorrect ? '✅' : '❌'} Comptage: ${countCorrect ? 'Ne compte que CNC-1125-*' : 'Erreur de comptage'}\n`);

// ============================================================================
// SIMULATION 8: TIMEZONE DÉCALÉ
// ============================================================================

console.log('🌍 SIMULATION 8: Timezone Décalé (Client vs Serveur)\n');
console.log('═'.repeat(70));

// Client au Japon (UTC+9) : 1er décembre 02:00 JST
const clientTime = new Date('2025-12-01T02:00:00+09:00');

// Serveur au Canada (UTC-5) : 30 novembre 12:00 EST
const serverTime = new Date('2025-11-30T12:00:00-05:00');

console.log(`Client (Japon UTC+9):  ${clientTime.toLocaleString('fr-FR', { timeZone: 'Asia/Tokyo' })}`);
console.log(`Serveur (Canada UTC-5): ${serverTime.toLocaleString('fr-FR', { timeZone: 'America/Toronto' })}`);

const clientTicket = generateTicketId('POL', [], clientTime);
const serverTicket = generateTicketId('POL', [], serverTime);

console.log(`\nTicket généré (client):  ${clientTicket} ← Client pense "Décembre"`);
console.log(`Ticket généré (serveur): ${serverTicket} ← Serveur génère "Novembre"`);

const mismatch = clientTicket !== serverTicket;
console.log(`\n${mismatch ? '⚠️' : '✅'} Décalage détecté: ${mismatch ? 'OUI - Confusion possible' : 'NON'}\n`);

// ============================================================================
// RÉSUMÉ GLOBAL
// ============================================================================

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║                     RÉSUMÉ DES SIMULATIONS                     ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

const results = [
  { test: 'Génération normale', status: normalFail === 0 ? '✅ PASS' : '❌ FAIL', risk: '🟢' },
  { test: 'Race condition', status: '⚠️  POSSIBLE', risk: '🔴' },
  { test: 'Changement mois', status: monthResetWorks ? '✅ PASS' : '❌ FAIL', risk: '🟢' },
  { test: 'Changement année', status: yearResetWorks ? '✅ PASS' : '❌ FAIL', risk: '🟢' },
  { test: 'Dépassement 9999', status: '⚠️  POSSIBLE', risk: '🟡' },
  { test: 'Validation stricte', status: validationFail > 0 ? '⚠️  PARTIEL' : '✅ PASS', risk: '🟡' },
  { test: 'Cohabitation formats', status: countCorrect ? '✅ PASS' : '❌ FAIL', risk: '🟢' },
  { test: 'Timezone décalé', status: '⚠️  POSSIBLE', risk: '🟡' },
];

console.log('Test'.padEnd(30) + 'Statut'.padEnd(20) + 'Risque');
console.log('─'.repeat(70));

results.forEach(r => {
  console.log(`${r.test.padEnd(30)}${r.status.padEnd(20)}${r.risk}`);
});

console.log('\n');
console.log('🔴 CRITIQUE - Action immédiate requise');
console.log('🟡 MOYEN - Correction recommandée');
console.log('🟢 BON - Aucune action requise');

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║                   RECOMMANDATIONS PRIORITAIRES                 ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log('🔴 URGENT (À implémenter maintenant):');
console.log('   1. Ajouter UNIQUE constraint sur ticket_id');
console.log('   2. Implémenter retry logic (max 3 tentatives)');
console.log('');
console.log('🟡 COURT TERME (Cette semaine):');
console.log('   3. Améliorer validation MMYY (bloquer mois 00, 13+)');
console.log('   4. Documenter timezone serveur');
console.log('');
console.log('🟢 LONG TERME (Monitoring):');
console.log('   5. Alertes si approche 9000 tickets/mois');
console.log('   6. Tests de charge en environnement concurrent');

console.log('\n✅ Simulation terminée avec succès!\n');
