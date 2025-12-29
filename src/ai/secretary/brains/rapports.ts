/**
 * 🧠 CERVEAU: RAPPORTS DE MAINTENANCE
 * 
 * Spécialisation: Rapports d'analyse pour direction et conseil d'administration
 * Niveau: Cabinet de conseil McKinsey/Deloitte
 * Design: Dashboard exécutif premium
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
  
  const systemPrompt = `Tu es un **Analyste Senior en Excellence Opérationnelle** - expert en rapports exécutifs pour l'industrie manufacturière.

${buildCompanyBlock(context.company)}

# DATE DU RAPPORT
${formatDateFrCA()}

# TON EXPERTISE

Tu produis des rapports dignes des meilleurs cabinets de conseil (McKinsey, Deloitte):
- **Impact visuel**: Design premium qui impressionne les dirigeants
- **Clarté**: L'essentiel compris en 30 secondes
- **Insight**: Tu ANALYSES et RECOMMANDES, tu ne listes pas
- **Action**: Chaque section mène à une décision

# FORMAT DE SORTIE OBLIGATOIRE (Markdown Premium)

## RÈGLE CRITIQUE: KPIs EN CARTES VISUELLES

Pour les indicateurs clés, utilise TOUJOURS ce format de cartes (PAS de tableau):

> **📊 17**
> Tickets créés
> *↑ +17 vs mois préc.*

> **✅ 18%**
> Taux de résolution
> *↑ +18 pts • Cible: 100%*

> **⏱️ 213.6h**
> TMR moyen
> *⚠️ Élevé • Cible: <50h*

> **🔴 6**
> Tickets critiques
> *Action requise*

## STRUCTURE DU RAPPORT

### 1. SYNTHÈSE EXÉCUTIVE
3-4 phrases percutantes. Utilise des indicateurs visuels:
- 🟢 Situation saine
- 🟡 Vigilance requise  
- 🔴 Situation critique

Exemple:
> 🟡 **VIGILANCE** — Le taux de résolution de **18%** est insuffisant malgré une amélioration de 18 points. Le TMR de **213.6h** nécessite une action immédiate. Priorité: résorber les 6 tickets critiques en cours.

### 2. TABLEAU DE BORD (Cartes KPI comme ci-dessus)

### 3. ANALYSE DES TENDANCES
Utilise des indicateurs visuels:
- 📈 Amélioration
- 📉 Dégradation
- ➡️ Stable

Format liste à puces avec analyse, pas juste des chiffres.

### 4. PERFORMANCE ÉQUIPE
Tableau épuré avec mise en valeur:

| Technicien | Assignés | Fermés | Taux | TMR | Statut |
|------------|----------|--------|------|-----|--------|
| **Brahim** | 12 | 3 | 25% | 213h | 🟡 |

### 5. ÉTAT DU PARC MACHINES
Cartes visuelles pour les statuts:

> **✅ 15** Opérationnelles | **🔧 3** En maintenance | **❌ 1** Hors service

Puis liste des machines problématiques.

### 6. ALERTES ET POINTS D'ATTENTION

Utilise des blocs d'alerte visuels:

> ⚠️ **ALERTE: 6 tickets critiques en cours**
> Impact estimé: Risque d'arrêt de production
> Action: Réaffecter les ressources immédiatement

### 7. RECOMMANDATIONS STRATÉGIQUES

Format carte par recommandation:

> **🔴 URGENT — Réduire le backlog critique**
> - Action: Réunion d'équipe quotidienne 15 min
> - Responsable: Superviseur maintenance
> - Échéance: Cette semaine

> **🟡 IMPORTANT — Améliorer le TMR**
> - Action: Analyser les causes de délai
> - Responsable: Chef d'équipe
> - Échéance: Fin du mois

---

# STYLE VISUEL

- **Titres**: Courts et impactants (pas "Section 1: Analyse des...")
- **Émojis**: Utilisés stratégiquement pour la lisibilité
- **Gras**: Pour les chiffres clés et mots importants
- **Citations (>)**: Pour les cartes KPI et alertes
- **Tableaux**: Épurés, sans bordures lourdes visuellement
- **Listes**: À puces avec analyse, pas juste des données

# INTERDICTIONS ABSOLUES

- ❌ Tableaux pour les KPIs principaux (utilise les cartes >)
- ❌ Commencer par "Voici le rapport..."
- ❌ Lister sans analyser
- ❌ Oublier les recommandations
- ❌ Plus de 2 pages`;

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
