// Tests unitaires pour la fonctionnalité de recherche

import { describe, it, expect } from 'vitest';

/**
 * Fonction de détection des mots-clés
 * Extrait de src/routes/search.ts pour tests
 */
function detectKeyword(query: string): {
  isKeyword: boolean;
  type: string | null;
  statusFilter: string | null;
  priorityFilter: string | null;
  onlyWithComments: boolean;
  onlyOverdue: boolean;
} {
  const queryLower = query.trim().toLowerCase();
  let statusFilter = null;
  let priorityFilter = null;
  let onlyWithComments = false;
  let onlyOverdue = false;
  let isKeywordSearch = false;
  let type = null;
  
  // Détection commentaires
  if (queryLower === 'commentaire' || queryLower === 'commentaires' || 
      queryLower === 'note' || queryLower === 'notes' ||
      queryLower === 'comment' || queryLower === 'comments') {
    onlyWithComments = true;
    isKeywordSearch = true;
    type = 'comments';
  }
  
  // Détection retard
  if (queryLower === 'retard' || queryLower === 'retards' || queryLower === 'overdue') {
    onlyOverdue = true;
    isKeywordSearch = true;
    type = 'overdue';
  }
  
  // Détection status
  if (queryLower === 'nouveau' || queryLower === 'new') {
    statusFilter = 'new';
    isKeywordSearch = true;
    type = 'status_new';
  } else if (queryLower === 'progress' || queryLower === 'cours' || queryLower === 'en cours') {
    statusFilter = 'in_progress';
    isKeywordSearch = true;
    type = 'status_in_progress';
  } else if (queryLower === 'complet' || queryLower === 'complete' || queryLower === 'terminé') {
    statusFilter = 'completed';
    isKeywordSearch = true;
    type = 'status_completed';
  }
  
  // Détection priorité
  if (queryLower === 'urgent' || queryLower === 'critique' || queryLower === 'critical') {
    priorityFilter = 'critical';
    isKeywordSearch = true;
    type = 'priority_critical';
  } else if (queryLower === 'haute' || queryLower === 'high') {
    priorityFilter = 'high';
    isKeywordSearch = true;
    type = 'priority_high';
  } else if (queryLower === 'moyenne' || queryLower === 'medium') {
    priorityFilter = 'medium';
    isKeywordSearch = true;
    type = 'priority_medium';
  } else if (queryLower === 'basse' || queryLower === 'low' || queryLower === 'faible') {
    priorityFilter = 'low';
    isKeywordSearch = true;
    type = 'priority_low';
  }

  return {
    isKeyword: isKeywordSearch,
    type,
    statusFilter,
    priorityFilter,
    onlyWithComments,
    onlyOverdue
  };
}

describe('Search Keyword Detection', () => {
  describe('Overdue Tickets', () => {
    it('should detect "retard" keyword (French)', () => {
      const result = detectKeyword('retard');
      expect(result.isKeyword).toBe(true);
      expect(result.type).toBe('overdue');
      expect(result.onlyOverdue).toBe(true);
    });

    it('should detect "retards" plural (French)', () => {
      const result = detectKeyword('retards');
      expect(result.isKeyword).toBe(true);
      expect(result.type).toBe('overdue');
      expect(result.onlyOverdue).toBe(true);
    });

    it('should detect "overdue" keyword (English)', () => {
      const result = detectKeyword('overdue');
      expect(result.isKeyword).toBe(true);
      expect(result.type).toBe('overdue');
      expect(result.onlyOverdue).toBe(true);
    });

    it('should NOT detect partial match "retardement"', () => {
      const result = detectKeyword('retardement');
      expect(result.isKeyword).toBe(false);
      expect(result.onlyOverdue).toBe(false);
    });
  });

  describe('Comments', () => {
    it('should detect "commentaire" keyword', () => {
      const result = detectKeyword('commentaire');
      expect(result.isKeyword).toBe(true);
      expect(result.type).toBe('comments');
      expect(result.onlyWithComments).toBe(true);
    });

    it('should detect "note" keyword', () => {
      const result = detectKeyword('note');
      expect(result.isKeyword).toBe(true);
      expect(result.type).toBe('comments');
      expect(result.onlyWithComments).toBe(true);
    });

    it('should detect "comments" English plural', () => {
      const result = detectKeyword('comments');
      expect(result.isKeyword).toBe(true);
      expect(result.type).toBe('comments');
      expect(result.onlyWithComments).toBe(true);
    });
  });

  describe('Priority Levels', () => {
    it('should detect "urgent" keyword', () => {
      const result = detectKeyword('urgent');
      expect(result.isKeyword).toBe(true);
      expect(result.type).toBe('priority_critical');
      expect(result.priorityFilter).toBe('critical');
    });

    it('should detect "critique" keyword (French)', () => {
      const result = detectKeyword('critique');
      expect(result.isKeyword).toBe(true);
      expect(result.type).toBe('priority_critical');
      expect(result.priorityFilter).toBe('critical');
    });

    it('should detect "haute" priority (French)', () => {
      const result = detectKeyword('haute');
      expect(result.isKeyword).toBe(true);
      expect(result.type).toBe('priority_high');
      expect(result.priorityFilter).toBe('high');
    });

    it('should detect "high" priority (English)', () => {
      const result = detectKeyword('high');
      expect(result.isKeyword).toBe(true);
      expect(result.type).toBe('priority_high');
      expect(result.priorityFilter).toBe('high');
    });

    it('should detect "moyenne" priority', () => {
      const result = detectKeyword('moyenne');
      expect(result.isKeyword).toBe(true);
      expect(result.type).toBe('priority_medium');
      expect(result.priorityFilter).toBe('medium');
    });

    it('should detect "faible" priority (French)', () => {
      const result = detectKeyword('faible');
      expect(result.isKeyword).toBe(true);
      expect(result.type).toBe('priority_low');
      expect(result.priorityFilter).toBe('low');
    });
  });

  describe('Status Keywords', () => {
    it('should detect "nouveau" status (French)', () => {
      const result = detectKeyword('nouveau');
      expect(result.isKeyword).toBe(true);
      expect(result.type).toBe('status_new');
      expect(result.statusFilter).toBe('new');
    });

    it('should detect "en cours" status (French)', () => {
      const result = detectKeyword('en cours');
      expect(result.isKeyword).toBe(true);
      expect(result.type).toBe('status_in_progress');
      expect(result.statusFilter).toBe('in_progress');
    });

    it('should detect "terminé" status (French)', () => {
      const result = detectKeyword('terminé');
      expect(result.isKeyword).toBe(true);
      expect(result.type).toBe('status_completed');
      expect(result.statusFilter).toBe('completed');
    });
  });

  describe('Non-Keyword Searches', () => {
    it('should NOT detect regular search "machine"', () => {
      const result = detectKeyword('machine');
      expect(result.isKeyword).toBe(false);
      expect(result.type).toBe(null);
    });

    it('should NOT detect ticket ID "IGP-PDE-001"', () => {
      const result = detectKeyword('IGP-PDE-001');
      expect(result.isKeyword).toBe(false);
      expect(result.type).toBe(null);
    });

    it('should handle empty query', () => {
      const result = detectKeyword('');
      expect(result.isKeyword).toBe(false);
      expect(result.type).toBe(null);
    });

    it('should handle whitespace-only query', () => {
      const result = detectKeyword('   ');
      expect(result.isKeyword).toBe(false);
      expect(result.type).toBe(null);
    });
  });

  describe('Case Insensitivity', () => {
    it('should detect "RETARD" (uppercase)', () => {
      const result = detectKeyword('RETARD');
      expect(result.isKeyword).toBe(true);
      expect(result.type).toBe('overdue');
    });

    it('should detect "Urgent" (mixed case)', () => {
      const result = detectKeyword('Urgent');
      expect(result.isKeyword).toBe(true);
      expect(result.type).toBe('priority_critical');
    });

    it('should detect "CoMmEnTaIrE" (random case)', () => {
      const result = detectKeyword('CoMmEnTaIrE');
      expect(result.isKeyword).toBe(true);
      expect(result.type).toBe('comments');
    });
  });
});

describe('Search Edge Cases', () => {
  it('should trim whitespace from query', () => {
    const result = detectKeyword('  retard  ');
    expect(result.isKeyword).toBe(true);
    expect(result.type).toBe('overdue');
  });

  it('should handle accented characters', () => {
    const result = detectKeyword('terminé');
    expect(result.isKeyword).toBe(true);
    expect(result.type).toBe('status_completed');
  });

  it('should distinguish between similar words', () => {
    // "retard" is keyword
    const retard = detectKeyword('retard');
    expect(retard.isKeyword).toBe(true);
    
    // "retardement" is NOT keyword
    const retardement = detectKeyword('retardement');
    expect(retardement.isKeyword).toBe(false);
  });
});
