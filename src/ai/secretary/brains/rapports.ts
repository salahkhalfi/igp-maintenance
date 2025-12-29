/**
 * 🧠 CERVEAU: RAPPORTS DE MAINTENANCE
 * 
 * Spécialisation: Rapports d'analyse pour direction et conseil d'administration
 * Niveau: Cabinet de conseil McKinsey/Deloitte
 * 
 * Ce cerveau génère des rapports stratégiques avec:
 * - Synthèse exécutive percutante
 * - KPIs visuels et comparatifs
 * - Analyse des tendances
 * - Recommandations actionnables priorisées
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
  
  const systemPrompt = `Tu es un **Analyste Senior en Excellence Opérationnelle** - spécialiste des rapports de direction pour l'industrie manufacturière.

${buildCompanyBlock(context.company)}

# TON EXPERTISE

Tu produis des rapports dignes des plus grands cabinets de conseil:
- **Clarté**: Un dirigeant pressé comprend l'essentiel en 30 secondes
- **Précision**: Chaque chiffre est exact et sourcé
- **Insight**: Tu ne listes pas, tu ANALYSES et tu RECOMMANDES
- **Action**: Chaque section mène à une décision

# DATE DU RAPPORT
${formatDateFrCA()}

${QUALITY_RULES}

# STRUCTURE OBLIGATOIRE DU RAPPORT

## 1. SYNTHÈSE EXÉCUTIVE (CRITIQUE)
3-4 phrases MAXIMUM. Un dirigeant qui ne lit que cette section doit comprendre:
- La situation globale (bonne/préoccupante/critique)
- Le chiffre clé du mois
- L'action prioritaire

## 2. TABLEAU DE BORD - INDICATEURS CLÉS
Format tableau obligatoire:
| Indicateur | Ce mois | Mois précédent | Évolution | Cible |
Inclure: Tickets créés, Taux résolution, TMR, Tickets critiques

## 3. ANALYSE DES TENDANCES
- Graphique mental: ↗️ hausse, ↘️ baisse, → stable
- Explication des variations
- Comparaison avec les objectifs

## 4. PERFORMANCE DE L'ÉQUIPE
Tableau par technicien avec classement implicite (du plus performant au moins)
Mettre en valeur les réussites, identifier les besoins de support

## 5. ÉTAT DU PARC MACHINES
- Taux de disponibilité global
- Machines problématiques (top 3-5 par nombre d'interventions)
- Alertes sur équipements critiques

## 6. POINTS D'ATTENTION CRITIQUES
⚠️ Format visuel avec icônes
- Tickets en retard avec impact estimé
- Risques identifiés
- Urgences à traiter

## 7. RECOMMANDATIONS STRATÉGIQUES
3-5 recommandations ACTIONNABLES avec:
- Priorité (🔴 Urgent / 🟡 Important / 🟢 Amélioration)
- Action concrète
- Responsable suggéré
- Échéance recommandée

# TON STYLE

- Professionnel mais pas ennuyeux
- Utilise des émojis pour la lisibilité (📊 📈 ⚠️ ✅ 🔧)
- Mets en **gras** les chiffres importants
- Utilise > pour les citations/highlights importants
- Tableaux alignés et propres

# INTERDICTIONS ABSOLUES
- ❌ Inventer des données
- ❌ Commencer par "Voici le rapport..."
- ❌ Lister sans analyser
- ❌ Oublier les recommandations
- ❌ Dépasser 2 pages pour le corps principal`;

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
              📊 DONNÉES DE MAINTENANCE - BASE FACTUELLE
═══════════════════════════════════════════════════════════════

## PÉRIODE: CE MOIS

| Métrique | Valeur |
|----------|--------|
| Tickets créés | ${statsThisMonth.total} |
| Tickets fermés | ${statsThisMonth.closed} |
| Tickets en cours | ${statsThisMonth.open} |
| Taux de résolution | ${statsThisMonth.resolutionRate}% |
| TMR moyen | ${statsThisMonth.avgResolutionHours}h |

### Répartition par priorité
- 🔴 Critique: ${statsThisMonth.byPriority.critical}
- 🟠 Haute: ${statsThisMonth.byPriority.high}
- 🟡 Moyenne: ${statsThisMonth.byPriority.medium}
- 🟢 Basse: ${statsThisMonth.byPriority.low}

### Répartition par statut
${Object.entries(statsThisMonth.byStatus).map(([s, c]) => `- ${s}: ${c}`).join('\n')}

---

## PÉRIODE: MOIS PRÉCÉDENT (COMPARAISON)

| Métrique | Valeur |
|----------|--------|
| Tickets créés | ${statsLastMonth.total} |
| Tickets fermés | ${statsLastMonth.closed} |
| Taux de résolution | ${statsLastMonth.resolutionRate}% |
| TMR moyen | ${statsLastMonth.avgResolutionHours}h |

### Évolutions
- Volume tickets: ${ticketVariation > 0 ? '+' : ''}${ticketVariation}%
- Taux résolution: ${resolutionVariation > 0 ? '+' : ''}${resolutionVariation} points

---

## PERFORMANCE ÉQUIPE TECHNIQUE (3 derniers mois)

${technicianPerformance.length === 0 ? '*Aucun technicien enregistré*' : 
technicianPerformance.map(t => `
**${t.name}** (${t.role})
| Assignés | Fermés | Taux | TMR | En cours |
|----------|--------|------|-----|----------|
| ${t.ticketsAssigned} | ${t.ticketsClosed} | ${t.resolutionRate}% | ${t.avgResolutionHours}h | ${t.currentOpenTickets} |
`).join('\n')}

---

## PARC MACHINES

**Total**: ${totalMachines} machines
- ✅ Opérationnelles: ${machinesByStatus.operational}
- 🔧 En maintenance: ${machinesByStatus.maintenance}
- ❌ Hors service: ${machinesByStatus.out_of_service}

### Machines avec le plus d'interventions
${machinePerformance.filter(m => m.ticketsCount > 0).slice(0, 10).map((m, i) => `
${i + 1}. **${m.name}** (${m.location || 'N/A'})
   - Interventions: ${m.ticketsCount} | En cours: ${m.openTickets} | Arrêt: ${m.downtimeHours}h
   - Problèmes fréquents: ${m.commonIssues.slice(0, 3).join(', ') || 'N/A'}
`).join('') || '*Aucune intervention enregistrée*'}

---

## ⚠️ TICKETS EN RETARD (ouverts > 7 jours)

**Total**: ${overdueTickets.length}

${overdueTickets.length === 0 ? '✅ *Aucun ticket en retard*' :
overdueTickets.slice(0, 10).map(t => `
- **${t.id}**: ${t.title}
  - Priorité: ${t.priority} | Statut: ${t.status}
  - Machine: ${t.machineName || 'N/A'} | Assigné: ${t.assignedTo || 'Non assigné'}
  - Ouvert depuis: ${t.daysOpen} jours
`).join('')}

---

## 🔴 TICKETS CRITIQUES/HAUTE PRIORITÉ EN COURS

${criticalTickets.length === 0 ? '✅ *Aucun ticket critique en cours*' :
criticalTickets.map(t => `
- **${t.id}**: ${t.title}
  - Priorité: ${t.priority} | Machine: ${t.machineName || 'N/A'}
  - Assigné: ${t.assignedTo || 'Non assigné'}
`).join('')}

═══════════════════════════════════════════════════════════════
              FIN DES DONNÉES FACTUELLES
═══════════════════════════════════════════════════════════════
`.trim();
}

export default buildRapportsBrain;
