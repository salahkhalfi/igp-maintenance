import { describe, it, expect } from 'vitest';
import {
  formatAssigneeName,
  formatAssigneeNameShort,
  formatReporterName,
  formatPriorityText,
  formatPriorityBadge,
  formatStatus,
} from '../../../src/utils/formatters';

describe('formatters.ts - Assignee Names', () => {
  it('formate non assigné', () => {
    const ticket = { assigned_to: null };
    expect(formatAssigneeName(ticket)).toBe('⚠️ Non assigné');
  });

  it('formate équipe complète', () => {
    const ticket = { assigned_to: 'all' };
    expect(formatAssigneeName(ticket)).toBe('👥 Équipe complète');
  });

  it('formate technicien avec nom', () => {
    const ticket = { assigned_to: 6, assignee_name: 'Brahim' };
    expect(formatAssigneeName(ticket)).toBe('👤 Brahim');
  });

  it('formate technicien sans nom (fallback ID)', () => {
    const ticket = { assigned_to: 6, assignee_name: null };
    expect(formatAssigneeName(ticket)).toBe('👤 Tech #6');
  });

  it('version courte sans emoji - non assigné', () => {
    const ticket = { assigned_to: null };
    expect(formatAssigneeNameShort(ticket)).toBe('Non assigné');
  });

  it('version courte sans emoji - équipe', () => {
    const ticket = { assigned_to: 'all' };
    expect(formatAssigneeNameShort(ticket)).toBe('Toute équipe');
  });

  it('version courte sans emoji - technicien', () => {
    const ticket = { assigned_to: 6, assignee_name: 'Brahim' };
    expect(formatAssigneeNameShort(ticket)).toBe('Brahim');
  });
});

describe('formatters.ts - Reporter Name', () => {
  it('formate nom reporter existant', () => {
    const ticket = { reporter_name: 'Jean Dupont' };
    expect(formatReporterName(ticket)).toBe('Jean Dupont');
  });

  it('fallback N/A si reporter manquant', () => {
    const ticket = { reporter_name: null };
    expect(formatReporterName(ticket)).toBe('N/A');
  });
});

describe('formatters.ts - Priority', () => {
  it('formate priorité low', () => {
    expect(formatPriorityText('low')).toBe('🟢 Basse');
  });

  it('formate priorité medium', () => {
    expect(formatPriorityText('medium')).toBe('🟡 Moyenne');
  });

  it('formate priorité high', () => {
    expect(formatPriorityText('high')).toBe('🟠 Haute');
  });

  it('formate priorité critical', () => {
    expect(formatPriorityText('critical')).toBe('🔴 Critique');
  });

  it('fallback pour priorité inconnue (medium par défaut)', () => {
    expect(formatPriorityText('unknown' as any)).toBe('🟡 Moyenne');
  });

  it('badge priorité low', () => {
    const badge = formatPriorityBadge('low');
    expect(badge.className).toContain('bg-green-100');
    expect(badge.text).toBe('BAS');
    expect(badge.emoji).toBe('🟢');
  });

  it('badge priorité critical', () => {
    const badge = formatPriorityBadge('critical');
    expect(badge.className).toContain('bg-red-100');
    expect(badge.text).toBe('CRIT');
    expect(badge.emoji).toBe('🔴');
  });
});

describe('formatters.ts - Status', () => {
  it('formate statut received', () => {
    expect(formatStatus('received')).toBe('Reçu');
  });

  it('formate statut diagnostic', () => {
    expect(formatStatus('diagnostic')).toBe('Diagnostic');
  });

  it('formate statut in_progress', () => {
    expect(formatStatus('in_progress')).toBe('En cours');
  });

  it('formate statut waiting_parts', () => {
    expect(formatStatus('waiting_parts')).toBe('Attente pièces');
  });

  it('formate statut completed', () => {
    expect(formatStatus('completed')).toBe('Terminé');
  });

  it('formate statut archived', () => {
    expect(formatStatus('archived')).toBe('Archivé');
  });

  it('fallback pour statut inconnu', () => {
    expect(formatStatus('unknown' as any)).toContain('unknown');
  });
});
