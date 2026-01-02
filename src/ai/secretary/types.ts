/**
 * Types pour le module Secrétariat IA
 * Architecture multi-cerveaux spécialisés
 */

export type DocumentType = 
  | 'rapports'
  | 'subventions'
  | 'correspondance'
  | 'rh'
  | 'technique'
  | 'creatif';

export interface CompanyIdentity {
  name: string;           // Nom officiel (company_name ou fallback company_subtitle)
  shortName: string;      // Nom court (company_short_name)
  subtitle: string;       // Legacy: company_subtitle
  address: string;        // Adresse complète (company_address)
  email: string;          // Courriel officiel (company_email)
  phone: string;          // Téléphone (company_phone)
  identity: string;       // Identité IA (aiConfig.identity)
  hierarchy: string;      // Hiérarchie (aiConfig.hierarchy)
  knowledge: string;      // Connaissances (aiConfig.knowledge)
  custom: string;         // Contexte personnalisé (aiConfig.custom)
}

export interface SecretaryContext {
  company: CompanyIdentity;
  today: string;
  baseUrl: string;
  directorName: string;
  directorTitle: string;
}

// === DONNÉES SPÉCIFIQUES PAR TYPE ===

export interface RapportsData {
  statsThisMonth: PeriodStats;
  statsLastMonth: PeriodStats;
  ticketVariation: number;
  resolutionVariation: number;
  technicianPerformance: TechnicianPerf[];
  machinePerformance: MachinePerf[];
  overdueTickets: TicketSummary[];
  criticalTickets: TicketSummary[];
  totalMachines: number;
  machinesByStatus: { operational: number; maintenance: number; out_of_service: number };
}

export interface SubventionsData {
  effectifTotal: number;
  effectifByRole: Record<string, number>;
  machinesTotal: number;
  machinesByType: Record<string, number>;
  equipmentValue?: string;
  recentProjects?: string[];
  ticketsLast12Months: number;
  maintenanceCostsEstimate?: string;
}

export interface CorrespondanceData {
  // Minimal - juste l'identité entreprise
}

export interface RHData {
  employees: EmployeeSummary[];
  employeeDetails?: EmployeeDetail;
  rolesCount: Record<string, number>;
}

export interface TechniqueData {
  machines: MachineTechnical[];
  machineDetails?: MachineTechnical;
  recentTickets?: TicketSummary[];
  procedures?: string[];
}

export interface CreatifData {
  companyStrengths: string[];
  recentAchievements: string[];
  teamSize: number;
  machineCount: number;
  // Données enrichies
  machinesByType?: { type: string; count: number }[];
  employeesByRole?: { role: string; count: number }[];
  maintenanceStats?: {
    ticketsThisMonth: number;
    ticketsResolved: number;
    resolutionRate: number;
    avgResolutionHours: number;
  };
  recentCriticalResolved?: { title: string; resolvedAt: string }[];
}

// === SOUS-TYPES ===

export interface PeriodStats {
  total: number;
  closed: number;
  open: number;
  resolutionRate: number;
  avgResolutionHours: number;
  byPriority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  byStatus: Record<string, number>;
}

export interface TechnicianPerf {
  id: number;
  name: string;
  role: string;
  ticketsAssigned: number;
  ticketsClosed: number;
  resolutionRate: number;
  avgResolutionHours: number;
  currentOpenTickets: number;
  lastLogin: string | null;
}

export interface MachinePerf {
  id: number;
  name: string;
  location: string;
  status: string;
  ticketsCount: number;
  openTickets: number;
  downtimeHours: number;
  commonIssues: string[];
}

export interface TicketSummary {
  id: string;
  title: string;
  priority: string;
  status: string;
  machineName: string | null;
  assignedTo: string | null;
  createdAt: string;
  daysOpen?: number;
}

export interface EmployeeSummary {
  id: number;
  name: string;
  role: string;
  email: string;
  lastLogin: string | null;
}

export interface EmployeeDetail extends EmployeeSummary {
  createdAt: string;
  ticketsAssigned?: number;
  ticketsClosed?: number;
}

export interface MachineTechnical {
  id: number;
  type: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  year: number;
  location: string;
  status: string;
  specs: string;
  operatorName?: string;
}

// === RÉSULTAT DU CERVEAU ===

export interface BrainResult {
  systemPrompt: string;
  contextData: string;
  tools: string[];  // Liste des outils recommandés
  maxTokens: number;
  temperature: number;
}
