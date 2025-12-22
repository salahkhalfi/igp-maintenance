
import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { getDb } from '../db';
import { machines, users, systemSettings, tickets, media, ticketComments, planningEvents, userPreferences } from '../db/schema';
import { inArray, eq, and, ne, lt, desc, or, sql, not, like } from 'drizzle-orm';
import { extractToken, verifyToken } from '../utils/jwt';
import type { Bindings } from '../types';
import { z } from 'zod';
import { TOOLS, ToolFunctions } from '../ai/tools';

// --- HELPER: DYNAMIC STATUS/PRIORITY MAPS ---
async function getTicketMaps(db: any) {
    // Default Maps (Fallback matching current codebase)
    let statusMap: Record<string, string> = {
        'received': 'Nouveau',
        'diagnostic': 'En diagnostic',
        'in_progress': 'En cours',
        'waiting_parts': 'En attente de pièces',
        'completed': 'Terminé',
        'archived': 'Archivé',
        'open': 'Ouvert', // Legacy
        'resolved': 'Résolu', // Legacy
        'closed': 'Fermé', // Legacy
        'pending': 'En attente' // Legacy
    };

    let priorityMap: Record<string, string> = {
        'low': 'Basse',
        'medium': 'Moyenne',
        'high': 'Haute',
        'critical': 'Critique'
    };

    // Default Closed Statuses
    let closedStatuses = ['resolved', 'closed', 'completed', 'cancelled', 'archived'];

    try {
        const settings = await db.select().from(systemSettings)
            .where(inArray(systemSettings.setting_key, ['ticket_statuses_config', 'ticket_priorities_config', 'ticket_closed_statuses']))
            .all();

        settings.forEach((s: any) => {
            try {
                const parsed = JSON.parse(s.setting_value);
                
                if (s.setting_key === 'ticket_closed_statuses' && Array.isArray(parsed)) {
                    closedStatuses = parsed;
                }

                const normalize = (data: any) => {
                    if (Array.isArray(data)) {
                        return data.reduce((acc: any, item: any) => {
                            if (item.id && item.label) acc[item.id] = item.label;
                            // Also try to detect closed status from config if not explicitly set via ticket_closed_statuses
                            if (item.id && (item.type === 'closed' || item.is_closed)) {
                                if (!closedStatuses.includes(item.id)) closedStatuses.push(item.id);
                            }
                            return acc;
                        }, {});
                    }
                    return data;
                };

                if (s.setting_key === 'ticket_statuses_config') {
                    const dynamicStatuses = normalize(parsed);
                    if (Object.keys(dynamicStatuses).length > 0) {
                        statusMap = { ...statusMap, ...dynamicStatuses };
                    }
                }
                if (s.setting_key === 'ticket_priorities_config') {
                    const dynamicPriorities = normalize(parsed);
                    if (Object.keys(dynamicPriorities).length > 0) {
                        priorityMap = { ...priorityMap, ...dynamicPriorities };
                    }
                }
            } catch (e) {
                console.warn(`[AI] Failed to parse ${s.setting_key}`, e);
            }
        });
    } catch (e) {
        console.warn("[AI] Failed to load dynamic maps, using defaults", e);
    }

    return { statusMap, priorityMap, closedStatuses };
}

// --- HELPER: VISION RELAY (OpenAI) ---
async function analyzeImageWithOpenAI(arrayBuffer: ArrayBuffer, contentType: string, apiKey: string): Promise<string | null> {
    try {
        let binary = '';
        const bytes = new Uint8Array(arrayBuffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64Image = btoa(binary);
        const dataUrl = `data:${contentType};base64,${base64Image}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Describe this technical image in detail for a blind industrial expert. Focus on machines, error codes, safety signs, or schematics. Be precise and technical." },
                            { type: "image_url", image_url: { url: dataUrl } }
                        ]
                    }
                ],
                max_tokens: 500
            })
        });

        if (response.ok) {
            const data = await response.json() as any;
            return data.choices[0].message.content;
        }
        return null;
    } catch (e) {
        console.error("Vision Error:", e);
        return null;
    }
}

const app = new Hono<{ Bindings: Bindings }>();

// --- VALIDATION SCHEMA ---
const TicketAnalysisSchema = z.object({
    title: z.string().min(1, "Titre requis"),
    description: z.string().min(1, "Description requise"),
    priority: z.string().optional(), // Was strict enum, now flexible string to support custom priorities
    machine_id: z.number().nullable(),
    machine_name: z.string().nullable(),
    assigned_to_id: z.number().nullable(),
    assigned_to_name: z.string().nullable(),
    scheduled_date: z.string().nullable()
});

// --- HELPER FUNCTIONS ---

async function getAiConfig(db: any) {
    const keys = [
        'ai_identity_block', 
        'ai_hierarchy_block', 
        'ai_character_block', 
        'ai_knowledge_block', 
        'ai_rules_block', 
        'ai_custom_context',
        'ai_voice_extraction_prompt',
        'ai_whisper_context'
    ];
    
    const settings = await db.select().from(systemSettings).where(inArray(systemSettings.setting_key, keys)).all();
    
    const config: Record<string, string> = {};
    settings.forEach((s: any) => config[s.setting_key] = s.setting_value);

    return {
        identity: config['ai_identity_block'] || "RÔLE : Expert Industriel Senior.",
        hierarchy: config['ai_hierarchy_block'] || "HIÉRARCHIE : Tu réponds au Directeur des Opérations.",
        character: config['ai_character_block'] || "CARACTÈRE : Professionnel, direct et orienté sécurité.",
        knowledge: config['ai_knowledge_block'] || "EXPERTISE : Maintenance industrielle générale.",
        rules: config['ai_rules_block'] || "RÈGLES : Sécurité avant tout (Cadenassage). Pas de hors-sujet.",
        custom: config['ai_custom_context'] || "",
        voiceExtraction: config['ai_voice_extraction_prompt'] || `RÔLE : Analyste de Données Maintenance (Extraction JSON Stricte).
OBJECTIF : Convertir la transcription vocale en données structurées pour la base de données.

RÈGLES D'EXTRACTION STRICTES :
1. **JSON UNIQUEMENT** : Ta réponse doit être un objet JSON valide et RIEN D'AUTRE.
2. **LANGUE** : Détecte la langue de l'audio. Les valeurs title et description DOIVENT être dans la MÊME langue que l'audio.
3. **INTELLIGENCE TECHNIQUE** : Reformule le langage parlé en langage technique professionnel.
4. **PRIORITÉ** : Déduis la priorité (critical/high/medium/low) selon les mots-clés.
5. **DATES** : Convertis les termes relatifs en format ISO 8601 strict basé sur la Date Actuelle.
6. **ASSIGNATION** : Assigne machine_id ou assigned_to_id SEULEMENT si la correspondance est parfaite.`,
        whisperContext: config['ai_whisper_context'] || "Context: Industrial maintenance. Languages: English or French (including Quebec dialect)."
    };
}

// 1. Audio Transcription
async function transcribeAudio(audioFile: File, env: Bindings, vocabulary: string, whisperContext: string): Promise<string | null> {
    const whisperPrompt = `${whisperContext} Terms: ${vocabulary}`;
    
    if (env.GROQ_API_KEY) {
        try {
            console.log("🎤 [AI] Trying Groq Whisper...");
            const formData = new FormData();
            formData.append('file', audioFile);
            formData.append('model', 'whisper-large-v3');
            formData.append('prompt', whisperPrompt);
            
            const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${env.GROQ_API_KEY}` },
                body: formData
            });

            if (response.ok) {
                const data = await response.json() as any;
                if (data.text && data.text.length > 2) return data.text;
            } else {
                console.warn("⚠️ [AI] Groq Error:", await response.text());
            }
        } catch (e) {
            console.warn("⚠️ [AI] Groq Exception:", e);
        }
    }

    if (env.OPENAI_API_KEY) {
        try {
            console.log("🎤 [AI] Fallback to OpenAI Whisper...");
            const formData = new FormData();
            formData.append('file', audioFile, 'voice_ticket.webm');
            formData.append('model', 'whisper-1');
            formData.append('prompt', whisperPrompt);

            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${env.OPENAI_API_KEY}` },
                body: formData
            });

            if (response.ok) {
                const data = await response.json() as any;
                return data.text;
            }
        } catch (e) {
            console.error("❌ [AI] OpenAI Exception:", e);
        }
    }
    return null;
}

// 2. Intelligence Analysis
async function analyzeText(transcript: string, context: any, env: Bindings, aiConfig: any, timezoneOffset: number = -5): Promise<any> {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const localDate = new Date(utc + (3600000 * timezoneOffset));
    
    // Build context block dynamically
    const contextBlock = `
CONTEXTE OPÉRATIONNEL :
- Date (EST) : ${localDate.toISOString().replace('T', ' ').substring(0, 16)}
- Auteur : ${context.userName} (${context.userRole})
- Machines connues : ${context.machines}
- Équipe connue : ${context.techs}
- Vocabulaire usine : ${aiConfig.custom}

FORMAT DE SORTIE ATTENDU (SCHEMA JSON) :
{
  "title": "string",
  "description": "string",
  "priority": "low" | "medium" | "high" | "critical",
  "machine_id": number | null,
  "machine_name": "string" | null,
  "assigned_to_id": number | null,
  "assigned_to_name": "string" | null,
  "scheduled_date": "string" | null
}`;

    // Use configurable prompt from DB + dynamic context
    const systemPrompt = `${aiConfig.voiceExtraction}

${contextBlock}`;

    if (env.DEEPSEEK_API_KEY) {
        try {
            const response = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [{ role: "system", content: systemPrompt }, { role: "user", content: transcript }],
                    temperature: 0.1,
                    response_format: { type: "json_object" }
                })
            });
            if (response.ok) {
                const data = await response.json() as any;
                return TicketAnalysisSchema.parse(JSON.parse(data.choices[0].message.content));
            }
        } catch (e) {
            console.warn("⚠️ [AI] DeepSeek Exception:", e);
        }
    }

    if (env.OPENAI_API_KEY) {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [{ role: "system", content: systemPrompt }, { role: "user", content: transcript }],
                    temperature: 0.2,
                    response_format: { type: "json_object" }
                })
            });
            if (response.ok) {
                const data = await response.json() as any;
                return TicketAnalysisSchema.parse(JSON.parse(data.choices[0].message.content));
            }
        } catch (e) {
            console.error("❌ [AI] OpenAI Exception:", e);
        }
    }
    throw new Error("Toutes les IAs ont échoué. Vérifiez les clés API.");
}

// --- ROUTE HANDLER ---

// POST /api/ai/analyze-ticket
app.post('/analyze-ticket', async (c) => {
    try {
        const authHeader = c.req.header('Authorization');
        let token = extractToken(authHeader);
        if (!token) token = getCookie(c, 'auth_token') || null;

        let userRole = 'unknown';
        let userName = 'Utilisateur inconnu';
        const db = getDb(c.env);

        if (token) {
            const payload = await verifyToken(token);
            if (payload) {
                userRole = payload.role;
                userName = payload.full_name || payload.email;
            }
        }

        const formData = await c.req.formData();
        const audioFile = formData.get('file') as File;
        if (!audioFile) return c.json({ error: "No audio file" }, 400);
        
        const aiConfig = await getAiConfig(db);

        // Fetch Timezone Offset
        let offset = -5;
        try {
            const tzSetting = await db.select().from(systemSettings).where(eq(systemSettings.setting_key, 'timezone_offset_hours')).get();
            if (tzSetting && tzSetting.setting_value) offset = parseInt(tzSetting.setting_value);
        } catch (e) { /* Timezone setting optional, use default */ }

        const machinesList = await db.select({
            id: machines.id, type: machines.machine_type, model: machines.model, manufacturer: machines.manufacturer, 
            location: machines.location, status: machines.status, year: machines.year, serial_number: machines.serial_number,
            technical_specs: machines.technical_specs
        }).from(machines).where(sql`deleted_at IS NULL`).all();
        
        // Dynamic Tech List: Don't hardcode roles. Fetch all internal users.
        const techsList = await db.select({
            id: users.id, name: users.full_name, role: users.role
        }).from(users).where(and(ne(users.role, 'guest'), sql`deleted_at IS NULL`)).all();

        const machinesContext = machinesList.map(m => {
            const details = [
                m.manufacturer,
                m.model,
                m.year ? `(${m.year})` : null,
                m.serial_number ? `S/N:${m.serial_number}` : null
            ].filter(Boolean).join(' ');
            const specs = m.technical_specs ? ` - Specs: ${m.technical_specs.substring(0, 100)}` : '';
            return `ID ${m.id}: ${m.type} ${details} [Loc: ${m.location || '?'}] [Status: ${m.status || 'unknown'}]${specs}`;
        }).join('\n');
        const techsContext = techsList.map(t => `ID ${t.id}: ${t.name} (${t.role})`).join('\n');

        const vocabularyContext = [...machinesList.map(m => `${m.type} ${m.manufacturer || ''} ${m.model || ''}`), ...techsList.map(t => t.name), "Maintenance", "Panne", "Urgent", "Réparation", aiConfig.custom].join(", ");

        const transcript = await transcribeAudio(audioFile, c.env, vocabularyContext, aiConfig.whisperContext);
        if (!transcript) return c.json({ error: "Impossible de transcrire l'audio." }, 502);
        
        try {
            const ticketData = await analyzeText(transcript, { userName, userRole, machines: machinesContext, techs: techsContext }, c.env, aiConfig, offset);
            if (ticketData.scheduled_date && !ticketData.scheduled_date.includes('T')) ticketData.scheduled_date = null;
            return c.json(ticketData);
        } catch (analysisError: any) {
            return c.json({ error: "L'analyse IA a échoué." }, 500);
        }
    } catch (e: any) {
        return c.json({ error: e.message || "Erreur système AI" }, 500);
    }
});

// POST /api/ai/chat - Expert Advice Chat
app.post('/chat', async (c) => {
    try {
        const authHeader = c.req.header('Authorization');
        let token = extractToken(authHeader);
        if (token === 'null' || token === 'undefined') token = null;
        if (!token) token = getCookie(c, 'auth_token') || null;

        let userRole = 'unknown';
        let userName = 'Utilisateur inconnu';
        let userId: number | null = null;

        if (token) {
            const payload = await verifyToken(token);
            if (payload) {
                userRole = payload.role;
                userName = payload.full_name || payload.email;
                userId = payload.userId;
            }
        }

        const body = await c.req.json();
        const { message, ticketContext, history } = body;

        const db = getDb(c.env);

        // Fetch Base URL from settings or default
        let baseUrl = ""; // Empty by default, must be configured
        try {
            const baseSetting = await db.select().from(systemSettings).where(eq(systemSettings.setting_key, 'app_base_url')).get();
            if (baseSetting && baseSetting.setting_value) baseUrl = baseSetting.setting_value;
        } catch (e) {
            console.warn("[AI] Failed to fetch app_base_url", e);
        } 

        const aiConfig = await getAiConfig(db);

        // 2. FETCH CONTEXT
        let machinesList: any[] = [];
        let usersList: any[] = [];
        let activeTickets: any[] = [];
        let machinesSummary = "Indisponible.";
        let usersSummary = "Indisponible.";
        let planningSummary = "Indisponible.";

        try {
            // Load Kanban Columns Customization
            // Try to find user preferences first (if applicable) or system default
            // Since this is AI context, we should probably look for a system-wide setting or a common convention.
            // However, Kanban columns are often stored in 'user_preferences' with key 'kanban_columns'.
            // The AI acts as a general agent, so it should probably know the "standard" flow.
            // Let's check system_settings for a global override or default.
            
            // NOTE: Currently, kanban_columns are stored in `user_preferences`.
            // There is no `system_settings` key for this yet in the provided code (preferences.ts uses a hardcoded default if not found).
            // Strategy: We will fetch the hardcoded default map here to match `preferences.ts` logic 
            // OR if we want to be dynamic, we need to know WHICH user's columns to use. 
            // Since AI serves the current user, we could look up THEIR preferences.
            
            let kanbanColumns = [
                { id: 'received', title: 'Nouveau' },
                { id: 'diagnostic', title: 'En Diagnostic' },
                { id: 'waiting_parts', title: 'En Attente Pièces' },
                { id: 'in_progress', title: 'En Cours' },
                { id: 'completed', title: 'Terminé' }
            ];

            // Attempt to fetch user-specific column names
            if (userId) {
                const userPref = await db.select().from(userPreferences)
                    .where(and(eq(userPreferences.user_id, userId), eq(userPreferences.pref_key, 'kanban_columns')))
                    .get();
                
                if (userPref && userPref.pref_value) {
                    try {
                        const parsed = JSON.parse(userPref.pref_value);
                        if (Array.isArray(parsed)) {
                            kanbanColumns = parsed;
                        }
                    } catch (e) { /* User preferences parse error, use defaults */ }
                }
            }

            // Update statusMap with Kanban column titles
            // This ensures the AI uses the user's custom terminology (e.g. "À faire" instead of "Nouveau")
            let { statusMap, priorityMap, closedStatuses } = await getTicketMaps(db);
            
            kanbanColumns.forEach(col => {
                if (col.id && col.title) {
                    statusMap[col.id] = col.title;
                }
            });

            // 1. SELECT * : On récupère TOUTES les colonnes (serial, location, specs, etc.) sans filtrage manuel
            machinesList = await db.select().from(machines).where(sql`deleted_at IS NULL`).all() || [];
            
            usersList = await db.select({ id: users.id, name: users.full_name, role: users.role, email: users.email, last_login: users.last_login, ai_context: users.ai_context }).from(users).where(sql`deleted_at IS NULL`).all() || [];
            activeTickets = await db.select({
                id: tickets.id, display_id: tickets.ticket_id, title: tickets.title, status: tickets.status, assigned_to: tickets.assigned_to, machine_id: tickets.machine_id, priority: tickets.priority
            }).from(tickets).where(and(not(inArray(tickets.status, closedStatuses)), sql`deleted_at IS NULL`)).all() || [];

            const mediaMap = new Map<number, string[]>();
            const commentMap = new Map<number, number>();
            
            if (activeTickets.length > 0) {
                const ticketIds = activeTickets.map((t: any) => t.id);
                const mediaList = await db.select({
                    id: media.id, ticket_id: media.ticket_id, file_name: media.file_name, file_key: media.file_key, file_type: media.file_type
                }).from(media).where(inArray(media.ticket_id, ticketIds)).all();

                mediaList.forEach((m: any) => {
                    const publicUrl = `/api/media/${m.id}`;
                    const md = m.file_type.startsWith('image') ? `![${m.file_name}](${publicUrl})` : `[${m.file_name}](${publicUrl})`;
                    const current = mediaMap.get(m.ticket_id) || [];
                    current.push(md);
                    mediaMap.set(m.ticket_id, current);
                });

                const commentCounts = await db.select({ ticket_id: ticketComments.ticket_id, count: sql<number>`count(*)` }).from(ticketComments).where(inArray(ticketComments.ticket_id, ticketIds)).groupBy(ticketComments.ticket_id).all();
                commentCounts.forEach((c: any) => commentMap.set(c.ticket_id, c.count));
            }

            const workloadMap = new Map();
            const machineStatusMap = new Map();

            activeTickets.forEach((t: any) => {
                if (t.assigned_to) workloadMap.set(t.assigned_to, (workloadMap.get(t.assigned_to) || 0) + 1);
                if (t.machine_id) {
                    const currentStatus = machineStatusMap.get(t.machine_id) || [];
                    const mediaLinks = mediaMap.get(t.id) || [];
                    const cCount = commentMap.get(t.id) || 0;
                    let mediaStr = mediaLinks.length > 0 ? ` PREUVE VISUELLE: ${mediaLinks[0]}` : "";
                    const commStr = cCount > 0 ? ` [💬 ${cCount} messages]` : "";
                    const statusFr = statusMap[t.status] || t.status;
                    const priorityFr = priorityMap[t.priority] || t.priority;
                    currentStatus.push(`[TICKET #${t.id} | REF: ${t.display_id}] (${statusFr}, ${priorityFr}): ${t.title}${mediaStr}${commStr}`);
                    machineStatusMap.set(t.machine_id, currentStatus);
                }
            });

            machinesSummary = machinesList.map(m => {
                const activeIssues = machineStatusMap.get(m.id);
                
                // --- ETAT MACHINE (Logique Legacy conservée pour l'instant) ---
                let stateLabel = m.status;
                if (m.status === 'out_of_service') stateLabel = '🔴 ARRÊT';
                else if (m.status === 'operational') stateLabel = '🟢 EN MARCHE';
                else if (m.status === 'maintenance') stateLabel = '🟠 MAINTENANCE';
                else stateLabel = `⚪ ${m.status.toUpperCase()}`;

                let state = stateLabel;
                if (activeIssues && activeIssues.length > 0) {
                     state = (m.status === 'out_of_service') ? '🔴 ARRÊT (Confirmé)' : '⚠️ INCIDENTS EN COURS';
                }

                // --- ENRICHISSEMENT DU CONTEXTE (Données Techniques) ---
                const specs = m.technical_specs ? `\n   [SPECS]: ${m.technical_specs.replace(/\n/g, ' ')}` : '';
                const details = [
                    m.manufacturer ? `Fab: ${m.manufacturer}` : null,
                    m.year ? `Année: ${m.year}` : null,
                    m.serial_number ? `S/N: ${m.serial_number}` : null,
                    m.location ? `Loc: ${m.location}` : null
                ].filter(Boolean).join(' | ');

                return `[ID:${m.id}] ${m.machine_type} ${m.model || ''}\n   [DETAILS]: ${details} - ÉTAT: ${state} ${activeIssues ? `(Tickets: ${activeIssues.join(', ')})` : '(RAS)'}${specs}`;
            }).join('\n');
            
            usersSummary = usersList.map(u => {
                 if (u.role === 'admin' && userRole !== 'admin') return `[ID:${u.id}] ${u.name} (ADMINISTRATEUR) - [INFO RESTREINTE]`;
                 const count = workloadMap.get(u.id) || 0;
                 const contextInfo = u.ai_context ? ` | Profil: ${u.ai_context}` : '';
                 return `[ID:${u.id}] ${u.name} (${u.role}) - ${count === 0 ? "✅ LIBRE" : `❌ OCCUPÉ (${count} tickets)`} - Login: ${u.last_login || 'Jamais'}${contextInfo}`;
            }).join('\n');

            const todayStr = new Date().toISOString().split('T')[0];
            const todaysEvents = await db.select().from(planningEvents).where(eq(planningEvents.date, todayStr)).all() || [];
            planningSummary = todaysEvents.length > 0 ? todaysEvents.map((e: any) => `[${e.time || 'Journée'}] ${e.title}`).join(', ') : "Aucun événement.";
        } catch (contextError) {
            console.error("⚠️ [AI] Context Load Failed:", contextError);
        }

        // 2.5. FETCH CURRENT USER AI CONTEXT (for personalized interactions)
        let currentUserAiContext = '';
        if (userId) {
            try {
                const currentUserData = await db.select({ ai_context: users.ai_context })
                    .from(users)
                    .where(eq(users.id, userId))
                    .get();
                if (currentUserData?.ai_context) {
                    currentUserAiContext = currentUserData.ai_context;
                }
            } catch (e) {
                console.warn("[AI] Failed to fetch user ai_context", e);
            }
        }

        // 3. FETCH USER HISTORY
        let userHistory = "Aucun historique.";
        if (userId) {
            try {
                const history = await db.select({ id: tickets.id, display_id: tickets.ticket_id, title: tickets.title, status: tickets.status, machine_id: tickets.machine_id, date: tickets.created_at })
                .from(tickets).where(or(eq(tickets.assigned_to, userId), eq(tickets.reported_by, userId))).orderBy(desc(tickets.created_at)).limit(5).all();
                if (history.length > 0) {
                    const { statusMap } = await getTicketMaps(db);
                    userHistory = history.map(h => {
                        const m = machinesList.find(m => m.id === h.machine_id);
                        return `- [${h.date}] [TICKET #${h.id}] (${statusMap[h.status] || h.status}): ${h.title} sur ${m ? m.type : '?'}`;
                    }).join('\n');
                }
            } catch (e) { console.warn('[AI] Failed to load user history:', e); }
        }

        // 4. VISION CONTEXT
        let recentImageContext = "";
        if (userId) {
            try {
                const lastImages = await c.env.DB.prepare(`SELECT id, transcription, created_at, media_key FROM chat_messages WHERE sender_id = ? AND conversation_id = 'expert_ai' AND type = 'image' AND created_at > datetime('now', '-1 hours') ORDER BY created_at DESC LIMIT 3`).bind(userId).all();
                if (lastImages && lastImages.results && lastImages.results.length > 0) {
                    recentImageContext = `\n[SYSTEM] HISTORIQUE VISUEL (IMAGES RÉCENTES) :\n`;
                    const chronoImages = [...(lastImages.results as any[])].reverse();
                    // @ts-ignore
                    for (const [idx, img] of chronoImages.entries()) {
                        let finalTranscript = img.transcription;
                        const isMostRecent = idx === chronoImages.length - 1;
                        const keywordRegex = /(?:photo|image|voir|regard|check|what)/i;
                        const shouldAnalyze = !finalTranscript?.includes('🖼️') && img.media_key && c.env.OPENAI_API_KEY && (isMostRecent || keywordRegex.test(message || ''));

                        if (shouldAnalyze) {
                            try {
                                const object = await c.env.MEDIA_BUCKET.get(img.media_key);
                                if (object) {
                                    const arrayBuffer = await object.arrayBuffer();
                                    const analysis = await analyzeImageWithOpenAI(arrayBuffer, object.httpMetadata?.contentType || 'image/jpeg', c.env.OPENAI_API_KEY);
                                    if (analysis) {
                                        finalTranscript = "🖼️ " + analysis;
                                        c.executionCtx.waitUntil(c.env.DB.prepare(`UPDATE chat_messages SET transcription = ? WHERE id = ?`).bind(finalTranscript, img.id).run());
                                    }
                                }
                            } catch (err) { /* Vision analysis optional */ }
                        }
                        const publicUrl = `/api/media/public?key=${encodeURIComponent(img.media_key)}`;
                        const imageMd = `![Image ${idx + 1}](${publicUrl})`;
                        recentImageContext += `--- IMAGE #${idx + 1} ---\nFICHIER: ${imageMd}\nCONTENU: ${finalTranscript || "Analyse en cours..."}\n`;
                    }
                }
            } catch (e) { console.warn('[AI] Failed to load image context:', e); }
        }

        // --- CONSTRUCT CLEAN SYSTEM PROMPT ---
        const firstName = userName.split(' ')[0];
        
        // 5. VISION INJECTION (Ticket Attachments)
        // If ticketContext exists, fetch the latest image to let AI "see" the problem
        let ticketVisionMessage: any = null;
        
        if (ticketContext) {
            try {
                // Find the ticket internal ID
                const matchedTicket = activeTickets.find((t: any) => t.title === ticketContext.title && t.machine_id === ticketContext.machine_id);
                
                if (matchedTicket) {
                    const latestImage = await db.select({ file_key: media.file_key, file_type: media.file_type })
                        .from(media)
                        .where(and(eq(media.ticket_id, matchedTicket.id), like(media.file_type, 'image/%')))
                        .orderBy(desc(media.created_at))
                        .limit(1)
                        .first();

                    if (latestImage) {
                        const object = await c.env.MEDIA_BUCKET.get(latestImage.file_key);
                        if (object) {
                            const arrayBuffer = await object.arrayBuffer();
                            let binary = '';
                            const bytes = new Uint8Array(arrayBuffer);
                            const len = bytes.byteLength;
                            for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
                            const base64Image = btoa(binary);
                            
                            ticketVisionMessage = {
                                role: "user",
                                content: [
                                    { type: "text", text: "Voici la photo la plus récente attachée à ce ticket. Analyse visuellement ce que tu vois (défauts, pannes, état) pour compléter ton diagnostic." },
                                    { type: "image_url", image_url: { url: `data:${latestImage.file_type};base64,${base64Image}` } }
                                ]
                            };
                            console.log("[AI] Vision injected for ticket attachment");
                        }
                    }
                }
            } catch (err) {
                console.warn("[AI] Failed to inject ticket vision", err);
            }
        }

        let ticketContextBlock = "";
        if (ticketContext) {
            // 1. Fetch Ticket Comments
            let commentsText = "Aucun commentaire.";
            try {
                // We need to find the ticket ID. ticketContext usually has machine_id, but we need the ticket internal ID.
                // The frontend passes ticketContext based on the opened ticket.
                // Optimally, frontend should pass ticket_id. Let's assume it might not be in ticketContext yet or we match by title/desc.
                // BETTER: The user is asking about "this" ticket. We should look up specific details if we can.
                // Actually, let's look at activeTickets first to find the one matching the context title/desc if ID isn't passed clearly.
                // But wait, activeTickets is already fetched above.
                
                // Let's refine: We'll filter the 'activeTickets' list or fetch specific data if we can identify the ticket.
                // Since ticketContext comes from frontend, let's look for a match in activeTickets to get the ID.
                const matchedTicket = activeTickets.find((t: any) => t.title === ticketContext.title && t.machine_id === ticketContext.machine_id);
                
                if (matchedTicket) {
                    const comments = await db.select({
                        content: ticketComments.content,
                        author: users.full_name,
                        created_at: ticketComments.created_at
                    })
                    .from(ticketComments)
                    .leftJoin(users, eq(ticketComments.user_id, users.id))
                    .where(eq(ticketComments.ticket_id, matchedTicket.id))
                    .orderBy(desc(ticketComments.created_at))
                    .limit(10) // Limit to last 10 comments to save context
                    .all();

                    if (comments.length > 0) {
                        commentsText = comments.map((c: any) => `- [${c.created_at}] ${c.author || 'Inconnu'}: ${c.content}`).join('\n');
                    }

                    // 2. Fetch Ticket Images (Metadata)
                    const images = await db.select({
                        file_name: media.file_name,
                        file_key: media.file_key
                    })
                    .from(media)
                    .where(and(eq(media.ticket_id, matchedTicket.id), like(media.file_type, 'image/%')))
                    .limit(5)
                    .all();

                    if (images.length > 0) {
                        // We add image links so the AI knows there are visuals. 
                        // Note: The AI can't "see" them unless we pass them as vision content in the message loop, 
                        // but knowing they exist and their names is helpful.
                        // Ideally, we would inject the last image into the vision prompt, but for now let's list them.
                        const imageList = images.map((img: any) => {
                            const publicUrl = `/api/media/public?key=${encodeURIComponent(img.file_key)}`;
                            return `![${img.file_name}](${publicUrl})`;
                        }).join('\n');
                        commentsText += `\n\nIMAGES DISPONIBLES :\n${imageList}`;
                    }
                }
            } catch (err) {
                console.warn("[AI] Failed to fetch ticket details for context", err);
            }

            ticketContextBlock = `
--- 🚨 TICKET ACTUEL (SUJET PRIORITAIRE) ---
TITRE : ${ticketContext.title}
DESCRIPTION : ${ticketContext.description}
MACHINE : ${ticketContext.machine_name || 'Non spécifiée'} (ID: ${ticketContext.machine_id || '?'})
HISTORIQUE & COMMENTAIRES :
${commentsText}

CONTEXTE : L'utilisateur demande conseil spécifiquement sur ce problème. Analyse la description, les commentaires et les images (si présentes) pour donner des pistes de diagnostic immédiates.
`;
        }

        let systemPrompt = `
${aiConfig.identity}

${ticketContextBlock}

--- 1. CONTEXTE OPÉRATIONNEL ---
- UTILISATEUR : ${userName} (${userRole}, ID: ${userId || '?'})${currentUserAiContext ? `\n- PROFIL UTILISATEUR : ${currentUserAiContext}` : ''}
- SERVEUR (BASE URL) : ${baseUrl}
- PLANNING AUJOURD'HUI : ${planningSummary}
- HISTORIQUE RÉCENT :
${userHistory}
- VISUEL (IMAGES) :
${recentImageContext}
- ÉTAT DES MACHINES (LIVE) :
${machinesSummary}
- ÉTAT DES ÉQUIPES (DISPONIBILITÉ) :
${usersSummary}
- SAVOIR SPÉCIFIQUE : ${aiConfig.custom}

${aiConfig.hierarchy}
${aiConfig.character}
${aiConfig.knowledge}

--- 2. DIRECTIVES STRATÉGIQUES ---
1. **AIDE À LA DÉCISION** : Ne sois pas passif. Suggère, anticipe, connecte les faits.
2. **SOURCE DE VÉRITÉ** : Utilise les outils (search_tickets, check_machine) pour vérifier les faits non présents dans le contexte.
3. **INTÉGRITÉ** : N'invente jamais de données. Si un outil retourne "null", dis "inconnu".

--- 3. RÈGLES TECHNIQUES & FORMATAGE (OBLIGATOIRES) ---

A. **LIENS & NAVIGATION (RÈGLE ABSOLUE)** :
   Dès que tu mentionnes un ticket (ex: "Ticket #12"), tu DOIS IMMÉDIATEMENT ajouter le lien cliquable à côté.
   
   ⚠️ **ATTENTION AUX IDs** :
   - Un ticket a une RÉFÉRENCE (ex: "LAM-1225-0001") et un ID TECHNIQUE (ex: 154).
   - L'URL doit utiliser l'ID TECHNIQUE (le chiffre) !
   
   👉 Format OBLIGATOIRE : [Ticket RÉF](${baseUrl}/?ticket=ID_TECHNIQUE)
   👉 Exemple : "Le [Ticket LAM-1225-0001](${baseUrl}/?ticket=154) est en cours."
   
   *Si tu ne connais pas l'ID technique, utilise la référence, mais ne mets JAMAIS .com !*

B. **IMAGES & MÉDIAS** :
   Si le contexte contient une image (format ![Alt](URL)), tu DOIS l'afficher dans ta réponse.
   C'est la preuve visuelle que l'utilisateur attend.

C. **STYLE MARKDOWN** :
   - Utilise **Gras** pour l'important.
   - Utilise des Listes pour la clarté.
   - Pas de HTML brut.

--- 4. DIRECTIVES ADMINISTRATEUR ---
${aiConfig.rules}
`;

        const messages: any[] = [
            { role: "system", content: systemPrompt },
            ...history.slice(-6)
        ];

        // Inject vision message if available (BEFORE the user's current question)
        if (ticketVisionMessage) {
            messages.push(ticketVisionMessage);
        }

        messages.push({ role: "user", content: message });

        let turns = 0;
        let finalReply = "";

        while (turns < 5) {
            turns++;
            const payload: any = { messages, temperature: 0.2, tools: TOOLS, tool_choice: "auto", model: "gpt-4o-mini" };
            if (!c.env.OPENAI_API_KEY) throw new Error("API Key missing");

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${c.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Erreur API IA");
            const data = await response.json() as any;
            const responseMessage = data.choices[0].message;
            messages.push(responseMessage);

            if (responseMessage.tool_calls) {
                for (const toolCall of responseMessage.tool_calls) {
                    const fnName = toolCall.function.name;
                    const fnArgs = JSON.parse(toolCall.function.arguments);
                    let toolResult = "Erreur: Outil inconnu";
                    if (ToolFunctions[fnName as keyof typeof ToolFunctions]) {
                        try {
                            // INTELLIGENT ARGUMENT ROUTING
                            // Some tools need baseUrl (for links), others need userId (for permission/context)
                            console.log(`[AI] Invoking tool: ${fnName}`);
                            if (['search_tickets', 'get_overdue_tickets'].includes(fnName)) {
                                 // These tools signatures were updated to accept baseUrl
                                 // Pass configured URL or explicit placeholder if missing
                                 // @ts-ignore
                                 toolResult = await ToolFunctions[fnName](db, fnArgs, baseUrl || "https://app.example.com");
                            } else {
                                 // Standard tools accepting (db, args, userId)
                                 // @ts-ignore
                                 toolResult = await ToolFunctions[fnName](db, fnArgs, userId);
                            }
                        } catch (err: any) {
                            toolResult = `Erreur: ${err.message}`;
                        }
                    }
                    messages.push({ role: "tool", tool_call_id: toolCall.id, content: toolResult });
                }
            } else {
                finalReply = responseMessage.content;
                break;
            }
        }

        if (!finalReply) finalReply = "Désolé, je n'ai pas pu obtenir l'information.";

        // 🛡️ SANITIZATION FIREWALL (Anti-Hallucination) v2
        // Force correction of domains and paths BEFORE sending to client
        // Replaces any domain that looks like a placeholder or wrong domain with actual baseUrl
        if (baseUrl && baseUrl.startsWith('http')) {
            finalReply = finalReply
                .replace(/https?:\/\/(?:www\.)?(?:example\.com|localhost:\d+)/gi, baseUrl);
        }
        
        finalReply = finalReply
            .replace(/\/ticket\/([a-zA-Z0-9-]+)/g, '/?ticket=$1'); // Fix /ticket/ID -> /?ticket=ID

        return c.json({ reply: finalReply });

    } catch (e: any) {
        console.error("Chat AI Error:", e);
        return c.json({ error: e.message }, 500);
    }
});

app.get('/test-expert', async (c) => c.text("Test Endpoint Active"));
app.get('/debug-media', async (c) => c.text("Debug Media Endpoint Active"));

export default app;
