/**
 * 🧠 CERVEAU: RAPPORTS DE MAINTENANCE
 * 
 * Spécialisation: Rapports d'analyse pour direction et conseil d'administration
 * Style: Document officiel professionnel (pas dashboard/présentation)
 */

import type { SecretaryContext, RapportsData, BrainResult } from '../types';
import { buildCompanyBlock, formatDateFrCA, QUALITY_RULES } from '../shared';

/**
 * Générer le prompt système pour les rapports
 */
export function buildRapportsBrain(
  context: SecretaryContext,
  data: RapportsData
): BrainResult {
  
  const systemPrompt = `Tu es un **Analyste Senior** spécialisé dans la rédaction de rapports officiels pour la direction et le conseil d'administration.

${buildCompanyBlock(context.company)}

# DATE DU RAPPORT
${formatDateFrCA()}

# STYLE DU DOCUMENT

Tu rédiges un **RAPPORT OFFICIEL** destiné à être:
- Imprimé sur papier
- Présenté en réunion de direction/CA
- Archivé comme document de référence

CE N'EST PAS:
- Un dashboard web
- Une présentation PowerPoint
- Une infographie

# FORMAT OBLIGATOIRE

## Structure du document

### 1. SYNTHÈSE EXÉCUTIVE
Un paragraphe de 4-5 phrases rédigées (pas de puces). 
Doit répondre à: Quelle est la situation? Quel est le problème principal? Quelle action prioritaire?

### 2. INDICATEURS CLÉS DU MOIS
**Format tableau classique obligatoire:**

| Indicateur | Ce mois | Mois précédent | Variation | Cible |
|------------|---------|----------------|-----------|-------|
| Tickets créés | 17 | 0 | +17 | - |
| Taux de résolution | 18% | 0% | +18 pts | 100% |
| Temps moyen de résolution | 213.6h | - | - | <24h |
| Tickets critiques en cours | 6 | - | - | 0 |

### 3. ANALYSE DES TENDANCES
Paragraphes rédigés analysant:
- L'évolution du volume de tickets
- L'évolution du taux de résolution
- Les causes identifiées

### 4. PERFORMANCE DE L'ÉQUIPE TECHNIQUE
**Tableau:**

| Technicien | Tickets assignés | Tickets fermés | Taux de résolution | TMR |
|------------|------------------|----------------|--------------------|----- |
| Nom Prénom | X | Y | Z% | Xh |

Suivi d'un paragraphe d'analyse.

### 5. ÉTAT DU PARC MACHINES
**Tableau récapitulatif:**

| Statut | Nombre | Pourcentage |
|--------|--------|-------------|
| Opérationnelles | X | X% |
| En maintenance | X | X% |
| Hors service | X | X% |

Liste des machines nécessitant attention (si applicable).

### 6. POINTS D'ATTENTION
Liste des problèmes critiques sous forme de paragraphes:

**Problème 1: [Titre]**
Description détaillée et impact sur les opérations.

**Problème 2: [Titre]**
Description détaillée et impact sur les opérations.

### 7. RECOMMANDATIONS
**Format tableau obligatoire pour les recommandations:**

| # | Recommandation | Priorité | Action requise | Responsable | Échéance |
|---|----------------|----------|----------------|-------------|----------|
| 1 | Titre court | Haute | Description de l'action | Fonction | Date |
| 2 | Titre court | Moyenne | Description de l'action | Fonction | Date |
| 3 | Titre court | Basse | Description de l'action | Fonction | Date |

Suivi d'un paragraphe justifiant les priorités si nécessaire.

---

# RÈGLES DE RÉDACTION

- **Ton**: Professionnel, factuel, sobre
- **Phrases**: Complètes et rédigées (pas de style télégraphique)
- **Chiffres**: Toujours en contexte avec analyse
- **Tableaux**: Propres, alignés, avec en-têtes clairs
- **Pas d'émojis** sauf dans les indicateurs de priorité (●)
- **Gras**: Uniquement pour les titres et chiffres clés
- **Pas de blocs citation (>)** - c'est un document, pas un email

# INDICATEURS DE PRIORITÉ (si nécessaire)
- ● Critique (rouge dans l'esprit)
- ● Important (orange dans l'esprit)  
- ● Normal (vert dans l'esprit)

# INTERDICTIONS

- ❌ Émojis décoratifs (📊 ✅ etc.)
- ❌ Blocs de citation pour les KPIs
- ❌ Style "carte" ou "dashboard"
- ❌ Commencer par "Voici le rapport..."
- ❌ Lister sans analyser
- ❌ Style informel ou conversationnel`;

  // Construire le contexte de données formaté
  const contextData = buildRapportsContext(data);

  return {
    systemPrompt,
    contextData,
    tools: [
      'check_database_stats',
      'search_tickets', 
      'get_overdue_tickets',
      'generate_team_report',
      'search_machines'
    ],
    maxTokens: 8000,
    temperature: 0.3
  };
}

/**
 * Construire le contexte de données pour les rapports
 */
function buildRapportsContext(data: RapportsData): string {
  const {
    statsThisMonth,
    statsLastMonth,
    ticketVariation,
    resolutionVariation,
    technicianPerformance,
    machinePerformance,
    overdueTickets,
    criticalTickets,
    totalMachines,
    machinesByStatus
  } = data;

  return `
═══════════════════════════════════════════════════════════════
              📊 DONNÉES FACTUELLES - À UTILISER
═══════════════════════════════════════════════════════════════

## CE MOIS

- Tickets créés: ${statsThisMonth.total}
- Tickets fermés: ${statsThisMonth.closed}
- Tickets en cours: ${statsThisMonth.open}
- Taux de résolution: ${statsThisMonth.resolutionRate}%
- TMR moyen: ${statsThisMonth.avgResolutionHours}h

Priorités:
- Critique: ${statsThisMonth.byPriority.critical}
- Haute: ${statsThisMonth.byPriority.high}
- Moyenne: ${statsThisMonth.byPriority.medium}
- Basse: ${statsThisMonth.byPriority.low}

## MOIS PRÉCÉDENT

- Tickets créés: ${statsLastMonth.total}
- Tickets fermés: ${statsLastMonth.closed}
- Taux de résolution: ${statsLastMonth.resolutionRate}%
- TMR moyen: ${statsLastMonth.avgResolutionHours}h

## ÉVOLUTIONS

- Volume: ${ticketVariation > 0 ? '+' : ''}${ticketVariation}%
- Résolution: ${resolutionVariation > 0 ? '+' : ''}${resolutionVariation} points

## ÉQUIPE TECHNIQUE

${technicianPerformance.length === 0 ? 'Aucun technicien' : 
technicianPerformance.map(t => 
`${t.name} (${t.role}): ${t.ticketsAssigned} assignés, ${t.ticketsClosed} fermés, ${t.resolutionRate}% résolution, TMR ${t.avgResolutionHours}h, ${t.currentOpenTickets} en cours`
).join('\n')}

## PARC MACHINES

Total: ${totalMachines}
- Opérationnelles: ${machinesByStatus.operational}
- En maintenance: ${machinesByStatus.maintenance}
- Hors service: ${machinesByStatus.out_of_service}

Top machines par interventions:
${machinePerformance.filter(m => m.ticketsCount > 0).slice(0, 5).map((m, i) => 
`${i + 1}. ${m.name} (${m.location || 'N/A'}): ${m.ticketsCount} interventions, ${m.openTickets} en cours`
).join('\n') || 'Aucune'}

## TICKETS EN RETARD (>7 jours): ${overdueTickets.length}

${overdueTickets.slice(0, 10).map(t => 
`- ${t.id}: ${t.title} | ${t.priority} | ${t.assignedTo || 'Non assigné'} | ${t.daysOpen}j`
).join('\n') || 'Aucun'}

## TICKETS CRITIQUES/HAUTE: ${criticalTickets.length}

${criticalTickets.slice(0, 10).map(t => 
`- ${t.id}: ${t.title} | ${t.priority} | ${t.assignedTo || 'Non assigné'}`
).join('\n') || 'Aucun'}

═══════════════════════════════════════════════════════════════
`.trim();
}

export default buildRapportsBrain;
