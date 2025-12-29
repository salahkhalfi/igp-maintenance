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
 */
export function detectDocumentType(instructions: string): DocumentType {
  const lower = instructions.toLowerCase();
  
  // Rapports de maintenance
  if (
    lower.includes('rapport') && (
      lower.includes('maintenance') ||
      lower.includes('mensuel') ||
      lower.includes('hebdomadaire') ||
      lower.includes('kpi') ||
      lower.includes('performance')
    )
  ) {
    return 'rapports';
  }

  // Subventions
  if (
    lower.includes('subvention') ||
    lower.includes('pari') ||
    lower.includes('rs&de') ||
    lower.includes('rsde') ||
    lower.includes('crédit d\'impôt') ||
    lower.includes('financement') ||
    lower.includes('demande de') && lower.includes('aide')
  ) {
    return 'subventions';
  }

  // RH
  if (
    lower.includes('contrat') ||
    lower.includes('embauche') ||
    lower.includes('employé') ||
    lower.includes('disciplinaire') ||
    lower.includes('congédiement') ||
    lower.includes('évaluation') && lower.includes('performance') ||
    lower.includes('ressources humaines') ||
    lower.includes('rh')
  ) {
    return 'rh';
  }

  // Technique
  if (
    lower.includes('procédure') ||
    lower.includes('technique') ||
    lower.includes('sop') ||
    lower.includes('fiche') && lower.includes('machine') ||
    lower.includes('cadenassage') ||
    lower.includes('intervention') ||
    lower.includes('maintenance préventive')
  ) {
    return 'technique';
  }

  // Correspondance
  if (
    lower.includes('lettre') ||
    lower.includes('correspondance') ||
    lower.includes('courriel') && (lower.includes('officiel') || lower.includes('formel')) ||
    lower.includes('demande officielle') ||
    lower.includes('réclamation')
  ) {
    return 'correspondance';
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
