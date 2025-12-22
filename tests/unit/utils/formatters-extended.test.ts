import { describe, it, expect } from 'vitest';
import {
  formatMachineInfo,
  formatRole,
  formatRoleShort,
  formatDate,
  formatFileSize,
  formatNumber,
  truncate,
  capitalize,
  isPast,
  isToday,
  isTomorrow,
} from '../../../src/utils/formatters';

describe('formatters.ts - Machine Info', () => {
  it('formate machine avec type et model', () => {
    const ticket = { machine_type: 'PDE', model: '7500' };
    expect(formatMachineInfo(ticket)).toBe('PDE 7500');
  });

  it('formate machine avec type seulement', () => {
    const ticket = { machine_type: 'PDE' };
    expect(formatMachineInfo(ticket)).toBe('PDE');
  });

  it('retourne N/A si machine manquante', () => {
    const ticket = {};
    expect(formatMachineInfo(ticket)).toBe('N/A');
  });

  it('ne trim pas espaces internes', () => {
    const ticket = { machine_type: '  PDE  ', model: '  7500  ' };
    // trim() sur concat, mais espaces entre type et model préservés
    const result = formatMachineInfo(ticket);
    expect(result).toContain('PDE');
    expect(result).toContain('7500');
  });
});

describe('formatters.ts - Roles', () => {
  it('formate rôle admin', () => {
    expect(formatRole('admin')).toBe('Administrateur');
  });

  it('formate rôle technician', () => {
    expect(formatRole('technician')).toBe('Technicien');
  });

  it('formate rôle team_leader', () => {
    // RoleService default: "Chef d'Équipe" (without "de Production")
    expect(formatRole('team_leader')).toBe("Chef d'Équipe");
  });

  it('fallback pour rôle inconnu', () => {
    expect(formatRole('unknown_role')).toBe('unknown_role');
  });

  it('version courte admin', () => {
    // RoleService returns clean name for single-word roles
    // "Administrateur" is the clean version of "👑 Administrateur"
    expect(formatRoleShort('admin')).toBe('Administrateur');
  });

  it('version courte supervisor', () => {
    // RoleService returns "Superviseur" (first word after emoji removal)
    expect(formatRoleShort('supervisor')).toBe('Superviseur');
  });
});

describe('formatters.ts - File Size', () => {
  it('formate bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('formate KB', () => {
    expect(formatFileSize(2048)).toBe('2.0 KB');
  });

  it('formate MB', () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });

  it('formate très grand fichier en MB', () => {
    // formatFileSize max = MB, pas de GB implémenté
    const result = formatFileSize(3 * 1024 * 1024 * 1024);
    expect(result).toContain('MB');
  });

  it('gère 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });
});

describe('formatters.ts - Number', () => {
  it('formate nombre avec séparateurs', () => {
    expect(formatNumber(1000)).toContain('1');
    expect(formatNumber(1000)).toContain('000');
  });

  it('formate grand nombre', () => {
    const formatted = formatNumber(1234567);
    expect(formatted).toBeTruthy();
    expect(formatted.length).toBeGreaterThan(7); // Avec séparateurs
  });

  it('gère nombre négatif', () => {
    expect(formatNumber(-500)).toContain('-');
  });
});

describe('formatters.ts - Truncate', () => {
  it('tronque texte long', () => {
    const longText = 'A'.repeat(150);
    const truncated = truncate(longText, 100);
    
    expect(truncated.length).toBeLessThanOrEqual(103); // 100 + '...'
    expect(truncated).toContain('...');
  });

  it('préserve texte court', () => {
    const shortText = 'Court';
    expect(truncate(shortText, 100)).toBe('Court');
  });

  it('gère texte vide', () => {
    expect(truncate('', 50)).toBe('');
  });

  it('tronque exactement à la longueur', () => {
    const text = 'A'.repeat(50);
    const truncated = truncate(text, 20);
    expect(truncated.length).toBeLessThanOrEqual(23); // 20 + '...'
  });
});

describe('formatters.ts - Capitalize', () => {
  it('capitalise première lettre', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('préserve reste tel quel', () => {
    expect(capitalize('HELLO')).toBe('HELLO'); // Pas de lowercase
  });

  it('gère string vide', () => {
    expect(capitalize('')).toBe('');
  });

  it('gère un seul caractère', () => {
    expect(capitalize('a')).toBe('A');
  });
});

describe('formatters.ts - Date Checks', () => {
  it('isPast détecte date passée', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString();
    
    expect(isPast(dateStr)).toBe(true);
  });

  it('isPast rejette date future', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString();
    
    expect(isPast(dateStr)).toBe(false);
  });

  it('isToday détecte aujourd\'hui', () => {
    const today = new Date().toISOString();
    expect(isToday(today)).toBe(true);
  });

  it('isTomorrow détecte demain', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString();
    
    expect(isTomorrow(dateStr)).toBe(true);
  });

  it('isTomorrow rejette aujourd\'hui', () => {
    const today = new Date().toISOString();
    expect(isTomorrow(today)).toBe(false);
  });
});

describe('formatters.ts - Date Formatting', () => {
  it('formate date avec heure par défaut', () => {
    const dateStr = '2025-11-17 14:30:00';
    const formatted = formatDate(dateStr);
    
    expect(formatted).toBeTruthy();
    expect(formatted).not.toBe('N/A');
  });

  it('formate date sans heure', () => {
    const dateStr = '2025-11-17 14:30:00';
    const formatted = formatDate(dateStr, false);
    
    expect(formatted).toBeTruthy();
    expect(formatted).not.toContain(':');
  });

  it('retourne N/A pour date vide', () => {
    expect(formatDate('')).toBe('N/A');
  });

  it('retourne Date invalide pour format incorrect', () => {
    expect(formatDate('not-a-date')).toBe('Date invalide');
  });
});
