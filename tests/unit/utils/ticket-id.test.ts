import { describe, it, expect, beforeEach } from 'vitest';
import { generateTicketId, isValidTicketId } from '../../../src/utils/ticket-id';
import { MockD1Database } from '../../fixtures/mock-db';

/**
 * Tests pour ticket-id.ts
 * 
 * Format actuel: TYPE-MMYY-NNNN (ex: CNC-1225-0001 pour Décembre 2025)
 * - TYPE: 3 premières lettres du type de machine en majuscules
 * - MMYY: Mois + Année sur 2 chiffres
 * - NNNN: Séquence 4 chiffres basée sur le nombre de tickets du mois
 */

describe('ticket-id.ts - generateTicketId', () => {
  let mockDB: MockD1Database;

  beforeEach(() => {
    mockDB = new MockD1Database();
    // Simuler 0 tickets existants par défaut
    mockDB.addTestData('ticket_count', [{ count: 0 }]);
  });

  it('génère ID avec format TYPE-MMYY-NNNN', async () => {
    const ticketId = await generateTicketId(mockDB as any, 'CNC');
    
    // Format: XXX-MMYY-NNNN
    expect(ticketId).toMatch(/^[A-Z]{3}-\d{4}-\d{4}$/);
  });

  it('utilise les 3 premières lettres du type en majuscules', async () => {
    const ticketId = await generateTicketId(mockDB as any, 'Polisseuse');
    
    expect(ticketId).toMatch(/^POL-/);
  });

  it('convertit type en majuscules', async () => {
    const ticketId = await generateTicketId(mockDB as any, 'four');
    
    expect(ticketId).toMatch(/^FOU-/);
  });

  it('inclut mois et année (MMYY)', async () => {
    const ticketId = await generateTicketId(mockDB as any, 'CNC');
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const expectedMMYY = `${month}${year}`;
    
    expect(ticketId).toContain(`-${expectedMMYY}-`);
  });

  it('génère séquence 4 chiffres commençant à 0001', async () => {
    const ticketId = await generateTicketId(mockDB as any, 'CNC');
    
    // Avec 0 tickets existants, séquence = 0001
    expect(ticketId).toMatch(/-0001$/);
  });

  it('incrémente séquence basée sur tickets existants', async () => {
    // Simuler 5 tickets existants
    mockDB.addTestData('ticket_count', [{ count: 5 }]);
    
    const ticketId = await generateTicketId(mockDB as any, 'CNC');
    
    // Avec 5 tickets existants, séquence = 0006
    expect(ticketId).toMatch(/-0006$/);
  });

  it('gère types courts (< 3 caractères)', async () => {
    const ticketId = await generateTicketId(mockDB as any, 'AB');
    
    // Devrait prendre les 2 caractères disponibles
    expect(ticketId).toMatch(/^AB-/);
  });

  it('tronque types longs à 3 caractères', async () => {
    const ticketId = await generateTicketId(mockDB as any, 'Ordinateur');
    
    expect(ticketId).toMatch(/^ORD-/);
  });
});

describe('ticket-id.ts - isValidTicketId', () => {
  // Format actuel: TYPE-MMYY-NNNN
  it('valide format actuel TYPE-MMYY-NNNN', () => {
    expect(isValidTicketId('CNC-1225-0001')).toBe(true);
    expect(isValidTicketId('FOU-0125-0042')).toBe(true);
    expect(isValidTicketId('POL-1225-9999')).toBe(true);
  });

  it('valide format avec type 2-6 caractères', () => {
    expect(isValidTicketId('AB-1225-0001')).toBe(true);
    expect(isValidTicketId('ABCDEF-1225-0001')).toBe(true);
  });

  it('valide format legacy v2.9.4 TYPE-YYYY-NNNN', () => {
    expect(isValidTicketId('CNC-2025-0001')).toBe(true);
    expect(isValidTicketId('ABC-2024-1234')).toBe(true);
  });

  it('valide format legacy ancien COMP-XXX-XXX-YYYYMMDD-NNN', () => {
    expect(isValidTicketId('COM-PDE-7500-20231025-001')).toBe(true);
    expect(isValidTicketId('LEG-ABC-123-20250101-999')).toBe(true);
  });

  it('rejette ID vide', () => {
    expect(isValidTicketId('')).toBe(false);
  });

  it('rejette ID avec minuscules', () => {
    expect(isValidTicketId('cnc-1225-0001')).toBe(false);
    expect(isValidTicketId('Cnc-1225-0001')).toBe(false);
  });

  it('rejette ID avec format invalide', () => {
    expect(isValidTicketId('CNC-12-0001')).toBe(false); // MMYY trop court
    expect(isValidTicketId('CNC-122525-0001')).toBe(false); // MMYY trop long
    expect(isValidTicketId('C-1225-0001')).toBe(false); // Type trop court
    expect(isValidTicketId('CNC-1225-01')).toBe(false); // Séquence trop courte
  });

  it('rejette ID avec caractères spéciaux', () => {
    expect(isValidTicketId('CNC@1225-0001')).toBe(false);
    expect(isValidTicketId('CNC-1225_0001')).toBe(false);
  });

  it('rejette ID avec espaces', () => {
    expect(isValidTicketId('CNC -1225-0001')).toBe(false);
    expect(isValidTicketId(' CNC-1225-0001')).toBe(false);
  });
});

describe('ticket-id.ts - Workflow complet', () => {
  let mockDB: MockD1Database;

  beforeEach(() => {
    mockDB = new MockD1Database();
    mockDB.addTestData('ticket_count', [{ count: 0 }]);
  });

  it('génère puis valide ID', async () => {
    const ticketId = await generateTicketId(mockDB as any, 'CNC');
    
    expect(isValidTicketId(ticketId)).toBe(true);
  });

  it('génère IDs valides pour différents types', async () => {
    const types = ['CNC', 'Four', 'polisseuse', 'LASER'];
    
    for (const type of types) {
      const ticketId = await generateTicketId(mockDB as any, type);
      expect(isValidTicketId(ticketId)).toBe(true);
    }
  });
});
