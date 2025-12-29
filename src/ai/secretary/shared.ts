/**
 * Ressources partagées entre tous les cerveaux du Secrétariat IA
 */

import type { CompanyIdentity, SecretaryContext } from './types';

/**
 * Formater la date en français québécois
 */
export function formatDateFrCA(date: Date = new Date()): string {
  return date.toLocaleDateString('fr-CA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Construire le bloc d'identité entreprise
 * Utilisé par TOUS les cerveaux
 */
export function buildCompanyBlock(company: CompanyIdentity): string {
  return `
═══════════════════════════════════════════════════════════════
                    ENTREPRISE
═══════════════════════════════════════════════════════════════

**${company.name || 'Entreprise'}**
${company.subtitle || ''}

${company.identity ? `### Identité\n${company.identity}` : ''}
${company.hierarchy ? `### Organisation\n${company.hierarchy}` : ''}
`.trim();
}

/**
 * Règles de qualité communes à tous les cerveaux
 */
export const QUALITY_RULES = `
## STANDARDS DE QUALITÉ

### Langue française
- Qualité Académie française / Office québécois de la langue française
- Terminologie technique exacte
- Pas d'anglicismes inutiles

### Format de sortie
- Markdown professionnel
- Tableaux pour toutes données chiffrées
- Pas de "Voici le document..." - commencer directement
- Prêt à être imprimé ou présenté tel quel

### Données
- UNIQUEMENT les données fournies dans le contexte
- Jamais d'invention ou d'estimation non fondée
- Citer les sources quand applicable
`.trim();

/**
 * Cadre légal québécois - utilisé par RH, Subventions, Technique
 */
export const LEGAL_FRAMEWORK_QC = `
## CADRE LÉGAL QUÉBÉCOIS

### Lois du travail
- **LNT** (Loi sur les normes du travail) - salaires, congés, vacances
- **LSST** (Loi sur la santé et la sécurité du travail) - CNESST
- **LATMP** (Loi sur les accidents du travail et maladies professionnelles)
- **Loi sur l'équité salariale** - entreprises 10+ employés

### Protection des renseignements
- **Loi 25** - Protection des renseignements personnels

### Langue
- **Loi 101** (Charte de la langue française) - affichage, contrats, sécurité en français
`.trim();

/**
 * Programmes de subventions - utilisé par le cerveau Subventions
 */
export const GRANTS_PROGRAMS = `
## PROGRAMMES DE SUBVENTIONS

### FÉDÉRAL

**PARI-CNRC** (Programme d'aide à la recherche industrielle)
- Organisme: Conseil national de recherches Canada
- Cible: PME innovantes
- Financement: Jusqu'à 80% des coûts de projet
- Contact: Conseiller en technologie industrielle (CTI) régional

**RS&DE** (Recherche scientifique et développement expérimental)
- Type: Crédit d'impôt remboursable
- Taux: Jusqu'à 35% pour SPCC
- Dépenses admissibles: Salaires, matériaux, contrats R&D
- Important: Documentation contemporaine obligatoire

**Fonds stratégique pour l'innovation (FSI)**
- Organisme: ISDE Canada
- Montant: Généralement > 10 M$
- Projets: R&D grande échelle, expansion installations

### QUÉBEC

**Investissement Québec**
- ESSOR: Prêt/garantie jusqu'à 50% du projet
- PIVOT: Transformation numérique, IA, automatisation
- Crédit R&D Québec: 14% à 30% selon taille

**Emploi-Québec**
- MFOR: Jusqu'à 50% des coûts de formation
- PRIIME: Intégration immigrants
- Subvention salariale: Employés en difficulté

**Fonds Écoleader**
- But: Développement durable, économie circulaire
- Aide: Jusqu'à 50% (max 100 000$)
`.trim();

/**
 * Normes industrielles - utilisé par Technique
 */
export const INDUSTRIAL_STANDARDS = `
## NORMES INDUSTRIELLES

### Qualité et sécurité
- **ISO 9001** - Système de management de la qualité
- **ISO 14001** - Management environnemental
- **ISO 45001** - Santé et sécurité au travail

### Normes canadiennes
- **CSA** (Association canadienne de normalisation) - Sécurité produits
- **BNQ** (Bureau de normalisation du Québec) - Normes québécoises

### Sécurité machine
- Cadenassage selon CSA Z460
- SIMDUT 2015 (matières dangereuses)
- EPI selon les normes CSA applicables
`.trim();

/**
 * Formules de politesse selon le niveau de formalité
 */
export const SALUTATIONS = {
  gouvernement: "Veuillez agréer, [Titre], l'expression de ma très haute considération.",
  ministre: "Veuillez agréer, [Titre], l'expression de ma haute considération.",
  direction: "Veuillez recevoir, [Titre], mes salutations distinguées.",
  partenaire: "Veuillez agréer mes salutations distinguées.",
  collegue: "Cordialement,",
  interne: "Bien à vous,"
};

/**
 * Labels de rôles en français
 */
export const ROLE_LABELS: Record<string, string> = {
  'admin': 'Administrateur',
  'supervisor': 'Superviseur',
  'director': 'Directeur',
  'coordinator': 'Coordonnateur',
  'planner': 'Planificateur',
  'technician': 'Technicien de maintenance',
  'senior_technician': 'Technicien senior',
  'team_leader': 'Chef d\'équipe',
  'operator': 'Opérateur',
  'furnace_operator': 'Opérateur de fournaise',
  'quality': 'Contrôle qualité'
};

/**
 * Labels de statuts machine
 */
export const MACHINE_STATUS_LABELS: Record<string, string> = {
  'operational': 'Opérationnelle',
  'maintenance': 'En maintenance',
  'out_of_service': 'Hors service',
  'standby': 'En attente'
};
