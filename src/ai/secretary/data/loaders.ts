/**
 * Data Loaders pour le Secrétariat IA
 * 
 * Chaque loader charge UNIQUEMENT les données pertinentes pour son cerveau.
 * Objectif: Minimiser les tokens, maximiser la pertinence.
 * 
 * NOTE: Utilise des requêtes SQL brutes via D1 pour la compatibilité Cloudflare
 */

import type { 
  RapportsData, 
  SubventionsData, 
  RHData, 
  TechniqueData, 
  CreatifData,
  PeriodStats,
  TechnicianPerf,
  MachinePerf,
  TicketSummary,
  EmployeeSummary,
  MachineTechnical
} from '../types';
import { ROLE_LABELS } from '../shared';

/**
 * Récupérer les maps de statuts depuis la config DB
 */
async function getTicketMaps(env: any) {
  const defaultStatusMap: Record<string, string> = {
    'received': 'Nouveau',
    'diagnostic': 'En diagnostic',
    'in_progress': 'En cours',
    'waiting_parts': 'En attente de pièces',
    'completed': 'Terminé',
    'archived': 'Archivé',
    'open': 'Ouvert',
    'resolved': 'Résolu',
    'closed': 'Fermé',
    'pending': 'En attente'
  };

  const defaultPriorityMap: Record<string, string> = {
    'critical': 'Critique',
    'high': 'Haute',
    'medium': 'Moyenne',
    'low': 'Basse'
  };

  let closedStatuses = ['resolved', 'closed', 'completed', 'cancelled', 'archived'];

  try {
    const { results } = await env.DB.prepare(`
      SELECT setting_key, setting_value FROM system_settings 
      WHERE setting_key IN ('ticket_statuses_config', 'ticket_closed_statuses')
    `).all();

    for (const s of results || []) {
      if (s.setting_key === 'ticket_closed_statuses') {
        const parsed = JSON.parse(s.setting_value as string);
        if (Array.isArray(parsed)) closedStatuses = parsed;
      }
      if (s.setting_key === 'ticket_statuses_config') {
        const parsed = JSON.parse(s.setting_value as string);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            if (item.id && item.label) {
              defaultStatusMap[item.id] = item.label;
              if (item.type === 'closed' || item.is_closed) {
                if (!closedStatuses.includes(item.id)) {
                  closedStatuses.push(item.id);
                }
              }
            }
          });
        }
      }
    }
  } catch (e) {
    console.warn('[DataLoader] Could not load ticket config, using defaults');
  }

  return { statusMap: defaultStatusMap, priorityMap: defaultPriorityMap, closedStatuses };
}

/**
 * Calculer les statistiques d'une liste de tickets
 */
function calcStats(ticketList: any[], closedStatuses: string[]): PeriodStats {
  const closed = ticketList.filter(t => closedStatuses.includes(t.status));
  const withResTime = closed.filter(t => t.resolution_time_hours);
  const avgResTime = withResTime.length > 0
    ? withResTime.reduce((sum, t) => sum + t.resolution_time_hours, 0) / withResTime.length
    : 0;

  const byStatus: Record<string, number> = {};
  ticketList.forEach(t => {
    const label = t.status_label || t.status;
    byStatus[label] = (byStatus[label] || 0) + 1;
  });

  return {
    total: ticketList.length,
    closed: closed.length,
    open: ticketList.length - closed.length,
    resolutionRate: ticketList.length > 0 ? Math.round(closed.length / ticketList.length * 100) : 0,
    avgResolutionHours: Math.round(avgResTime * 10) / 10,
    byPriority: {
      critical: ticketList.filter(t => t.priority === 'critical').length,
      high: ticketList.filter(t => t.priority === 'high').length,
      medium: ticketList.filter(t => t.priority === 'medium').length,
      low: ticketList.filter(t => t.priority === 'low').length
    },
    byStatus
  };
}

// ============================================================
//                    LOADER: RAPPORTS
// ============================================================

export async function loadRapportsData(env: any): Promise<RapportsData> {
  if (!env?.DB) {
    throw new Error('Database not available (env.DB is undefined)');
  }
  
  const { statusMap, priorityMap, closedStatuses } = await getTicketMaps(env);
  
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const overdueThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Charger tous les tickets des 3 derniers mois
  const { results: allTickets } = await env.DB.prepare(`
    SELECT id, ticket_id, title, status, priority, machine_id, assigned_to, 
           created_at, completed_at, downtime_hours
    FROM tickets 
    WHERE deleted_at IS NULL AND created_at >= ?
    ORDER BY created_at DESC
  `).bind(threeMonthsAgo.toISOString()).all();

  // Charger utilisateurs
  const { results: allUsers } = await env.DB.prepare(`
    SELECT id, full_name, role, email, last_login
    FROM users WHERE deleted_at IS NULL
  `).all();

  // Charger machines
  const { results: allMachines } = await env.DB.prepare(`
    SELECT id, machine_type, manufacturer, model, location, status
    FROM machines WHERE deleted_at IS NULL
  `).all();

  const userMap = Object.fromEntries((allUsers || []).map((u: any) => [u.id, u]));
  const machineMap = Object.fromEntries((allMachines || []).map((m: any) => [m.id, m]));

  // Enrichir les tickets
  const enrichedTickets = (allTickets || []).map((t: any) => {
    const resTime = t.completed_at && t.created_at
      ? Math.round((new Date(t.completed_at).getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60) * 10) / 10
      : null;
    
    return {
      ...t,
      status_label: statusMap[t.status] || t.status,
      priority_label: priorityMap[t.priority] || t.priority,
      machine_name: t.machine_id && machineMap[t.machine_id]
        ? `${machineMap[t.machine_id].machine_type} ${machineMap[t.machine_id].manufacturer || ''} ${machineMap[t.machine_id].model || ''}`.trim()
        : null,
      assigned_to_name: t.assigned_to && userMap[t.assigned_to] ? userMap[t.assigned_to].full_name : null,
      is_closed: closedStatuses.includes(t.status),
      resolution_time_hours: resTime
    };
  });

  // Séparer par période
  const ticketsThisMonth = enrichedTickets.filter((t: any) => new Date(t.created_at) >= thisMonth);
  const ticketsLastMonth = enrichedTickets.filter((t: any) => {
    const d = new Date(t.created_at);
    return d >= lastMonth && d < thisMonth;
  });

  const statsThisMonth = calcStats(ticketsThisMonth, closedStatuses);
  const statsLastMonth = calcStats(ticketsLastMonth, closedStatuses);

  // Variations
  const ticketVariation = statsLastMonth.total > 0
    ? Math.round((statsThisMonth.total - statsLastMonth.total) / statsLastMonth.total * 100)
    : 0;
  const resolutionVariation = statsThisMonth.resolutionRate - statsLastMonth.resolutionRate;

  // Performance techniciens
  const technicianPerformance: TechnicianPerf[] = (allUsers || [])
    .filter((u: any) => ['technician', 'senior_technician', 'team_leader'].includes(u.role))
    .map((tech: any) => {
      const techTickets = enrichedTickets.filter((t: any) => t.assigned_to === tech.id);
      const closed = techTickets.filter((t: any) => t.is_closed);
      const withResTime = closed.filter((t: any) => t.resolution_time_hours);
      const avgTime = withResTime.length > 0
        ? withResTime.reduce((sum: number, t: any) => sum + t.resolution_time_hours, 0) / withResTime.length
        : 0;

      return {
        id: tech.id,
        name: tech.full_name,
        role: ROLE_LABELS[tech.role] || tech.role,
        ticketsAssigned: techTickets.length,
        ticketsClosed: closed.length,
        resolutionRate: techTickets.length > 0 ? Math.round(closed.length / techTickets.length * 100) : 0,
        avgResolutionHours: Math.round(avgTime * 10) / 10,
        currentOpenTickets: enrichedTickets.filter((t: any) => t.assigned_to === tech.id && !t.is_closed).length,
        lastLogin: tech.last_login
      };
    })
    .sort((a, b) => b.ticketsClosed - a.ticketsClosed);

  // Performance machines
  const machinePerformance: MachinePerf[] = (allMachines || []).map((machine: any) => {
    const machineTickets = enrichedTickets.filter((t: any) => t.machine_id === machine.id);
    return {
      id: machine.id,
      name: `${machine.machine_type} ${machine.manufacturer || ''} ${machine.model || ''}`.trim(),
      location: machine.location || '',
      status: machine.status,
      ticketsCount: machineTickets.length,
      openTickets: machineTickets.filter((t: any) => !t.is_closed).length,
      downtimeHours: machineTickets.reduce((sum: number, t: any) => sum + (parseFloat(t.downtime_hours) || 0), 0),
      commonIssues: machineTickets.slice(0, 5).map((t: any) => t.title)
    };
  }).sort((a, b) => b.ticketsCount - a.ticketsCount);

  // Tickets en retard
  const overdueTickets: TicketSummary[] = enrichedTickets
    .filter((t: any) => !t.is_closed && new Date(t.created_at) < overdueThreshold)
    .map((t: any) => ({
      id: t.ticket_id,
      title: t.title,
      priority: t.priority_label,
      status: t.status_label,
      machineName: t.machine_name,
      assignedTo: t.assigned_to_name,
      createdAt: new Date(t.created_at).toLocaleDateString('fr-CA'),
      daysOpen: Math.floor((now.getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24))
    }));

  // Tickets critiques
  const criticalTickets: TicketSummary[] = enrichedTickets
    .filter((t: any) => !t.is_closed && ['critical', 'high'].includes(t.priority))
    .map((t: any) => ({
      id: t.ticket_id,
      title: t.title,
      priority: t.priority_label,
      status: t.status_label,
      machineName: t.machine_name,
      assignedTo: t.assigned_to_name,
      createdAt: new Date(t.created_at).toLocaleDateString('fr-CA')
    }));

  return {
    statsThisMonth,
    statsLastMonth,
    ticketVariation,
    resolutionVariation,
    technicianPerformance,
    machinePerformance,
    overdueTickets,
    criticalTickets,
    totalMachines: (allMachines || []).length,
    machinesByStatus: {
      operational: (allMachines || []).filter((m: any) => m.status === 'operational').length,
      maintenance: (allMachines || []).filter((m: any) => m.status === 'maintenance').length,
      out_of_service: (allMachines || []).filter((m: any) => m.status === 'out_of_service').length
    }
  };
}

// ============================================================
//                    LOADER: SUBVENTIONS
// ============================================================

export async function loadSubventionsData(env: any): Promise<SubventionsData> {
  // Effectif
  const { results: allUsers } = await env.DB.prepare(`
    SELECT id, role FROM users WHERE deleted_at IS NULL
  `).all();

  const effectifByRole: Record<string, number> = {};
  (allUsers || []).forEach((u: any) => {
    const roleLabel = ROLE_LABELS[u.role] || u.role;
    effectifByRole[roleLabel] = (effectifByRole[roleLabel] || 0) + 1;
  });

  // Machines par type
  const { results: allMachines } = await env.DB.prepare(`
    SELECT id, machine_type FROM machines WHERE deleted_at IS NULL
  `).all();

  const machinesByType: Record<string, number> = {};
  (allMachines || []).forEach((m: any) => {
    const type = m.machine_type || 'Autre';
    machinesByType[type] = (machinesByType[type] || 0) + 1;
  });

  // Tickets 12 derniers mois (indicateur d'activité)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  const ticketCount = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM tickets 
    WHERE deleted_at IS NULL AND created_at >= ?
  `).bind(oneYearAgo.toISOString()).first();

  return {
    effectifTotal: (allUsers || []).length,
    effectifByRole,
    machinesTotal: (allMachines || []).length,
    machinesByType,
    ticketsLast12Months: ticketCount?.count || 0
  };
}

// ============================================================
//                    LOADER: RH
// ============================================================

export async function loadRHData(env: any, employeeId?: number): Promise<RHData> {
  const { results: allUsers } = await env.DB.prepare(`
    SELECT id, full_name, role, email, last_login, created_at
    FROM users WHERE deleted_at IS NULL
  `).all();

  const employees: EmployeeSummary[] = (allUsers || []).map((u: any) => ({
    id: u.id,
    name: u.full_name,
    role: u.role,
    email: u.email,
    lastLogin: u.last_login
  }));

  const rolesCount: Record<string, number> = {};
  (allUsers || []).forEach((u: any) => {
    rolesCount[u.role] = (rolesCount[u.role] || 0) + 1;
  });

  let employeeDetails = undefined;
  if (employeeId) {
    const emp = (allUsers || []).find((u: any) => u.id === employeeId);
    if (emp) {
      // Compter les tickets de cet employé
      const ticketStats = await env.DB.prepare(`
        SELECT 
          SUM(CASE WHEN assigned_to = ? THEN 1 ELSE 0 END) as assigned,
          SUM(CASE WHEN assigned_to = ? AND status IN ('completed', 'resolved', 'closed') THEN 1 ELSE 0 END) as closed
        FROM tickets WHERE deleted_at IS NULL
      `).bind(employeeId, employeeId).first();

      employeeDetails = {
        id: emp.id,
        name: emp.full_name,
        role: emp.role,
        email: emp.email,
        lastLogin: emp.last_login,
        createdAt: emp.created_at,
        ticketsAssigned: ticketStats?.assigned || 0,
        ticketsClosed: ticketStats?.closed || 0
      };
    }
  }

  return {
    employees,
    employeeDetails,
    rolesCount
  };
}

// ============================================================
//                    LOADER: TECHNIQUE
// ============================================================

export async function loadTechniqueData(env: any, machineId?: number): Promise<TechniqueData> {
  const { results: allMachines } = await env.DB.prepare(`
    SELECT id, machine_type, manufacturer, model, serial_number, year, 
           location, status, technical_specs, operator_id
    FROM machines WHERE deleted_at IS NULL
  `).all();

  // Lookup opérateurs
  const operatorIds = [...new Set((allMachines || []).filter((m: any) => m.operator_id).map((m: any) => m.operator_id))];
  let operatorMap: Record<number, string> = {};
  
  if (operatorIds.length > 0) {
    const { results: operators } = await env.DB.prepare(`
      SELECT id, full_name FROM users WHERE id IN (${operatorIds.map(() => '?').join(',')})
    `).bind(...operatorIds).all();
    
    operatorMap = Object.fromEntries((operators || []).map((o: any) => [o.id, o.full_name]));
  }

  const machines: MachineTechnical[] = (allMachines || []).map((m: any) => ({
    id: m.id,
    type: m.machine_type || 'Non spécifié',
    manufacturer: m.manufacturer || '',
    model: m.model || '',
    serialNumber: m.serial_number || '',
    year: m.year || 0,
    location: m.location || '',
    status: m.status || 'unknown',
    specs: m.technical_specs || '',
    operatorName: m.operator_id ? operatorMap[m.operator_id] : undefined
  }));

  let machineDetails = undefined;
  let recentTickets: TicketSummary[] = [];

  if (machineId) {
    machineDetails = machines.find(m => m.id === machineId);

    // Charger les tickets récents de cette machine
    const { results: tickets } = await env.DB.prepare(`
      SELECT id, ticket_id, title, status, priority, created_at
      FROM tickets 
      WHERE deleted_at IS NULL AND machine_id = ?
      ORDER BY created_at DESC LIMIT 15
    `).bind(machineId).all();

    recentTickets = (tickets || []).map((t: any) => ({
      id: t.ticket_id,
      title: t.title,
      priority: t.priority,
      status: t.status,
      machineName: null,
      assignedTo: null,
      createdAt: new Date(t.created_at).toLocaleDateString('fr-CA')
    }));
  }

  return {
    machines,
    machineDetails,
    recentTickets
  };
}

// ============================================================
//                    LOADER: CRÉATIF
// ============================================================

export async function loadCreatifData(env: any): Promise<CreatifData> {
  // Compte employés
  const userCount = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL
  `).first();

  // Compte machines
  const machineCount = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM machines WHERE deleted_at IS NULL
  `).first();

  return {
    companyStrengths: [],
    recentAchievements: [],
    teamSize: userCount?.count || 0,
    machineCount: machineCount?.count || 0
  };
}
