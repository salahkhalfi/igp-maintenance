import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateTicketId, isValidTicketId } from '../../../src/utils/ticket-id';

// Mock simple de D1Database
const mockDB = {
  prepare: vi.fn(() => ({
    bind: vi.fn(() => ({
      first: vi.fn().mockResolvedValue({ count: 42 }) // Simule 42 tickets existants
    }))
  }))
} as any;

describe('ticket-id.ts - generateTicketId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('génère ID avec format correct (TYPE-MMYY-NNNN)', async () => {
    // Simule 0 tickets existants
    mockDB.prepare.mockImplementation(() => ({
      bind: () => ({
        first: async () => ({ count: 0 })
      })
    }));

    const ticketId = await generateTicketId(mockDB, 'Polisseuse');
    
    // Format attendu: POL-MMYY-0001
    // Exemple pour Décembre 2025: POL-1225-0001
    expect(ticketId).toMatch(/^[A-Z]{3}-\d{4}-\d{4}$/);
    expect(ticketId).toContain('POL');
  });

  it('utilise les 3 premières lettres du type', async () => {
    const ticketId = await generateTicketId(mockDB, 'Camion');
    expect(ticketId).toContain('CAM');
  });

  it('incrémente le compteur correctement', async () => {
    // Simule 9 tickets existants -> doit générer 0010
    mockDB.prepare.mockImplementation(() => ({
      bind: () => ({
        first: async () => ({ count: 9 })
      })
    }));

    const ticketId = await generateTicketId(mockDB, 'TEST');
    expect(ticketId.endsWith('0010')).toBe(true);
  });

  it('inclut date MMYY', async () => {
    const ticketId = await generateTicketId(mockDB, 'TEST');
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = String(today.getFullYear()).slice(-2);
    const expectedDate = `${month}${year}`;
    
    expect(ticketId).toContain(expectedDate);
  });
});

describe('ticket-id.ts - isValidTicketId', () => {
  it('valide format V3 (TYPE-MMYY-NNNN)', () => {
    expect(isValidTicketId('CNC-1125-0001')).toBe(true);
    expect(isValidTicketId('POL-0125-0042')).toBe(true);
  });

  it('valide format Legacy V2 (TYPE-YYYY-NNNN)', () => {
    expect(isValidTicketId('CNC-2025-0001')).toBe(true);
  });

  it('valide format Legacy Ancien (IGP-...)', () => {
    expect(isValidTicketId('IGP-PDE-7500-20231025-001')).toBe(true); // Doit rester valide pour vieux tickets
  });

  it('rejette ID vide', () => {
    expect(isValidTicketId('')).toBe(false);
  });

  it('rejette ID malformé', () => {
    expect(isValidTicketId('TOTO')).toBe(false);
    expect(isValidTicketId('CNC-123')).toBe(false);
  });
});
