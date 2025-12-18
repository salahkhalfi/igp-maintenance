import { eq, like, or, and, desc, sql, not, inArray, gte, lte, aliasedTable } from 'drizzle-orm';
import { tickets, machines, users, ticketComments, systemSettings, planningEvents, plannerNotes, media } from '../db/schema';

// --- TYPE DEFINITIONS ---
export type ToolDefinition = {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: {
            type: "object";
            properties: Record<string, any>;
            required: string[];
        };
    };
};

// --- TOOL DEFINITIONS (JSON Schema for LLM) ---
export const TOOLS: ToolDefinition[] = [
    {
        type: "function",
        function: {
            name: "search_tickets",
            description: "Rechercher des tickets. Peut filtrer par mots-clés, statut, nom du technicien (assigné) ou nom de la machine. Peut aussi chercher par nom de fichier joint (photo).",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "Mots-clés (titre, description, ou nom de fichier joint)" },
                    status: { type: "string", enum: ["open", "in_progress", "resolved", "closed"], description: "Filtrer par statut" },
                    technician: { type: "string", description: "Nom du technicien assigné (ex: 'Brahim')" },
                    machine: { type: "string", description: "Nom ou type de la machine (ex: 'Four')" },
                    limit: { type: "number", description: "Nombre max de résultats (défaut 5)" }
                },
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_ticket_details",
            description: "Obtenir TOUS les détails d'un ticket spécifique (description complète, commentaires, historique).",
            parameters: {
                type: "object",
                properties: {
                    ticket_id: { type: "number", description: "L'ID unique du ticket (ex: 123)" }
                },
                required: ["ticket_id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "search_machines",
            description: "Trouver des machines par nom, type ou localisation.",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "Nom ou type de machine (ex: 'CNC', 'Bavelloni', 'Four')" }
                },
                required: ["query"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_machine_details",
            description: "Obtenir la fiche technique complète d'une machine et ses tickets récents.",
            parameters: {
                type: "object",
                properties: {
                    machine_id: { type: "number", description: "L'ID unique de la machine" }
                },
                required: ["machine_id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_technician_info",
            description: "Trouver un technicien et voir sa charge de travail actuelle.",
            parameters: {
                type: "object",
                properties: {
                    name: { type: "string", description: "Nom du technicien" }
                },
                required: ["name"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "check_machine_status",
            description: "Vérifier si une machine spécifique est en marche ou à l'arrêt, et pourquoi (tickets bloquants).",
            parameters: {
                type: "object",
                properties: {
                    machine_id: { type: "number", description: "L'ID unique de la machine à vérifier." }
                },
                required: ["machine_id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "check_technician_availability",
            description: "Vérifier si un technicien est libre maintenant ou quand il a fini son dernier ticket.",
            parameters: {
                type: "object",
                properties: {
                    technician_name: { type: "string", description: "Nom du technicien (ex: 'Brahim')." }
                },
                required: ["technician_name"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "check_database_stats",
            description: "Obtenir des statistiques globales sur l'usine (tickets totaux, par priorité, par statut, top pannes).",
            parameters: {
                type: "object",
                properties: {
                    period: { type: "string", enum: ["all_time", "this_month", "today"], description: "Période d'analyse" }
                },
                required: ["period"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_user_details",
            description: "Obtenir les détails d'un utilisateur par son ID (rôle, charge de travail).",
            parameters: {
                type: "object",
                properties: {
                    user_id: { type: "number", description: "L'ID unique de l'utilisateur" }
                },
                required: ["user_id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_overdue_tickets",
            description: "Obtenir la liste des tickets en retard (date planifiée dépassée) qui ne sont pas terminés ni archivés, en tenant compte du fuseau horaire.",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_planning",
            description: "Obtenir le planning global (événements de production) et l'agenda personnel (notes, rendez-vous) de l'utilisateur (admin ou technicien).",
            parameters: {
                type: "object",
                properties: {
                    user_id: { type: "number", description: "L'ID de l'utilisateur courant (requis pour voir l'agenda personnel)." },
                    start_date: { type: "string", description: "Date de début (YYYY-MM-DD). Défaut: aujourd'hui (date locale usine)." },
                    days: { type: "number", description: "Nombre de jours à récupérer. Défaut: 7." }
                },
                required: ["user_id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "generate_team_report",
            description: "Générer un rapport d'équipe complet et détaillé (Admin). Donne l'état de chaque employé (Techniciens, Opérateurs, Admins), leur charge de travail, leur statut de connexion, leur abonnement aux notifications, et pour les opérateurs, l'état de leur machine associée.",
            parameters: {
                type: "object",
                properties: {
                    role_filter: { type: "string", enum: ["all", "technician", "operator", "admin", "supervisor"], description: "Filtrer par rôle (défaut: all)" }
                },
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "list_recent_media",
            description: "Lister les fichiers médias RÉCENTS (photos/vidéos) téléversés sur le serveur. Utile quand l'utilisateur demande 'quels sont les fichiers ?' ou cherche un fichier spécifique sans connaître le ticket.",
            parameters: {
                type: "object",
                properties: {
                    limit: { type: "number", description: "Nombre de fichiers à récupérer (défaut 20)" },
                    file_type: { type: "string", enum: ["image", "video", "all"], description: "Type de fichier (défaut 'all')" }
                },
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_user_media",
            description: "Récupérer tous les fichiers médias (photos/vidéos) liés à un utilisateur (uploads directs, tickets assignés ou rapportés).",
            parameters: {
                type: "object",
                properties: {
                    user_name: { type: "string", description: "Nom de l'utilisateur (ex: 'Brahim')" },
                    user_id: { type: "number", description: "ID de l'utilisateur (si connu)" },
                    limit: { type: "number", description: "Nombre maximum de résultats (défaut 10)" }
                },
                required: []
            }
        }
    }
];

// --- TOOL IMPLEMENTATIONS (Database Logic) ---

export const ToolFunctions = {
    
    async generate_team_report(db: any, args: { role_filter?: string }) {
        const roleFilter = args.role_filter || 'all';
        
        // 1. Fetch Users (filtered if needed)
        let userQuery = db.select().from(users);
        if (roleFilter !== 'all') {
            if (roleFilter === 'technician') {
                 // Include senior_technician and team_leader in general "technician" report
                 userQuery = db.select().from(users).where(inArray(users.role, ['technician', 'senior_technician', 'team_leader']));
            } else if (roleFilter === 'operator') {
                 userQuery = db.select().from(users).where(inArray(users.role, ['operator', 'furnace_operator']));
            } else {
                 userQuery = db.select().from(users).where(eq(users.role, roleFilter));
            }
        }
        const usersList = await userQuery.all();

        // 2. Fetch Notifications Status (Who has push?)
        const subscriptions = await db.select({ user_id: pushSubscriptions.user_id }).from(pushSubscriptions).all();
        const subscribedUserIds = new Set(subscriptions.map((s: any) => s.user_id));

        // 3. Fetch Active Tickets (Load Calculation & Machine Inference)
        const activeTickets = await db.select({
            id: tickets.id,
            display_id: tickets.ticket_id,
            status: tickets.status,
            priority: tickets.priority,
            assigned_to: tickets.assigned_to,
            reported_by: tickets.reported_by,
            machine_id: tickets.machine_id,
            created_at: tickets.created_at,
            title: tickets.title
        })
        .from(tickets)
        .where(not(inArray(tickets.status, ['resolved', 'closed', 'completed', 'cancelled', 'archived'])))
        .all();

        // 4. Fetch Machines (Context)
        const machinesList = await db.select().from(machines).all();
        const machineMap = new Map(machinesList.map((m: any) => [m.id, m]));

        // 5. Build Report
        const report = usersList.map((u: any) => {
            const isSubscribed = subscribedUserIds.has(u.id);
            const role = u.role;
            
            // Workload (Assigned Tickets)
            const myTickets = activeTickets.filter((t: any) => t.assigned_to === u.id);
            
            // Operator Specifics (Inferred Machine)
            let operatorContext = null;
            if (role.includes('operator')) {
                // Find tickets reported by this operator to guess their machine
                const reportedTickets = activeTickets.filter((t: any) => t.reported_by === u.id);
                // Also look at history if needed, but for now active tickets give a clue
                // Simple logic: Most frequent machine in reported tickets
                if (reportedTickets.length > 0) {
                    const machineCounts = new Map();
                    reportedTickets.forEach((t: any) => {
                        machineCounts.set(t.machine_id, (machineCounts.get(t.machine_id) || 0) + 1);
                    });
                    // Get max
                    let topMachineId = null;
                    let maxCount = 0;
                    machineCounts.forEach((count, id) => {
                        if (count > maxCount) { maxCount = count; topMachineId = id; }
                    });
                    
                    if (topMachineId && machineMap.has(topMachineId)) {
                        const m = machineMap.get(topMachineId);
                        operatorContext = {
                            likely_machine: `${m.machine_type} ${m.model || ''}`,
                            machine_status: m.status,
                            pending_requests: reportedTickets.length
                        };
                    }
                }
            }

            // Login Status
            let loginStatus = "Jamais connecté";
            let isOnline = false;
            if (u.last_login) {
                const last = new Date(u.last_login);
                loginStatus = last.toLocaleString('fr-CA');
                // Assume online if within 24h (rough approximation) or just display date
                // Better: Just check if today
                const now = new Date();
                const diffHours = (now.getTime() - last.getTime()) / (1000 * 60 * 60);
                if (diffHours < 2) isOnline = true; // Recent login < 2h
            }

            return {
                id: u.id,
                name: u.full_name,
                role: role,
                contact: {
                    email: u.email,
                    notifications: isSubscribed ? "✅ Abonné (Push)" : "🔕 Non abonné"
                },
                activity: {
                    last_seen: loginStatus,
                    is_recently_active: isOnline
                },
                workload: {
                    active_tickets_count: myTickets.length,
                    details: myTickets.map((t: any) => `${t.display_id} (${t.priority})`).join(', ')
                },
                operator_info: operatorContext // Null if not operator or no info
            };
        });

        // Group by Role for cleaner output
        const grouped = {
            technicians: report.filter((u: any) => ['technician', 'senior_technician', 'team_leader', 'supervisor'].includes(u.role)),
            operators: report.filter((u: any) => u.role.includes('operator')),
            admins: report.filter((u: any) => u.role === 'admin'),
            total_staff: report.length
        };

        return JSON.stringify({
            report_date: new Date().toLocaleString('fr-CA'),
            summary: grouped,
            message: "Voici le rapport complet des équipes (Activités, Notifications, Machines)."
        });
    },

    async list_recent_media(db: any, args: { limit?: number, file_type?: string }) {
        const limit = args.limit || 20;
        const typeFilter = args.file_type || 'all';

        let conditions = [];
        if (typeFilter !== 'all') {
            conditions.push(like(media.file_type, `${typeFilter}%`));
        }

        // Fetch media with user and ticket info
        const mediaList = await db.select({
            id: media.id,
            file_name: media.file_name,
            file_type: media.file_type,
            file_key: media.file_key,
            url: media.url,
            created_at: media.created_at,
            ticket_id: media.ticket_id,
            uploader_id: media.uploaded_by,
            uploader_name: users.full_name,
            ticket_display_id: tickets.ticket_id,
            ticket_title: tickets.title,
            machine_name: machines.machine_type
        })
        .from(media)
        .leftJoin(users, eq(media.uploaded_by, users.id))
        .leftJoin(tickets, eq(media.ticket_id, tickets.id))
        .leftJoin(machines, eq(tickets.machine_id, machines.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(media.created_at))
        .limit(limit)
        .all();

        if (mediaList.length === 0) {
            return "Aucun fichier média récent trouvé.";
        }

        const formatted = mediaList.map((m: any) => {
             // USE ROBUST ID-BASED URL
             const publicUrl = `/api/media/${m.id}`;
             
             let context = "Fichier orphelin (sans ticket)";
             if (m.ticket_id) {
                 context = `Ticket ${m.ticket_display_id || 'ID:'+m.ticket_id} (${m.machine_name || 'Machine inconnue'}) - "${m.ticket_title || ''}"`;
             }

             return {
                 file_name: m.file_name,
                 type: m.file_type,
                 created: m.created_at,
                 uploaded_by: m.uploader_name || "Inconnu",
                 context: context,
                 url: publicUrl,
                 markdown: m.file_type.startsWith('image') ? `![${m.file_name}](${publicUrl})` : `[Lien](${publicUrl})`
             };
        });

        return JSON.stringify({
            count: mediaList.length,
            files: formatted,
            message: `Voici les ${mediaList.length} derniers fichiers trouvés sur le serveur.`
        });
    },

    async get_user_media(db: any, args: { user_name?: string, user_id?: number, limit?: number }) {
        let targetUserId = args.user_id;
        let targetUserName = args.user_name;

        // 1. Resolve User ID if only name is provided
        if (!targetUserId && targetUserName) {
            const searchPattern = `%${targetUserName}%`;
            const user = await db.select({ id: users.id, full_name: users.full_name })
                .from(users)
                .where(like(users.full_name, searchPattern))
                .get();
            
            if (user) {
                targetUserId = user.id;
                targetUserName = user.full_name; // Correct to full name
            } else {
                return `Utilisateur '${targetUserName}' introuvable.`;
            }
        }

        if (!targetUserId) {
            return "Veuillez spécifier un nom d'utilisateur ou un ID.";
        }

        // 2. Identify Relevant Tickets (Assigned or Reported by User)
        const userRelatedTickets = await db.select({ id: tickets.id })
            .from(tickets)
            .where(or(
                eq(tickets.assigned_to, targetUserId),
                eq(tickets.reported_by, targetUserId)
            ))
            .all();
        
        const userTicketIds = userRelatedTickets.map((t: any) => t.id);
        
        // 3. Construct Query Conditions
        // Rule: Media uploaded by USER OR Media attached to USER'S TICKETS
        const mediaConditions = [eq(media.uploaded_by, targetUserId)];
        if (userTicketIds.length > 0) {
            mediaConditions.push(inArray(media.ticket_id, userTicketIds));
        }

        // 4. Fetch Media
        const limit = args.limit || 10;
        const mediaList = await db.select({
            id: media.id,
            file_name: media.file_name,
            file_type: media.file_type,
            file_key: media.file_key,
            url: media.url,
            created_at: media.created_at,
            ticket_id: media.ticket_id
        })
        .from(media)
        .where(or(...mediaConditions))
        .orderBy(desc(media.created_at))
        .limit(limit)
        .all();

        if (mediaList.length === 0) {
            return `Aucun média trouvé pour ${targetUserName || 'cet utilisateur'} (ni uploads directs, ni tickets associés).`;
        }

        // 5. RESOLVE CONTEXT FOR ALL FOUND MEDIA
        // We collect ALL ticket IDs referenced by the found media (even if not in userTicketIds)
        // This handles cases where User uploaded a file to a ticket they are NOT assigned to.
        const referencedTicketIds = [...new Set(mediaList.map((m: any) => m.ticket_id).filter((id: any) => id != null))];
        
        const ticketContextMap = new Map();
        if (referencedTicketIds.length > 0) {
            const contextData = await db.select({
                id: tickets.id,
                display_id: tickets.ticket_id,
                machine_name: machines.machine_type,
                machine_model: machines.model
            })
            .from(tickets)
            .leftJoin(machines, eq(tickets.machine_id, machines.id))
            .where(inArray(tickets.id, referencedTicketIds))
            .all();

            contextData.forEach((c: any) => {
                const machineStr = c.machine_name ? `${c.machine_name} ${c.machine_model || ''}`.trim() : "Machine Inconnue";
                ticketContextMap.set(c.id, {
                    display_id: c.display_id, // e.g. POL-1225-0001
                    machine: machineStr
                });
            });
        }

        // 6. Format for AI
        const formattedMedia = mediaList.map((m: any) => {
            // USE ROBUST ID-BASED URL
            const publicUrl = `/api/media/${m.id}`;
            
            let context = "Upload Direct (Sans Ticket)";
            if (m.ticket_id) {
                if (ticketContextMap.has(m.ticket_id)) {
                    const info = ticketContextMap.get(m.ticket_id);
                    // CRITICAL: Always use Display ID
                    context = `Ticket ${info.display_id} (${info.machine})`; 
                } else {
                    // Fallback should be rare, but indicates broken link
                    context = `Ticket ID_DB:${m.ticket_id} (Détails inconnus)`; 
                }
            }

            return {
                type: m.file_type,
                name: m.file_name,
                created: m.created_at,
                context: context,
                url: publicUrl,
                markdown: m.file_type.startsWith('image') ? `![${m.file_name}](${publicUrl})` : `[Voir ${m.file_name}](${publicUrl})`
            };
        });

        return JSON.stringify({
            user: targetUserName,
            count: mediaList.length,
            media: formattedMedia,
            message: `Voici les ${mediaList.length} fichiers trouvés. CHAQUE FICHIER a un contexte (Ticket + Machine) qu'il FAUT mentionner.`
        });
    },

    async get_overdue_tickets(db: any, args: {}) {
        // 1. Get Timezone Offset
        const settings = await db.select().from(systemSettings).where(eq(systemSettings.setting_key, 'timezone_offset_hours')).get();
        const offset = settings ? parseInt(settings.setting_value) : -5; // Default -5 (EST)

        // 2. Calculate "App Time" (Virtual Wall Clock Time)
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000); // UTC time in ms
        const appTimeMs = utc + (3600000 * offset);
        const appTime = new Date(appTimeMs);
        
        // 3. Fetch Active Tickets with Schedule
        const assignee = aliasedTable(users, 'assignee');

        const activeTickets = await db.select({
            id: tickets.id,
            display_id: tickets.ticket_id, // Add Display ID
            title: tickets.title,
            status: tickets.status,
            priority: tickets.priority,
            scheduled_date: tickets.scheduled_date,
            assigned_to: tickets.assigned_to,
            assignee_name: assignee.full_name
        })
        .from(tickets)
        .leftJoin(assignee, eq(tickets.assigned_to, assignee.id))
        .where(and(
            // Exclude completed/cancelled/archived (Standard "Done" statuses)
            not(inArray(tickets.status, ['completed', 'resolved', 'closed', 'cancelled', 'archived'])),
            // Only fetch scheduled tickets
            sql`${tickets.scheduled_date} IS NOT NULL`
        ))
        .all();

        // 4. Filter Overdue
        const overdue = activeTickets.filter((t: any) => {
            if (!t.scheduled_date) return false;
            // Assuming scheduled_date is stored as standard ISO string (UTC) by backend
            // Simple logic: Is NOW (UTC) > Scheduled Date (UTC)?
            return new Date() > new Date(t.scheduled_date);
        });

        if (overdue.length === 0) {
            return JSON.stringify({
                current_time: appTime.toLocaleString('fr-CA'),
                timezone_offset: offset,
                message: "Aucun ticket en retard."
            });
        }

        return JSON.stringify({
            current_time: appTime.toLocaleString('fr-CA'),
            timezone_offset: offset,
            overdue_count: overdue.length,
            tickets: overdue.map((t: any) => {
                // Apply Timezone Offset to Scheduled Date for AI Context
                let localScheduled = t.scheduled_date;
                if (t.scheduled_date) {
                     const utcDate = new Date(t.scheduled_date);
                     const localDateMs = utcDate.getTime() + (offset * 3600000);
                     const localDate = new Date(localDateMs);
                     localScheduled = localDate.toLocaleString('fr-CA'); // "YYYY-MM-DD HH:mm:ss"
                }

                return {
                    id: t.id,
                    display_id: t.display_id, // Add Display ID to AI output
                    title: t.title,
                    priority: t.priority,
                    status: t.status,
                    assignee: t.assignee_name || "Non assigné",
                    scheduled: localScheduled, // Now human-readable local time
                    delay_hours: Math.round((now.getTime() - new Date(t.scheduled_date!).getTime()) / 3600000 * 10) / 10
                };
            })
        });
    },

    async search_tickets(db: any, args: { query?: string, status?: string, technician?: string, machine?: string, limit?: number }) {
        const limit = args.limit || 5;
        const conditions = [];

        // 1. Keyword Search (Improved with Media Search)
        if (args.query) {
            const searchPattern = `%${args.query}%`;
            
            // Search media filenames first to find ticket IDs
            const matchingMedia = await db.select({ ticket_id: media.ticket_id })
                .from(media)
                .where(like(media.file_name, searchPattern))
                .all();
            
            const mediaTicketIds = matchingMedia.map((m: any) => m.ticket_id);

            // Standard title/description/display_id search OR Media Match
            const orConditions = [
                like(tickets.title, searchPattern), 
                like(tickets.description, searchPattern),
                like(tickets.ticket_id, searchPattern) // Allow searching by 'FOU-1225-0001'
            ];

            if (mediaTicketIds.length > 0) {
                orConditions.push(inArray(tickets.id, mediaTicketIds));
            }

            conditions.push(or(...orConditions));
        }

        // 2. Status Filter
        if (args.status) {
            conditions.push(eq(tickets.status, args.status));
        }

        // 3. Technician Filter (Subquery Logic)
        if (args.technician) {
            const techPattern = `%${args.technician}%`;
            const matchingUsers = await db.select({ id: users.id }).from(users).where(like(users.full_name, techPattern)).all();
            
            if (matchingUsers.length > 0) {
                const userIds = matchingUsers.map((u: any) => u.id);
                conditions.push(inArray(tickets.assigned_to, userIds));
            } else {
                return JSON.stringify({ message: `Aucun technicien trouvé pour '${args.technician}'` });
            }
        }

        // 4. Machine Filter (Subquery Logic)
        if (args.machine) {
            const machPattern = `%${args.machine}%`;
            const matchingMachines = await db.select({ id: machines.id }).from(machines)
                .where(or(like(machines.machine_type, machPattern), like(machines.model, machPattern), like(machines.manufacturer, machPattern)))
                .all();
            
            if (matchingMachines.length > 0) {
                const machineIds = matchingMachines.map((m: any) => m.id);
                conditions.push(inArray(tickets.machine_id, machineIds));
            } else {
                return JSON.stringify({ message: `Aucune machine trouvée pour '${args.machine}'` });
            }
        }

        if (conditions.length === 0) {
            return JSON.stringify({ message: "Veuillez spécifier au moins un critère (query, technician, machine)." });
        }

        const assignee = aliasedTable(users, 'assignee');
        const reporter = aliasedTable(users, 'reporter');

        const results = await db.select({
            id: tickets.id,
            display_id: tickets.ticket_id, // Add Display ID (e.g. FOU-1225-0001)
            title: tickets.title,
            status: tickets.status,
            priority: tickets.priority,
            assigned_to_id: tickets.assigned_to,
            assignee_name: assignee.full_name,
            reporter_name: reporter.full_name,
            machine_id: tickets.machine_id,
            machine_name: machines.machine_type, // Fetch Machine context directly
            machine_model: machines.model,
            created_at: tickets.created_at,
            updated_at: tickets.updated_at,
            completed_at: tickets.completed_at
        })
        .from(tickets)
        .leftJoin(assignee, eq(tickets.assigned_to, assignee.id))
        .leftJoin(reporter, eq(tickets.reported_by, reporter.id))
        .leftJoin(machines, eq(tickets.machine_id, machines.id)) // Join machines
        .where(and(...conditions))
        .orderBy(desc(tickets.updated_at))
        .limit(limit)
        .all();

        // 5. ENRICH WITH MEDIA
        // The "Silver Bullet": If we find tickets, check if they have media immediately
        if (results.length > 0) {
            const ticketIds = results.map((r: any) => r.id);
            const mediaList = await db.select({
                id: media.id, // Fetch ID
                ticket_id: media.ticket_id,
                file_name: media.file_name,
                file_type: media.file_type,
                file_key: media.file_key,
                url: media.url // Fetch URL
            })
            .from(media)
            .where(inArray(media.ticket_id, ticketIds))
            .all();
            
            // Attach media to results
            const resultsWithMedia = results.map((r: any) => {
                let descriptionWithMedia = r.description || "";
                
                const myMedia = mediaList.filter((m: any) => m.ticket_id === r.id).map((m: any) => {
                    // USE ROBUST ID-BASED URL
                    const publicUrl = `/api/media/${m.id}`;
                    
                    // Générer le lien vers le ticket pour le contexte AI
                    // Format attendu par App.tsx : https://app.igpglass.ca/?ticket=123
                    const ticketUrl = `https://app.igpglass.ca/?ticket=${r.id}`;
                    
                    const mdLink = m.file_type.startsWith('image') 
                        ? `![${m.file_name} (Ticket ${r.ticket_id || r.id})](${publicUrl})`
                        : `[Voir ${m.file_name} (Ticket ${r.ticket_id || r.id})](${publicUrl})`;
                        
                    // FORCE INJECTION INTO DESCRIPTION
                    // On donne à l'IA le lien vers l'image ET le lien vers le ticket
                    descriptionWithMedia += `\n\nCONTEXTE TICKET: [Ouvrir Ticket ${r.ticket_id || r.id}](${ticketUrl})`;
                    descriptionWithMedia += `\nPREUVE VISUELLE: ${mdLink}`;

                    return {
                        name: m.file_name,
                        type: m.file_type,
                        // Provide READY-TO-USE Markdown for the AI
                        markdown: mdLink
                    };
                });
                
                return {
                    ...r,
                    description: descriptionWithMedia, // Use the enriched description
                    machine: `${r.machine_name} ${r.machine_model || ''}`.trim(), // Explicit machine context string
                    media_count: myMedia.length,
                    media: myMedia // Include actual Markdown links directly!
                };
            });
            
            return JSON.stringify(resultsWithMedia);
        }

        return JSON.stringify({ message: "Aucun ticket trouvé avec ces critères." });
    },

    async get_ticket_details(db: any, args: { ticket_id: number }) {
        // Use flexible ID (can be the display string 'FOU-1225-0001' or the integer ID 123)
        // If args.ticket_id is a number, we assume it's the DB ID.
        // If the AI somehow passed a string, we might need to handle it, but here parameters are defined as number.
        // However, we should be smarter: allow AI to pass the Display ID if it extracted it.
        // But the tool definition says 'number'. 
        // Let's rely on 'search_tickets' for finding by display ID, and this one for details by DB ID.
        // BUT WAIT: The user sees 'FOU-1225-0001'. The AI might not know the DB ID (123) if it wasn't given in the context.
        
        // Ensure we join with machines to get context
        const ticket = await db.select({
            id: tickets.id,
            ticket_id: tickets.ticket_id,
            title: tickets.title,
            description: tickets.description,
            status: tickets.status,
            priority: tickets.priority,
            assigned_to: tickets.assigned_to,
            reported_by: tickets.reported_by,
            machine_id: tickets.machine_id,
            created_at: tickets.created_at,
            machine_name: machines.machine_type,
            machine_model: machines.model
        })
        .from(tickets)
        .leftJoin(machines, eq(tickets.machine_id, machines.id))
        .where(eq(tickets.id, args.ticket_id))
        .get();
        
        if (!ticket) return "Ticket introuvable.";

        // Resolve Assigned User Name
        let assignedToName = "Non assigné";
        if (ticket.assigned_to) {
            const user = await db.select({ name: users.full_name }).from(users).where(eq(users.id, ticket.assigned_to)).get();
            if (user) assignedToName = user.name;
        }

        // Resolve Creator Name
        let createdByName = "Inconnu";
        if (ticket.reported_by) {
            const creator = await db.select({ name: users.full_name }).from(users).where(eq(users.id, ticket.reported_by)).get();
            if (creator) createdByName = creator.name;
        }

        const commentsList = await db.select({
            user: ticketComments.user_name,
            role: ticketComments.user_role,
            content: ticketComments.comment,
            date: ticketComments.created_at
        })
        .from(ticketComments)
        .where(eq(ticketComments.ticket_id, args.ticket_id))
        .orderBy(desc(ticketComments.created_at))
        .all();

        // Fetch Associated Media (Images/Videos)
        const mediaList = await db.select({
            id: media.id,
            file_name: media.file_name,
            file_type: media.file_type,
            url: media.url, // Full URL if available
            file_key: media.file_key // Fallback to construct public URL
        })
        .from(media)
        .where(eq(media.ticket_id, args.ticket_id))
        .all();

        // Format media for AI usage (Markdown-ready)
        const formattedMedia = mediaList.map((m: any) => {
            // USE ROBUST ID-BASED URL
            const publicUrl = `/api/media/${m.id}`;
            return {
                type: m.file_type,
                name: m.file_name,
                url: publicUrl,
                markdown: m.file_type.startsWith('image') ? `![${m.file_name}](${publicUrl})` : `[Download ${m.file_name}](${publicUrl})`
            };
        });

        const machineContext = ticket.machine_name ? `${ticket.machine_name} ${ticket.machine_model || ''}`.trim() : "Machine Inconnue";

        return JSON.stringify({
            ticket: { 
                ...ticket, 
                // CRITICAL: Expose the HUMAN-READABLE ID as the primary identifier for the AI
                DISPLAY_ID: ticket.ticket_id, // e.g. FOU-1225-0001
                DB_ID: ticket.id,             // e.g. 123 (Internal)
                assigned_to_name: assignedToName, 
                reported_by_name: createdByName,
                machine_context: machineContext
            },
            comments: commentsList,
            media: formattedMedia,
            warning: "DO NOT CONFUSE 'reported_by_name' (Creator) with 'assigned_to_name' (Worker). If assigned_to_name is 'Non assigné', nobody is working on it yet."
        });
    },

    async search_machines(db: any, args: { query: string }) {
        const searchPattern = `%${args.query}%`;
        
        const results = await db.select({
            id: machines.id,
            name: machines.machine_type,
            model: machines.model,
            status: machines.status,
            location: machines.location
        })
        .from(machines)
        .where(or(
            like(machines.machine_type, searchPattern),
            like(machines.model, searchPattern),
            like(machines.manufacturer, searchPattern)
        ))
        .limit(5)
        .all();

        return JSON.stringify(results.length > 0 ? results : "Aucune machine trouvée.");
    },

    async get_machine_details(db: any, args: { machine_id: number }) {
        const machine = await db.select().from(machines).where(eq(machines.id, args.machine_id)).get();
        
        if (!machine) return "Machine introuvable.";

        // 1. Fetch ACTIVE tickets (Priority for current context)
        const activeTickets = await db.select({
            id: tickets.id, 
            display_id: tickets.ticket_id, 
            title: tickets.title,
            status: tickets.status,
            date: tickets.created_at,
            priority: tickets.priority
        })
        .from(tickets)
        .where(and(
            eq(tickets.machine_id, args.machine_id),
            not(inArray(tickets.status, ['resolved', 'closed', 'completed', 'cancelled', 'archived']))
        ))
        .orderBy(desc(tickets.priority), desc(tickets.created_at))
        .all();

        // 2. Fetch RECENT HISTORY (Closed stuff)
        const recentHistory = await db.select({
            id: tickets.id, 
            display_id: tickets.ticket_id, 
            title: tickets.title,
            status: tickets.status,
            date: tickets.created_at
        })
        .from(tickets)
        .where(and(
            eq(tickets.machine_id, args.machine_id),
            inArray(tickets.status, ['resolved', 'closed', 'completed', 'cancelled', 'archived'])
        ))
        .orderBy(desc(tickets.created_at))
        .limit(3)
        .all();

        // 3. Collect IDs for media fetch
        const allTickets = [...activeTickets, ...recentHistory];
        const ticketIds = allTickets.map((t: any) => t.id);
        
        // 4. Fetch Media
        let mediaFiles: any[] = [];
        if (ticketIds.length > 0) {
            mediaFiles = await db.select({
                id: media.id, // Fetch ID
                file_name: media.file_name,
                file_type: media.file_type,
                file_key: media.file_key,
                ticket_id: media.ticket_id,
                url: media.url // Fetch URL
            })
            .from(media)
            .where(inArray(media.ticket_id, ticketIds))
            .all();
        }

        // 5. Attach media helper
        const attachMedia = (ticketList: any[]) => {
            return ticketList.map((t: any) => {
                 let titleWithMedia = t.title;
                 const associatedMedia = mediaFiles.filter((m: any) => m.ticket_id === t.id).map((m: any) => {
                     // USE ROBUST ID-BASED URL
                     const publicUrl = `/api/media/${m.id}`;
                     
                     let displayName = m.file_name;
                     // Only context in display name, no renaming
                     
                     const mdLink = m.file_type.startsWith('image') ? `![${displayName}](${publicUrl})` : `[${displayName}](${publicUrl})`;
                     
                     // FORCE INJECTION INTO TITLE
                     titleWithMedia += `\nPREUVE VISUELLE: ${mdLink}`;

                     return {
                        name: displayName,
                        type: m.file_type,
                        markdown: mdLink
                     };
                 });
                 return { ...t, title: titleWithMedia, media_evidence: associatedMedia };
            });
        };

        return JSON.stringify({
            details: machine,
            active_tickets: attachMedia(activeTickets),
            recent_history: attachMedia(recentHistory),
            message: activeTickets.length > 0 
                ? `⚠️ Machine avec ${activeTickets.length} ticket(s) actif(s). Médias inclus.` 
                : "Machine sans ticket actif."
        });
    },

    async check_machine_status(db: any, args: { machine_id: number }) {
        // 1. Get Base Info
        const machine = await db.select().from(machines).where(eq(machines.id, args.machine_id)).get();
        if (!machine) return "Machine introuvable.";

        // 2. Check Active BLOCKING Tickets (Critical/High)
        const blockingTickets = await db.select({
            internal_id: tickets.id, // Primary Key for join
            display_id: tickets.ticket_id, // Display ID
            title: tickets.title,
            priority: tickets.priority,
            status: tickets.status,
            assigned_to: tickets.assigned_to
        })
        .from(tickets)
        .where(and(
            eq(tickets.machine_id, args.machine_id),
            not(inArray(tickets.status, ['resolved', 'closed', 'completed', 'cancelled', 'archived'])),
            inArray(tickets.priority, ['critical', 'high'])
        ))
        .all();

        // 3. Fetch Media for Blocking Tickets
        const ticketIds = blockingTickets.map((t: any) => t.internal_id);
        let mediaFiles: any[] = [];
        if (ticketIds.length > 0) {
            mediaFiles = await db.select({
                id: media.id, // Fetch ID
                file_name: media.file_name,
                file_type: media.file_type,
                file_key: media.file_key,
                ticket_id: media.ticket_id,
                url: media.url // Fetch URL
            })
            .from(media)
            .where(inArray(media.ticket_id, ticketIds))
            .all();
        }

        const blockingWithMedia = blockingTickets.map((t: any) => {
            let titleWithMedia = t.title;
            
            const ticketMedia = mediaFiles.filter((m: any) => m.ticket_id === t.internal_id).map((m: any) => {
                // USE ROBUST ID-BASED URL
                const publicUrl = `/api/media/${m.id}`;
                
                let displayName = m.file_name;
                // Keep original name

                const mdLink = m.file_type.startsWith('image') ? `![${displayName}](${publicUrl})` : `[${displayName}](${publicUrl})`;
                
                // CRITICAL FIX: Append the markdown DIRECTLY to the title so the AI CANNOT miss it when summarizing
                titleWithMedia += `\n\nPREUVE VISUELLE: ${mdLink}`;

                return {
                    name: displayName,
                    type: m.file_type,
                    markdown: mdLink
                };
            });
            
            return {
                id: t.display_id,
                title: titleWithMedia, // Use the enriched title
                priority: t.priority,
                status: t.status,
                media_evidence: ticketMedia
            };
        });

        // 4. Determine Real Status
        let realStatus = machine.status;
        let reason = "Fonctionnement normal.";

        if (machine.status === 'out_of_service') {
            reason = "Arrêt manuel signalé.";
        } else if (blockingTickets.length > 0) {
            realStatus = "degraded"; // Virtual status
            reason = `Incidents majeurs en cours (${blockingTickets.length}).`;
        }

        return JSON.stringify({
            machine: { name: machine.machine_type, model: machine.model, id: machine.id },
            declared_status: machine.status,
            calculated_status: realStatus,
            is_running: realStatus === 'operational',
            reason: reason,
            blocking_tickets: blockingWithMedia
        });
    },

    async check_technician_availability(db: any, args: { technician_name: string }) {
        // 1. Find User
        const searchPattern = `%${args.technician_name}%`;
        const user = await db.select().from(users).where(like(users.full_name, searchPattern)).get();
        
        if (!user) return `Technicien '${args.technician_name}' introuvable.`;

        // 2. Count Active Tickets (Omniscient View)
        const activeTickets = await db.select({
            id: tickets.ticket_id,
            status: tickets.status,
            title: tickets.title
        })
        .from(tickets)
        .where(and(
            eq(tickets.assigned_to, user.id),
            not(inArray(tickets.status, ['resolved', 'closed', 'completed', 'cancelled', 'archived']))
        ))
        .all();

        // 3. Check Last Activity (Last completed ticket)
        const lastFinished = await db.select({
            date: tickets.updated_at,
            title: tickets.title
        })
        .from(tickets)
        .where(and(
            eq(tickets.assigned_to, user.id),
            inArray(tickets.status, ['resolved', 'closed'])
        ))
        .orderBy(desc(tickets.updated_at))
        .limit(1)
        .get();

        const isFree = activeTickets.length === 0;

        return JSON.stringify({
            technician: user.full_name,
            is_available: isFree,
            current_load: activeTickets.length,
            active_tickets: activeTickets,
            last_finished_job: lastFinished ? `${lastFinished.title} (${lastFinished.date})` : "Aucun historique récent.",
            status_message: isFree 
                ? `${user.full_name} est LIBRE. Dernier job fini : ${lastFinished?.title || 'N/A'}.`
                : `${user.full_name} est OCCUPÉ sur ${activeTickets.length} ticket(s).`
        });
    },

    async check_database_stats(db: any, args: { period: string }) {
        // Simple analytic tool
        const totalTickets = await db.select({ count: sql<number>`count(*)` }).from(tickets).get();
        const activeTickets = await db.select({ count: sql<number>`count(*)` }).from(tickets).where(not(inArray(tickets.status, ['resolved', 'closed', 'completed', 'cancelled', 'archived']))).get();
        const closedTickets = await db.select({ count: sql<number>`count(*)` }).from(tickets).where(inArray(tickets.status, ['resolved', 'closed', 'completed'])).get();
        
        const priorityBreakdown = await db.select({ priority: tickets.priority, count: sql<number>`count(*)` })
            .from(tickets)
            .groupBy(tickets.priority)
            .all();

        return JSON.stringify({
            total_db_tickets: totalTickets.count,
            active_now: activeTickets.count,
            closed_total: closedTickets.count,
            by_priority: priorityBreakdown
        });
    },

    async get_technician_info(db: any, args: { name: string }) {
        const searchPattern = `%${args.name}%`;
        
        const user = await db.select({
            id: users.id,
            name: users.full_name,
            role: users.role,
            email: users.email
        })
        .from(users)
        .where(like(users.full_name, searchPattern))
        .get();

        if (!user) return "Technicien introuvable.";

        const activeTickets = await db.select({
            id: tickets.id,
            display_id: tickets.ticket_id, // Add Display ID
            title: tickets.title,
            status: tickets.status
        })
        .from(tickets)
        .where(and(
            eq(tickets.assigned_to, user.id),
            // Use NEGATIVE logic to capture ALL active statuses (pending_parts, diagnosis, etc.)
            not(inArray(tickets.status, ['resolved', 'closed', 'completed', 'cancelled', 'archived']))
        ))
        .all();

        const recentHistory = await db.select({
            id: tickets.id,
            display_id: tickets.ticket_id, // Add Display ID
            title: tickets.title,
            status: tickets.status,
            date: tickets.updated_at
        })
        .from(tickets)
        .where(and(
            eq(tickets.assigned_to, user.id),
            or(eq(tickets.status, 'resolved'), eq(tickets.status, 'closed'))
        ))
        .orderBy(desc(tickets.updated_at))
        .limit(3)
        .all();

        return JSON.stringify({
            technician: user,
            active_load: activeTickets,
            recent_history: recentHistory
        });
    },

    async get_user_details(db: any, args: { user_id: number }) {
        const user = await db.select({
            id: users.id,
            name: users.full_name,
            role: users.role,
            email: users.email
        })
        .from(users)
        .where(eq(users.id, args.user_id))
        .get();

        if (!user) return "Utilisateur introuvable.";

        const activeTickets = await db.select({
            id: tickets.id,
            display_id: tickets.ticket_id, // Add Display ID
            title: tickets.title,
            status: tickets.status
        })
        .from(tickets)
        .where(and(
            eq(tickets.assigned_to, user.id),
            // Use NEGATIVE logic to capture ALL active statuses (pending_parts, diagnosis, etc.)
            not(inArray(tickets.status, ['resolved', 'closed', 'completed', 'cancelled', 'archived']))
        ))
        .all();

        const recentHistory = await db.select({
            id: tickets.id,
            display_id: tickets.ticket_id, // Add Display ID
            title: tickets.title,
            status: tickets.status,
            completed_at: tickets.completed_at
        })
        .from(tickets)
        .where(and(
            eq(tickets.assigned_to, user.id),
            or(eq(tickets.status, 'resolved'), eq(tickets.status, 'closed'))
        ))
        .orderBy(desc(tickets.updated_at))
        .limit(5)
        .all();

        return JSON.stringify({
            user: user,
            active_load: activeTickets,
            recent_history: recentHistory
        });
    },

    async get_planning(db: any, args: { user_id: number, start_date?: string, days?: number }, callerUserId?: number) {
        if (!callerUserId) return "Erreur: Utilisateur appelant non identifié.";

        // 1. VERIFY CALLER PERMISSIONS
        const caller = await db.select({ role: users.role }).from(users).where(eq(users.id, callerUserId)).get();
        if (!caller) return "Utilisateur appelant introuvable.";

        const isCallerAdmin = caller.role === 'admin';
        const targetUserId = args.user_id;

        // 2. PRIVACY & ACCESS LOGIC
        // GLOBAL PLANNING: Visible to ALL Admins.
        // PERSONAL NOTES: Visible ONLY to the owner (Strict Privacy).
        
        // ... Timezone Logic ...
        const settings = await db.select().from(systemSettings).where(eq(systemSettings.setting_key, 'timezone_offset_hours')).get();
        const offset = settings ? parseInt(settings.setting_value) : -5; // Default -5 (EST)

        let startDateStr = args.start_date;
        if (!startDateStr) {
            const now = new Date();
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const appTimeMs = utc + (3600000 * offset);
            const appTime = new Date(appTimeMs);
            startDateStr = appTime.toISOString().split('T')[0];
        }

        const days = args.days || 7;
        const startDate = new Date(startDateStr);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + days);
        const endDateStr = endDate.toISOString().split('T')[0];

        // 3. FETCH DATA
        let events: any[] = [];
        let notes: any[] = [];
        let accessMessage = "";

        // A. GLOBAL PLANNING (Factory Events)
        if (isCallerAdmin) {
            events = await db.select()
                .from(planningEvents)
                .where(and(
                    gte(planningEvents.date, startDateStr),
                    lte(planningEvents.date, endDateStr)
                ))
                .orderBy(planningEvents.date, planningEvents.time)
                .all();
            accessMessage += `Planning Global: ✅ ACCÈS AUTORISÉ (${events.length} événements). `;
        } else {
            accessMessage += `Planning Global: ⛔ RÉSERVÉ ADMIN. `;
        }

        // B. PERSONAL NOTES (Private Agenda)
        // STRICT CHECK: Can only see own notes
        if (targetUserId === callerUserId) {
            notes = await db.select()
                .from(plannerNotes)
                .where(and(
                    eq(plannerNotes.user_id, callerUserId),
                    gte(plannerNotes.date, startDateStr),
                    lte(plannerNotes.date, endDateStr)
                ))
                .orderBy(plannerNotes.date, plannerNotes.time)
                .all();
            accessMessage += `Notes Personnelles: ✅ VISIBLES (${notes.length} notes).`;
        } else {
            accessMessage += `Notes Personnelles: 🔒 MASQUÉES (Confidentialité).`;
        }

        return JSON.stringify({
            period: { start: startDateStr, end: endDateStr, timezone_offset: offset },
            global_events: isCallerAdmin ? events : [],
            personal_notes: targetUserId === callerUserId ? notes : [],
            access_log: accessMessage,
            message: `Voici les données de planning récupérées selon vos droits d'accès.\n${accessMessage}`
        });
    }
};