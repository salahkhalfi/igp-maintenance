/**
 * 🏢 SECRÉTARIAT IA - Module Principal
 * 
 * Architecture multi-cerveaux spécialisés pour la génération de documents
 * professionnels de haute qualité.
 * 
 * Chaque type de document est traité par un cerveau expert dans son domaine,
 * recevant uniquement les données pertinentes pour sa tâche.
 */

import type { DocumentType, SecretaryContext, CompanyIdentity, BrainResult } from './types';
import { formatDateFrCA } from './shared';

// Cerveaux spécialisés
import buildRapportsBrain from './brains/rapports';
import buildSubventionsBrain from './brains/subventions';
import buildRHBrain from './brains/rh';
import buildTechniqueBrain from './brains/technique';
import buildCorrespondanceBrain from './brains/correspondance';
import buildCreatifBrain from './brains/creatif';

// Data loaders
import {
  loadRapportsData,
  loadSubventionsData,
  loadRHData,
  loadTechniqueData,
  loadCreatifData
} from './data/loaders';

export type { DocumentType, SecretaryContext, CompanyIdentity, BrainResult };

/**
 * Point d'entrée principal du Secrétariat IA
 * 
 * @param documentType - Type de document à générer
 * @param db - Instance de la base de données
 * @param companyIdentity - Identité de l'entreprise depuis le "Cerveau de l'IA"
 * @param baseUrl - URL de base de l'application
 * @param options - Options supplémentaires (machineId, employeeId, etc.)
 * @returns BrainResult avec le prompt système et les données contextuelles
 */
export async function prepareSecretary(
  documentType: DocumentType,
  env: any,  // Cloudflare Workers env with env.DB for D1 access
  companyIdentity: CompanyIdentity,
  baseUrl: string = '',
  options: {
    machineId?: number;
    employeeId?: number;
  } = {}
): Promise<BrainResult> {
  
  console.log(`🧠 [Secretary] Activating brain for: ${documentType}`);
  
  // Extraire le nom du directeur depuis hierarchy (ex: "Directeur des Opérations : Marc Bélanger")
  let directorName = 'La Direction';
  let directorTitle = 'Directeur des Opérations';
  const hierarchy = companyIdentity.hierarchy || '';
  const directorMatch = hierarchy.match(/Directeur[^:]*:\s*([A-ZÀ-Ü][a-zà-ü]+\s+[A-ZÀ-Ü][a-zà-ü]+)/i);
  if (directorMatch) {
    directorName = directorMatch[1].trim();
    // Extraire aussi le titre si présent
    const titleMatch = hierarchy.match(/(Directeur[^:]*?):\s*/i);
    if (titleMatch) {
      directorTitle = titleMatch[1].trim();
    }
  }
  console.log(`🧠 [Secretary] Director: ${directorName}, ${directorTitle}`);
  
  const context: SecretaryContext = {
    company: companyIdentity,
    today: formatDateFrCA(),
    baseUrl,
    directorName,
    directorTitle
  };

  // Router vers le cerveau approprié avec ses données
  switch (documentType) {
    case 'rapports': {
      console.log(`📊 [Secretary] Loading maintenance report data...`);
      const data = await loadRapportsData(env);
      console.log(`📊 [Secretary] Data loaded: ${data.statsThisMonth.total} tickets this month, ${data.technicianPerformance.length} technicians`);
      return buildRapportsBrain(context, data);
    }

    case 'subventions': {
      console.log(`💰 [Secretary] Loading grants/subsidy data...`);
      const data = await loadSubventionsData(env);
      console.log(`💰 [Secretary] Data loaded: ${data.effectifTotal} employees, ${data.machinesTotal} machines`);
      return buildSubventionsBrain(context, data);
    }

    case 'rh': {
      console.log(`👥 [Secretary] Loading HR data...`);
      const data = await loadRHData(env, options.employeeId);
      console.log(`👥 [Secretary] Data loaded: ${data.employees.length} employees`);
      return buildRHBrain(context, data);
    }

    case 'technique': {
      console.log(`🔧 [Secretary] Loading technical data...`);
      const data = await loadTechniqueData(env, options.machineId);
      console.log(`🔧 [Secretary] Data loaded: ${data.machines.length} machines`);
      return buildTechniqueBrain(context, data);
    }

    case 'correspondance': {
      console.log(`📧 [Secretary] Preparing correspondence brain...`);
      // La correspondance n'a besoin que de l'identité entreprise
      return buildCorrespondanceBrain(context, {});
    }

    case 'creatif':
    default: {
      console.log(`✨ [Secretary] Loading creative data...`);
      const data = await loadCreatifData(env);
      console.log(`✨ [Secretary] Data loaded: ${data.teamSize} team members`);
      return buildCreatifBrain(context, data);
    }
  }
}

/**
 * Détecter le type de document à partir des instructions de l'utilisateur
 * Plus de mots-clés = meilleure détection
 */
export function detectDocumentType(instructions: string): DocumentType {
  const lower = instructions.toLowerCase();
  
  // ===== RAPPORTS DE MAINTENANCE =====
  // Priorité haute car mots-clés spécifiques
  if (
    (lower.includes('rapport') && (
      lower.includes('maintenance') ||
      lower.includes('mensuel') ||
      lower.includes('hebdomadaire') ||
      lower.includes('annuel') ||
      lower.includes('trimestriel') ||
      lower.includes('kpi') ||
      lower.includes('performance') ||
      lower.includes('activité') ||
      lower.includes('opération')
    )) ||
    lower.includes('bilan maintenance') ||
    lower.includes('bilan technique') ||
    lower.includes('état des machines') ||
    lower.includes('état du parc') ||
    lower.includes('statistiques maintenance') ||
    lower.includes('indicateurs maintenance') ||
    lower.includes('tableau de bord') ||
    lower.includes('dashboard maintenance') ||
    lower.includes('suivi des tickets') ||
    lower.includes('analyse des pannes') ||
    lower.includes('temps de résolution') ||
    lower.includes('taux de résolution') ||
    lower.includes('performance technicien') ||
    lower.includes('productivité équipe')
  ) {
    return 'rapports';
  }

  // ===== SUBVENTIONS & FINANCEMENT GOUVERNEMENTAL =====
  if (
    lower.includes('subvention') ||
    lower.includes('pari-cnrc') ||
    lower.includes('pari cnrc') ||
    lower.includes('pari') ||
    lower.includes('rs&de') ||
    lower.includes('rsde') ||
    lower.includes('r&d') ||
    lower.includes('crédit d\'impôt') ||
    lower.includes('credit d\'impot') ||
    lower.includes('crédit impôt') ||
    lower.includes('investissement québec') ||
    lower.includes('investissement quebec') ||
    lower.includes('emploi-québec') ||
    lower.includes('emploi quebec') ||
    lower.includes('écoleader') ||
    lower.includes('fonds vert') ||
    lower.includes('innovation') && lower.includes('financement') ||
    lower.includes('aide gouvernementale') ||
    lower.includes('programme gouvernemental') ||
    lower.includes('demande de') && (lower.includes('aide') || lower.includes('fonds')) ||
    lower.includes('dossier de financement')
  ) {
    return 'subventions';
  }

  // ===== RESSOURCES HUMAINES =====
  if (
    lower.includes('offre d\'emploi') ||
    lower.includes('offre emploi') ||
    lower.includes('poste à combler') ||
    lower.includes('recrutement') ||
    lower.includes('embauche') ||
    lower.includes('embaucher') ||
    lower.includes('contrat de travail') ||
    lower.includes('contrat travail') ||
    lower.includes('lettre d\'embauche') ||
    lower.includes('employé') ||
    lower.includes('salarié') ||
    lower.includes('disciplinaire') ||
    lower.includes('avertissement') && lower.includes('employé') ||
    lower.includes('congédiement') ||
    lower.includes('licenciement') ||
    lower.includes('fin d\'emploi') ||
    lower.includes('démission') ||
    lower.includes('départ') && lower.includes('employé') ||
    lower.includes('évaluation') && (lower.includes('performance') || lower.includes('employé') || lower.includes('annuelle')) ||
    lower.includes('ressources humaines') ||
    lower.includes('rh') ||
    lower.includes('formation employé') ||
    lower.includes('intégration') && lower.includes('employé') ||
    lower.includes('description de poste') ||
    lower.includes('fiche de poste') ||
    lower.includes('profil recherché') ||
    lower.includes('entrevue') ||
    lower.includes('candidat')
  ) {
    return 'rh';
  }

  // ===== DOCUMENTS TECHNIQUES =====
  if (
    lower.includes('procédure') ||
    lower.includes('mode opératoire') ||
    lower.includes('instruction de travail') ||
    lower.includes('sop') ||
    lower.includes('fiche technique') ||
    lower.includes('fiche') && lower.includes('machine') ||
    lower.includes('cadenassage') ||
    lower.includes('lockout') ||
    lower.includes('consignation') ||
    lower.includes('sécurité machine') ||
    lower.includes('maintenance préventive') ||
    lower.includes('maintenance corrective') ||
    lower.includes('checklist') ||
    lower.includes('check-list') ||
    lower.includes('liste de vérification') ||
    lower.includes('inspection') ||
    lower.includes('guide d\'utilisation') ||
    lower.includes('manuel') && (lower.includes('machine') || lower.includes('équipement') || lower.includes('utilisation')) ||
    lower.includes('spécification technique') ||
    lower.includes('fiche de données') ||
    lower.includes('fds') ||
    lower.includes('msds') ||
    lower.includes('protocole') && (lower.includes('maintenance') || lower.includes('sécurité') || lower.includes('intervention'))
  ) {
    return 'technique';
  }

  // ===== CORRESPONDANCE OFFICIELLE =====
  if (
    lower.includes('lettre') ||
    lower.includes('correspondance') ||
    lower.includes('courriel officiel') ||
    lower.includes('courriel formel') ||
    lower.includes('email officiel') ||
    lower.includes('courrier') ||
    lower.includes('demande officielle') ||
    lower.includes('réclamation') ||
    lower.includes('plainte') ||
    lower.includes('mise en demeure') ||
    lower.includes('réponse à') && (lower.includes('fournisseur') || lower.includes('client') || lower.includes('partenaire')) ||
    lower.includes('proposition commerciale') ||
    lower.includes('offre de service') ||
    lower.includes('partenariat') ||
    lower.includes('remerciement') && (lower.includes('client') || lower.includes('partenaire') || lower.includes('fournisseur')) ||
    lower.includes('invitation officielle') ||
    lower.includes('convocation') ||
    lower.includes('avis officiel') ||
    lower.includes('notification')
  ) {
    return 'correspondance';
  }

  // ===== CRÉATIF (marketing, communication) =====
  // Détection explicite avant le fallback
  if (
    lower.includes('communiqué') ||
    lower.includes('communique') ||
    lower.includes('presse') ||
    lower.includes('site web') ||
    lower.includes('page web') ||
    lower.includes('texte promotionnel') ||
    lower.includes('marketing') ||
    lower.includes('publicité') ||
    lower.includes('pub') ||
    lower.includes('slogan') ||
    lower.includes('accroche') ||
    lower.includes('pitch') ||
    lower.includes('présentation commerciale') ||
    lower.includes('discours') ||
    lower.includes('allocution') ||
    lower.includes('mot du directeur') ||
    lower.includes('mot de bienvenue') ||
    lower.includes('message de la direction') ||
    lower.includes('infolettre') ||
    lower.includes('newsletter') ||
    lower.includes('brochure') ||
    lower.includes('dépliant') ||
    lower.includes('flyer') ||
    lower.includes('affiche') ||
    lower.includes('annonce') && !lower.includes('emploi') ||
    lower.includes('réseaux sociaux') ||
    lower.includes('facebook') ||
    lower.includes('linkedin') ||
    lower.includes('post') && (lower.includes('social') || lower.includes('linkedin') || lower.includes('facebook')) ||
    lower.includes('storytelling') ||
    lower.includes('copywriting') ||
    lower.includes('contenu') && (lower.includes('web') || lower.includes('marketing'))
  ) {
    return 'creatif';
  }

  // Par défaut: créatif (le plus flexible)
  return 'creatif';
}

/**
 * Obtenir la liste des outils recommandés pour un type de document
 */
export function getRecommendedTools(documentType: DocumentType): string[] {
  switch (documentType) {
    case 'rapports':
      return ['check_database_stats', 'search_tickets', 'get_overdue_tickets', 'generate_team_report', 'search_machines'];
    case 'subventions':
      return ['list_users', 'search_machines', 'check_database_stats'];
    case 'rh':
      return ['list_users', 'get_user_details', 'get_technician_info'];
    case 'technique':
      return ['search_machines', 'get_machine_details', 'search_tickets', 'get_ticket_details'];
    case 'correspondance':
      return [];  // Pas d'outils nécessaires
    case 'creatif':
    default:
      return [];  // Créativité avant tout
  }
}

/**
 * Obtenir la description d'un type de document
 */
export function getDocumentTypeDescription(documentType: DocumentType): string {
  const descriptions: Record<DocumentType, string> = {
    'rapports': 'Rapport de maintenance - Analyse pour direction/CA',
    'subventions': 'Demande de subvention gouvernementale',
    'rh': 'Document ressources humaines (contrat, avis, politique)',
    'technique': 'Document technique (procédure, fiche, rapport d\'intervention)',
    'correspondance': 'Correspondance officielle (lettre, courriel formel)',
    'creatif': 'Document créatif (communiqué, site web, discours, pitch)'
  };
  return descriptions[documentType];
}

// Export des types et utilitaires
export { formatDateFrCA };
