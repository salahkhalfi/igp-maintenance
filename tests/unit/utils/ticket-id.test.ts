import { describe, it, expect } from 'vitest';
import { generateTicketId, isValidTicketId } from '../../../src/utils/ticket-id';

describe('ticket-id.ts - generateTicketId', () => {
  it('génère ID avec format correct', () => {
    const ticketId = generateTicketId('PDE', '7500');
    
    expect(ticketId).toMatch(/^IGP-/);
    expect(ticketId).toContain('PDE');
    expect(ticketId).toContain('7500');
  });

  it('convertit type et model en majuscules', () => {
    const ticketId = generateTicketId('pde', 'model123');
    
    expect(ticketId).toContain('PDE');
    expect(ticketId).toContain('MODEL123');
    expect(ticketId).not.toContain('pde');
    expect(ticketId).not.toContain('model123');
  });

  it('inclut date YYYYMMDD', () => {
    const ticketId = generateTicketId('TEST', 'MODEL');
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const expectedDate = `${year}${month}${day}`;
    
    expect(ticketId).toContain(expectedDate);
  });

  it('génère séquence 3 chiffres', () => {
    const ticketId = generateTicketId('ABC', 'XYZ');
    
    // Extraire derniers 3 chiffres
    const sequence = ticketId.split('-').pop();
    expect(sequence).toHaveLength(3);
    expect(sequence).toMatch(/^\d{3}$/);
  });

  it('génère IDs uniques (séquence aléatoire)', () => {
    const id1 = generateTicketId('SAME', 'TYPE');
    const id2 = generateTicketId('SAME', 'TYPE');
    
    // Très probable que séquences diffèrent (random)
    // Note: Test peut échouer 1/1000 fois (collision aléatoire)
    expect(id1).not.toBe(id2);
  });

  it('gère types/models avec espaces', () => {
    const ticketId = generateTicketId('TYPE LONG', 'MODEL 123');
    
    // Espaces préservés (pas de normalisation dans fonction)
    expect(ticketId).toContain('TYPE LONG');
    expect(ticketId).toContain('MODEL 123');
  });

  it('gère caractères spéciaux', () => {
    const ticketId = generateTicketId('PDE-2000', 'V-1.5');
    
    expect(ticketId).toContain('PDE-2000');
    expect(ticketId).toContain('V-1.5');
  });
});

describe('ticket-id.ts - isValidTicketId', () => {
  it('valide ID correct', () => {
    const validId = 'IGP-PDE-7500-20231025-001';
    expect(isValidTicketId(validId)).toBe(true);
  });

  it('valide ID avec chiffres dans type/model', () => {
    const validId = 'IGP-ABC123-XYZ789-20250101-999';
    expect(isValidTicketId(validId)).toBe(true);
  });

  it('rejette ID sans préfixe IGP', () => {
    const invalidId = 'XYZ-PDE-7500-20231025-001';
    expect(isValidTicketId(invalidId)).toBe(false);
  });

  it('rejette ID avec date invalide', () => {
    const invalidId = 'IGP-PDE-7500-2023102A-001'; // 'A' au lieu de chiffre
    expect(isValidTicketId(invalidId)).toBe(false);
  });

  it('rejette ID avec séquence trop courte', () => {
    const invalidId = 'IGP-PDE-7500-20231025-01'; // 2 chiffres au lieu de 3
    expect(isValidTicketId(invalidId)).toBe(false);
  });

  it('rejette ID avec séquence trop longue', () => {
    const invalidId = 'IGP-PDE-7500-20231025-1234'; // 4 chiffres au lieu de 3
    expect(isValidTicketId(invalidId)).toBe(false);
  });

  it('rejette ID vide', () => {
    expect(isValidTicketId('')).toBe(false);
  });

  it('rejette ID avec segments manquants', () => {
    const invalidId = 'IGP-PDE-7500-20231025'; // Pas de séquence
    expect(isValidTicketId(invalidId)).toBe(false);
  });

  it('rejette ID avec minuscules', () => {
    const invalidId = 'igp-pde-7500-20231025-001';
    expect(isValidTicketId(invalidId)).toBe(false);
  });

  it('rejette ID avec espaces', () => {
    const invalidId = 'IGP-PDE 2000-7500-20231025-001';
    expect(isValidTicketId(invalidId)).toBe(false);
  });
});

describe('ticket-id.ts - Workflow complet', () => {
  it('génère puis valide ID', () => {
    const ticketId = generateTicketId('PDE', '7500');
    
    expect(isValidTicketId(ticketId)).toBe(true);
  });

  it('génère IDs valides pour différents types', () => {
    const types = ['PDE', 'ABC', 'XYZ123'];
    const models = ['7500', 'MODEL1', 'V2'];
    
    types.forEach(type => {
      models.forEach(model => {
        const ticketId = generateTicketId(type, model);
        expect(isValidTicketId(ticketId)).toBe(true);
      });
    });
  });
});
