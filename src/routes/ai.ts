
import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { getDb } from '../db';
import { machines, users, systemSettings, tickets, media, ticketComments } from '../db/schema';
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

    try {
        // Try to fetch dynamic config from system_settings
        // Keys: 'ticket_statuses_config' and 'ticket_priorities_config'
        // Expected JSON format: { "key": "Label", "key2": "Label 2" } or Array [{id, label}]
        const settings = await db.select().from(systemSettings)
            .where(inArray(systemSettings.setting_key, ['ticket_statuses_config', 'ticket_priorities_config']))
            .all();

        settings.forEach((s: any) => {
            try {
                const parsed = JSON.parse(s.setting_value);
                
                // Handle both Object {key: label} and Array [{id: key, label: label}] formats
                const normalize = (data: any) => {
                    if (Array.isArray(data)) {
                        return data.reduce((acc: any, item: any) => {
                            if (item.id && item.label) acc[item.id] = item.label;
                            return acc;
                        }, {});
                    }
                    return data;
                };

                if (s.setting_key === 'ticket_statuses_config') {
                    const dynamicStatuses = normalize(parsed);
                    if (Object.keys(dynamicStatuses).length > 0) {
                        statusMap = { ...statusMap, ...dynamicStatuses }; // Merge to keep fallbacks
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

    return { statusMap, priorityMap };
}

// --- HELPER: VISION RELAY (OpenAI) ---
async function analyzeImageWithOpenAI(arrayBuffer: ArrayBuffer, contentType: string, apiKey: string): Promise<string | null> {
    try {
        // Safe Base64 encoding
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
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    machine_id: z.number().nullable(),
    machine_name: z.string().nullable(),
    assigned_to_id: z.number().nullable(),
    assigned_to_name: z.string().nullable(),
    scheduled_date: z.string().nullable()
});

// --- HELPER FUNCTIONS ---

// Fetch AI Configuration from DB (SaaS-Ready)
async function getAiConfig(db: any) {
    const keys = [
        'ai_identity_block', 
        'ai_hierarchy_block', 
        'ai_character_block', 
        'ai_knowledge_block', 
        'ai_rules_block', 
        'ai_custom_context'
    ];
    
    const settings = await db.select().from(systemSettings).where(inArray(systemSettings.setting_key, keys)).all();
    
    const config: Record<string, string> = {};
    settings.forEach((s: any) => config[s.setting_key] = s.setting_value);

    // Fallbacks (Generic Industrial Defaults) if DB is empty
    return {
        identity: config['ai_identity_block'] || "RÔLE : Expert Industriel Senior.",
        hierarchy: config['ai_hierarchy_block'] || "HIÉRARCHIE : Tu réponds au Directeur des Opérations.",
        character: config['ai_character_block'] || "CARACTÈRE : Professionnel, direct et orienté sécurité.",
        knowledge: config['ai_knowledge_block'] || "EXPERTISE : Maintenance industrielle générale.",
        rules: config['ai_rules_block'] || "RÈGLES : Sécurité avant tout (Cadenassage). Pas de hors-sujet.",
        custom: config['ai_custom_context'] || ""
    };
}

// 1. Audio Transcription (Groq > OpenAI Fallback)
async function transcribeAudio(audioFile: File, env: Bindings, vocabulary: string): Promise<string | null> {
    
    // --- STRATEGY A: GROQ (Fast & Free-ish) ---
    if (env.GROQ_API_KEY) {
        try {
            console.log("🎤 [AI] Trying Groq Whisper...");
            const formData = new FormData();
            formData.append('file', audioFile);
            formData.append('model', 'whisper-large-v3'); // Groq's super fast model
            // formData.append('language', 'fr'); // REMOVED: Allow auto-detection for English support
            
            // DYNAMIC CONTEXT (Generic Philosophy):
            // We use the dynamic vocabulary from the database (machines, techs) to guide Groq.
            formData.append('prompt', `Context: Industrial maintenance. Languages: English or French (including Quebec dialect). Terms: ${vocabulary}`);
            
            const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${env.GROQ_API_KEY}` },
                body: formData
            });

            if (response.ok) {
                const data = await response.json() as any;
                if (data.text && data.text.length > 2) {
                    console.log("✅ [AI] Groq Success:", data.text.substring(0, 50) + "...");
                    return data.text;
                }
            } else {
                console.warn("⚠️ [AI] Groq Error:", await response.text());
            }
        } catch (e) {
            console.warn("⚠️ [AI] Groq Exception:", e);
        }
    } else {
        console.warn("ℹ️ [AI] No GROQ_API_KEY found, skipping.");
    }

    // --- STRATEGY B: OPENAI (Reliable Fallback) ---
    if (env.OPENAI_API_KEY) {
        try {
            console.log("🎤 [AI] Fallback to OpenAI Whisper...");
            const formData = new FormData();
            formData.append('file', audioFile, 'voice_ticket.webm');
            formData.append('model', 'whisper-1');
            formData.append('prompt', `Context: Industrial maintenance. Languages: English or French (including Quebec dialect). Terms: ${vocabulary}`);

            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${env.OPENAI_API_KEY}` },
                body: formData
            });

            if (response.ok) {
                const data = await response.json() as any;
                console.log("✅ [AI] OpenAI Success");
                return data.text;
            } else {
                console.error("❌ [AI] OpenAI Error:", await response.text());
            }
        } catch (e) {
            console.error("❌ [AI] OpenAI Exception:", e);
        }
    }

    return null;
}

// 2. Intelligence Analysis (DeepSeek > OpenAI Fallback)
async function analyzeText(transcript: string, context: any, env: Bindings, aiConfig: any): Promise<any> {
    
    // Construct System Prompt
    // Note: Cloudflare is in UTC. We simulate EST (UTC-5)
    const localDate = new Date(new Date().getTime() - (5 * 60 * 60 * 1000));
    
    const systemPrompt = `
RÔLE : Analyste de Données Maintenance (Extraction JSON Stricte).
OBJECTIF : Convertir la transcription vocale en données structurées pour la base de données.

CONTEXTE OPÉRATIONNEL :
- Date (EST) : ${localDate.toISOString().replace('T', ' ').substring(0, 16)}
- Auteur : ${context.userName} (${context.userRole})
- Machines connues : ${context.machines}
- Équipe connue : ${context.techs}
- Vocabulaire usine : ${aiConfig.custom}

RÈGLES D'EXTRACTION STRICTES :
1. **JSON UNIQUEMENT** : Ta réponse doit être un objet JSON valide et RIEN D'AUTRE. Pas de Markdown, pas de phrases d'intro.
2. **LANGUE** : Détecte la langue de l'audio. Les valeurs 'title' et 'description' DOIVENT être dans la MÊME langue que l'audio (FR ou EN).
3. **INTELLIGENCE TECHNIQUE** : Reformule le langage parlé en langage technique professionnel (ex: "ça fuit" -> "Fuite détectée").
4. **PRIORITÉ** : Déduis la priorité (critical/high/medium/low) selon les mots-clés (Feu, Arrêt, Danger = critical).
5. **DATES** : Convertis les termes relatifs ("demain 14h") en format ISO 8601 strict basé sur la Date Actuelle.
6. **ASSIGNATION** : Assigne 'machine_id' ou 'assigned_to_id' SEULEMENT si la correspondance avec le CONTEXTE est parfaite. Sinon null.

PROTOCOLE DE SÉCURITÉ (INPUT INVALIDE) :
Si l'audio est une blague, une insulte ou hors-sujet, génère ce JSON spécifique :
{ "title": "Rapport d'Anomalie Cognitive", "description": "[Réponse humoristique sarcastique et technique de 1 phrase]", "priority": "low" }

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
}
`;

    // --- STRATEGY A: DEEPSEEK (Smart & Cheap) ---
    if (env.DEEPSEEK_API_KEY) {
        try {
            console.log("🧠 [AI] Trying DeepSeek V3...");
            const response = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "deepseek-chat", // V3
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: transcript }
                    ],
                    temperature: 0.1,
                    response_format: { type: "json_object" }
                })
            });

            if (response.ok) {
                const data = await response.json() as any;
                const content = data.choices[0].message.content;
                console.log("✅ [AI] DeepSeek Success");
                
                try {
                    const parsed = JSON.parse(content);
                    // VERIFICATION (Trust but verify)
                    const validated = TicketAnalysisSchema.parse(parsed);
                    return validated;
                } catch (validationError) {
                    console.error("⚠️ [AI] DeepSeek Validation Failed:", validationError);
                    throw new Error("Format de réponse invalide de DeepSeek");
                }
            } else {
                console.warn("⚠️ [AI] DeepSeek Error:", await response.text());
            }
        } catch (e) {
            console.warn("⚠️ [AI] DeepSeek Exception:", e);
        }
    } else {
        console.warn("ℹ️ [AI] No DEEPSEEK_API_KEY found.");
    }

    // --- STRATEGY B: OPENAI (Reliable Fallback) ---
    if (env.OPENAI_API_KEY) {
        try {
            console.log("🧠 [AI] Fallback to OpenAI GPT-4o-mini...");
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: transcript }
                    ],
                    temperature: 0.2,
                    response_format: { type: "json_object" }
                })
            });

            if (response.ok) {
                const data = await response.json() as any;
                console.log("✅ [AI] OpenAI Success");
                
                try {
                    const parsed = JSON.parse(data.choices[0].message.content);
                    // VERIFICATION (Trust but verify)
                    const validated = TicketAnalysisSchema.parse(parsed);
                    return validated;
                } catch (validationError) {
                     console.error("⚠️ [AI] OpenAI Validation Failed:", validationError);
                     throw new Error("Format de réponse invalide de OpenAI");
                }
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
        // 1. Auth & Context
        const authHeader = c.req.header('Authorization');
        let token = extractToken(authHeader);

        if (!token) {
            token = getCookie(c, 'auth_token') || null;
        }

        let userRole = 'unknown';
        let userName = 'Utilisateur inconnu';

        // 3. Load Database Context FIRST
        const db = getDb(c.env);

        if (token) {
            // FIX: Don't pass c.env.JWT_SECRET explicitly to ensure consistency with auth.ts signing
            // which uses the default secret handling in jwt.ts
            const payload = await verifyToken(token);
            if (payload) {
                userRole = payload.role;
                userName = payload.full_name || payload.email;
            }
        }

        // 2. Get Audio
        const formData = await c.req.formData();
        const audioFile = formData.get('file') as File;
        if (!audioFile) return c.json({ error: "No audio file" }, 400);
        
        // 3. Load AI Config (SaaS)
        const aiConfig = await getAiConfig(db);

        // Fetch FULL machine details
        const machinesList = await db.select({
            id: machines.id, 
            type: machines.machine_type,
            model: machines.model,
            manufacturer: machines.manufacturer,
            location: machines.location,
            status: machines.status // Add status to fetch
        }).from(machines).all();
        
        const techsList = await db.select({
            id: users.id, name: users.full_name, role: users.role
        }).from(users).where(and(
            inArray(users.role, ['admin', 'supervisor', 'technician', 'senior_technician', 'team_leader']),
            sql`deleted_at IS NULL`
        )).all();

        // Build a RICH context for the AI
        const machinesContext = machinesList.map(m => 
            `ID ${m.id}: ${m.type} ${m.manufacturer || ''} ${m.model || ''} [Loc: ${m.location || '?'}] [Status: ${m.status || 'unknown'}]`
        ).join('\n');
        
        const techsContext = techsList.map(t => `ID ${t.id}: ${t.name} (${t.role})`).join('\n');

        // Dynamic Vocabulary
        const vocabularyContext = [
            ...machinesList.map(m => `${m.type} ${m.manufacturer || ''} ${m.model || ''}`),
            ...techsList.map(t => t.name),
            "Maintenance", "Panne", "Urgent", "Réparation", "Fuite", "Bruit", "Arrêt", "Danger", "Sécurité",
            aiConfig.custom // Inject custom context keywords
        ].join(", ");

        // 5. Transcribe
        const transcript = await transcribeAudio(audioFile, c.env, vocabularyContext);
        if (!transcript) {
            console.error("❌ [AI] Transcription failed");
            return c.json({ error: "Impossible de transcrire l'audio. Vérifiez votre micro ou la connexion." }, 502);
        }
        
        // 6. Analyze
        try {
            const ticketData = await analyzeText(transcript, {
                userName, userRole, machines: machinesContext, techs: techsContext
            }, c.env, aiConfig);

            // 7. Final Polish
            if (ticketData.scheduled_date && !ticketData.scheduled_date.includes('T')) {
                ticketData.scheduled_date = null; // Safety check
            }

            return c.json(ticketData);
        } catch (analysisError: any) {
            console.error("❌ [AI] Analysis failed:", analysisError);
            return c.json({ error: "L'analyse IA a échoué. Veuillez réessayer." }, 500);
        }

    } catch (e: any) {
        console.error("❌ [AI] Critical Error:", e);
        return c.json({ error: e.message || "Erreur système AI" }, 500);
    }
});

// POST /api/ai/chat - Expert Advice Chat (Smart Tool-Enabled)
app.post('/chat', async (c) => {
    try {
        const authHeader = c.req.header('Authorization');
        let token = extractToken(authHeader);

        // FIX: Handle "Bearer null" or "Bearer undefined" sent by clients
        if (token === 'null' || token === 'undefined') {
            token = null;
        }

        if (!token) {
            token = getCookie(c, 'auth_token') || null;
        }

        let userRole = 'unknown';
        let userName = 'Utilisateur inconnu';
        let userId: number | null = null;

        if (token) {
            // FIX: Don't pass c.env.JWT_SECRET explicitly to ensure consistency with auth.ts signing
            // which uses the default secret handling in jwt.ts
            const payload = await verifyToken(token);
            if (payload) {
                userRole = payload.role;
                userName = payload.full_name || payload.email;
                userId = payload.userId;
            } else {
                console.warn("⚠️ [AI] Token verification failed");
            }
        }

        const body = await c.req.json();
        const { message, ticketContext, history } = body;

        // 0. DETECT ENVIRONMENT (Self-Awareness)
        const requestUrl = new URL(c.req.url);
        const baseUrl = requestUrl.origin; // e.g. "https://app.igpglass.ca"

        const db = getDb(c.env);
        
        // 1. FETCH AI CONFIG (DB-DRIVEN PERSONA)
        let aiConfig;
        try {
            aiConfig = await getAiConfig(db);
        } catch (err) {
            console.error("⚠️ [AI] Config Load Failed:", err);
            // Fallback config
            aiConfig = {
                identity: "RÔLE : Expert Industriel Senior.",
                hierarchy: "HIÉRARCHIE : Tu réponds au Directeur des Opérations.",
                character: "CARACTÈRE : Professionnel, direct et orienté sécurité.",
                knowledge: "EXPERTISE : Maintenance industrielle générale.",
                rules: "RÈGLES : Sécurité avant tout (Cadenassage). Pas de hors-sujet.",
                custom: ""
            };
        }

        // 2. FETCH FACTORY DIRECTORY & REAL-TIME STATUS (The "Omniscient" Context)
        let machinesList: any[] = [];
        let usersList: any[] = [];
        let activeTickets: any[] = [];
        let machinesSummary = "Données machines indisponibles.";
        let usersSummary = "Données équipes indisponibles.";
        let planningSummary = "Planning indisponible.";

        try {
            machinesList = await db.select({
                id: machines.id, 
                type: machines.machine_type,
                model: machines.model,
                status: machines.status // Add status to fetch
            }).from(machines).where(sql`deleted_at IS NULL`).all() || [];

            usersList = await db.select({
                id: users.id,
                name: users.full_name,
                role: users.role,
                email: users.email,
                last_login: users.last_login
            }).from(users).where(sql`deleted_at IS NULL`).all() || [];

            // Fetch ACTIVE tickets (not just open/in_progress, but EVERYTHING not closed)
            activeTickets = await db.select({
                id: tickets.id,
                display_id: tickets.ticket_id, // Fetch Display ID (e.g., FOU-1225-001)
                title: tickets.title,
                status: tickets.status,
                assigned_to: tickets.assigned_to,
                machine_id: tickets.machine_id,
                priority: tickets.priority
            })
            .from(tickets)
            .where(and(
                not(inArray(tickets.status, ['resolved', 'closed', 'completed', 'cancelled', 'archived'])),
                sql`deleted_at IS NULL`
            ))
            .all() || [];

            // --- ENRICH CONTEXT WITH MEDIA & COMMENT COUNTS ---
            // STRATEGY CHANGE: Don't just count. FETCH THE MEDIA URLS DIRECTLY.
            // This ensures the AI has the image link in its context immediately, without needing a tool call.
            const mediaMap = new Map<number, string[]>(); // Store Markdown links
            const commentMap = new Map<number, number>();
            const ticketDisplayIdMap = new Map<number, string>(); // ID -> Display ID Map
            
            if (activeTickets.length > 0) {
                const ticketIds = activeTickets.map((t: any) => {
                    ticketDisplayIdMap.set(t.id, t.display_id);
                    return t.id;
                });
                
                // Fetch Actual Media
                const mediaList = await db.select({
                    id: media.id, // Fetch ID for robust linking
                    ticket_id: media.ticket_id,
                    file_name: media.file_name,
                    file_key: media.file_key,
                    file_type: media.file_type,
                    url: media.url // Fetch URL
                })
                .from(media)
                .where(inArray(media.ticket_id, ticketIds))
                .all();

                mediaList.forEach((m: any) => {
                    // USE ROBUST ID-BASED URL (Avoids encoding issues with keys)
                    const publicUrl = `/api/media/${m.id}`;
                    
                    // JUST USE THE FILENAME. The context is already in the ticket description line.
                    const md = m.file_type.startsWith('image') 
                        ? `![${m.file_name}](${publicUrl})` 
                        : `[${m.file_name}](${publicUrl})`;
                    
                    const current = mediaMap.get(m.ticket_id) || [];
                    current.push(md);
                    mediaMap.set(m.ticket_id, current);
                });


                // Count Comments (Keep count for comments, too much text otherwise)
                const commentCounts = await db.select({
                    ticket_id: ticketComments.ticket_id,
                    count: sql<number>`count(*)`
                })
                .from(ticketComments)
                .where(inArray(ticketComments.ticket_id, ticketIds))
                .groupBy(ticketComments.ticket_id)
                .all();
                commentCounts.forEach((c: any) => commentMap.set(c.ticket_id, c.count));
            }

            // Fetch Dynamic Maps (Status & Priority)
            const { statusMap, priorityMap } = await getTicketMaps(db);

            // Calculate Workload & Availability Map
            const workloadMap = new Map();
            const machineStatusMap = new Map(); // Real-time machine status based on tickets

            activeTickets.forEach((t: any) => {
                // Technician Workload
                if (t.assigned_to) {
                    const current = workloadMap.get(t.assigned_to) || 0;
                    workloadMap.set(t.assigned_to, current + 1);
                }
                // Machine Status (If a machine has a Critical/High ticket, it's likely down or degraded)
                if (t.machine_id) {
                    const currentStatus = machineStatusMap.get(t.machine_id) || [];
                    
                    const mediaLinks = mediaMap.get(t.id) || [];
                    const cCount = commentMap.get(t.id) || 0;
                    
                    let mediaStr = "";
                    if (mediaLinks.length > 0) {
                         // Inject FIRST image directly, mention others
                         // FIX: Remove outer brackets to prevent Markdown parsing issues
                         mediaStr = ` PREUVE VISUELLE: ${mediaLinks[0]}`;
                         if (mediaLinks.length > 1) mediaStr += ` + ${mediaLinks.length - 1} autres`;
                    }
                    
                    const commStr = cCount > 0 ? ` [💬 ${cCount} messages]` : "";

                    // INJECT DISPLAY ID (e.g., FOU-1225-001) but KEEP numeric ID for Tools
                    // TRANSLATE STATUS/PRIORITY using Dynamic Maps
                    const statusFr = statusMap[t.status] || t.status;
                    const priorityFr = priorityMap[t.priority] || t.priority;
                    
                    currentStatus.push(`[TICKET #${t.id} | REF: ${t.display_id}] (${statusFr}, ${priorityFr}): ${t.title}${mediaStr}${commStr}`);
                    machineStatusMap.set(t.machine_id, currentStatus);
                }
            });

            // Generate RICH Summaries
            machinesSummary = machinesList.map(m => {
                const activeIssues = machineStatusMap.get(m.id);
                let state = m.status === 'out_of_service' ? '🔴 ARRÊT' : '🟢 EN MARCHE';
                
                // Logic: If manual status is OK but there are active tickets, qualify the state
                if (activeIssues && activeIssues.length > 0) {
                    state = m.status === 'out_of_service' ? '🔴 ARRÊT (Confirmé par tickets)' : '⚠️ FONCTIONNEL MAIS INCIDENTS EN COURS';
                }

                return `[ID:${m.id}] ${m.type} ${m.model || ''} - ÉTAT: ${state} ${activeIssues ? `(Détails: ${activeIssues.join(', ')})` : '(Aucun ticket actif)'}`;
            }).join('\n');
            
            usersSummary = usersList.map(u => {
                 // Privacy Check: Only Admins can see full Admin details
                 if (u.role === 'admin' && userRole !== 'admin') {
                     return `[ID:${u.id}] ${u.name} (ADMINISTRATEUR) - [INFO RESTREINTE]`;
                 }

                 const count = workloadMap.get(u.id) || 0;
                 const availability = count === 0 ? "✅ LIBRE (0 ticket)" : `❌ OCCUPÉ (${count} tickets actifs)`;
                 
                 return `[ID:${u.id}] ${u.name} (${u.role}) - ${availability} - Dernier login: ${u.last_login || 'Jamais'}`;
            }).join('\n');

            // Fetch TODAY'S Planning (Events)
            const todayStr = new Date().toISOString().split('T')[0];
            const todaysEvents = await db.select().from(planningEvents).where(eq(planningEvents.date, todayStr)).all() || [];
            planningSummary = todaysEvents.length > 0 
                ? todaysEvents.map((e: any) => `[${e.time || 'Journée'}] ${e.title}`).join(', ')
                : "Aucun événement planifié aujourd'hui.";
        } catch (contextError) {
            console.error("⚠️ [AI] Context Load Failed (Skipping to prevent crash):", contextError);
            // We continue without full context
        }

        // 3. FETCH USER HISTORY (Last 5 tickets, ANY status)
        let userHistory = "Aucun historique disponible.";
        try {
            if (userId) {
                const history = await db.select({
                    id: tickets.id,
                    display_id: tickets.ticket_id, // Fetch Display ID
                    title: tickets.title,
                    status: tickets.status,
                    machine_id: tickets.machine_id,
                    date: tickets.created_at
                })
                .from(tickets)
                .where(or(
                    eq(tickets.assigned_to, userId),
                    eq(tickets.reported_by, userId)
                ))
                .orderBy(desc(tickets.created_at))
                .limit(5)
                .all();

                if (history && history.length > 0) {
                    // Enrich history with machine names manually (since Drizzle join is complex here)
                    userHistory = history.map(h => {
                        const m = machinesList.find(m => m.id === h.machine_id);
                        const machineName = m ? `${m.type} ${m.model || ''}` : `Machine #${h.machine_id}`;
                        // USE DISPLAY_ID for talk, Numeric ID for tools
                        // REUSE DYNAMIC MAP (Status Only for History to save space)
                        const statusFr = statusMap[h.status] || h.status;
                        
                        return `- [${h.date}] [TICKET #${h.id} | REF: ${h.display_id || h.id}] (${statusFr}): ${h.title} sur ${machineName}`;
                    }).join('\n');
                }
            }
        } catch (historyError) {
             console.error("⚠️ [AI] History Load Failed:", historyError);
        }

        // NEW: FETCH RECENT IMAGE CONTEXT (Vision Relay)
        let recentImageContext = "";
        if (userId) {
            try {
                // FETCH ALL RECENT IMAGES (Analyzed OR Pending) - STRICTLY FROM 'expert_ai'
                const lastImages = await c.env.DB.prepare(`
                    SELECT id, transcription, created_at, media_key 
                    FROM chat_messages 
                    WHERE sender_id = ? 
                    AND conversation_id = 'expert_ai'
                    AND type = 'image' 
                    AND created_at > datetime('now', '-1 hours')
                    ORDER BY created_at DESC 
                    LIMIT 3
                `).bind(userId).all();

                if (lastImages && lastImages.results && lastImages.results.length > 0) {
                    recentImageContext = `\n[SYSTEM] HISTORIQUE VISUEL (IMAGES RÉCENTES) :\n`;
                    
                    // REVERSE to have Chronological Order (1 = Oldest, N = Newest)
                    // Query was DESC (Newest first) to get the *latest 3*.
                    // Reversing makes them [Oldest of the 3, ..., Newest of the 3]
                    // This allows user to refer to "Image 1" as the first one sent in the batch.
                    const chronoImages = [...(lastImages.results as any[])].reverse();

                    // @ts-ignore
                    for (const [idx, img] of chronoImages.entries()) {
                        let finalTranscript = img.transcription;
                        const isAnalyzed = finalTranscript && finalTranscript.includes('🖼️');
                        
                        // ON-DEMAND VISION (SMART & COST-EFFECTIVE):
                        // 1. ALWAYS analyze the MOST RECENT image (which is now the LAST in chronoImages) if unanalyzed.
                        // 2. LAZILY analyze older images ONLY IF user asks about "images", "previous", "1", "2", etc.
                        
                        const isMostRecent = idx === chronoImages.length - 1;
                        const keywordRegex = /(?:photo|image|picture|cliché|capture|écran|screen|precedente|previous|avant|before|premi|first|1|deux|second|2|trois|third|3|toutes|all|list|liste|description|détail|analys|voir|regard|check|what|quoi|comment)/i;
                        const looksLikeRefToPrevious = keywordRegex.test(message || '');
                        
                        const shouldAnalyze = !isAnalyzed && img.media_key && c.env.OPENAI_API_KEY && (isMostRecent || looksLikeRefToPrevious);

                        if (shouldAnalyze) {
                            console.log(`[AI] Forcing analysis for image ${img.id} (MostRecent: ${isMostRecent}, Keyword: ${looksLikeRefToPrevious})...`);
                            try {
                                const object = await c.env.MEDIA_BUCKET.get(img.media_key);
                                if (object) {
                                    const arrayBuffer = await object.arrayBuffer();
                                    const contentType = object.httpMetadata?.contentType || 'image/jpeg';
                                    const analysis = await analyzeImageWithOpenAI(arrayBuffer, contentType, c.env.OPENAI_API_KEY);
                                    
                                    if (analysis) {
                                        finalTranscript = "🖼️ " + analysis;
                                        // Update DB asynchronously
                                        c.executionCtx.waitUntil(
                                            c.env.DB.prepare(`UPDATE chat_messages SET transcription = ? WHERE id = ?`)
                                                .bind(finalTranscript, img.id).run()
                                        );
                                    }
                                }
                            } catch (err) {
                                console.error("[AI] Forced analysis failed:", err);
                            }
                        }

                        // FIX: Use PUBLIC media route to avoid auth/permission issues in Markdown
                        const publicUrl = `/api/media/public?key=${encodeURIComponent(img.media_key)}`;
                        // FIX: Provide Pre-formatted Markdown so AI doesn't have to guess
                        const imageMd = `![Image ${idx + 1}](${publicUrl})`;

                        if (finalTranscript && finalTranscript.includes('🖼️')) {
                            recentImageContext += `--- IMAGE #${idx + 1} (Reçue à ${img.created_at}) ---\nFICHIER: ${imageMd}\nCONTENU ANALYSÉ : ${finalTranscript}\n----------------\n`;
                        } else {
                            recentImageContext += `--- IMAGE #${idx + 1} (Reçue à ${img.created_at}) ---\nFICHIER: ${imageMd}\n[Analyse visuelle en cours...]\n----------------\n`;
                        }
                    }
                    
                    recentImageContext += `\n⚠️ INSTRUCTION VISION CRITIQUE :
                    1. Utilise les numéros "IMAGE #X" pour identifier les photos.
                    2. L'image #1 est la plus ancienne de la série, la #${chronoImages.length} est la plus récente (celle que l'utilisateur vient probablement d'envoyer).
                    3. Si l'utilisateur demande "la première photo", c'est l'image #1. "La dernière", c'est l'image #${chronoImages.length}.\n`;
                    
                    console.log(`[AI] Injected image contexts (Chronological)`);
                }
            } catch (e) {
                console.error("Failed to fetch image context", e);
            }
        }

        // Minimal Context (Who am I talking to?)
        const firstName = userName.split(' ')[0]; // Extract first name for human touch

        let systemPrompt = `
${aiConfig.identity}

INSTRUCTION DE PERSONNALISATION :
Tu t'adresses à **${firstName}**. Utilise son prénom naturellement pour rendre l'échange humain et professionnel.

DÉFINITION MÉTIER (TICKET OUVERT) :
Un **ticket ouvert** est une demande ou un problème signalé qui n'a pas encore été résolu ou fermé.
Cela inclut **tous les incidents en cours** :
- En attente de pièces (Pending Parts)
- En cours de diagnostic (In Diagnosis)
- Nécessitant des actions supplémentaires (In Progress)
En résumé, un ticket ouvert représente une **situation active** qui nécessite une attention continue jusqu'à ce qu'elle soit complètement résolue.

MANDAT D'AIDE À LA DÉCISION (VALEUR AJOUTÉE) :
Ton but ultime est d'aider l'administrateur à **PRENDRE DES DÉCISIONS**. Ne sois pas passif.
1. **ENRICHIS** : Ne donne pas juste un fait ("La machine est en panne"). Donne le contexte ("C'est la 3ème fois ce mois-ci, cela impacte le planning").
2. **SUGGÈRE** : Propose des options pragmatiques et réalistes ("Vu que Paul est surchargé, suggères-tu de confier ça à Marc qui est libre ?").
3. **ANTICIPE** : Signale les risques invisibles ("Attention, ce ticket critique n'a pas bougé depuis 48h").
4. **CONNECTE** : Fais le lien entre les pannes, les plannings et les équipes pour offrir une vue d'ensemble claire.

CAPACITÉ RÉDACTIONNELLE & ADMINISTRATIVE (MODE SECRÉTARIAT) :
Si l'utilisateur demande de rédiger un document (Rapport, Email, Lettre officielle, Demande de subvention, Avertissement...) :
1. **AUTORISATION** : Tu es autorisé à utiliser ta culture générale et tes compétences de rédaction avancées. Les règles de "Vérité Stricte Base de Données" ne s'appliquent pas à la *structure* ou au *style* du document.
2. **STYLE** : Adopte un ton formel, exécutif et adapté au contexte (juridique, administratif ou technique).
3. **DONNÉES** : Utilise les vrais noms/machines du contexte si pertinent, mais utilise des [PLACEHOLDERS] (ex: [DATE], [MONTANT]) pour les informations manquantes.
4. **FORMAT** : Structure le document parfaitement (Objets, Formules de politesse, Paragraphes clairs).

DONNÉES DE CONTEXTE (TEMPS RÉEL) :
- SERVEUR ACTUEL : ${baseUrl} (Utilise cette base pour les liens si nécessaire)
- UTILISATEUR : ${userName} (${userRole}, ID: ${userId || '?'})
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

DIRECTIVES OPÉRATIONNELLES (CRITIQUES) :

1. **SOURCE DE VÉRITÉ (OUTILS)** : Tu ne connais PAS l'état actuel de l'usine par magie.
   - **RÈGLE D'OR** : Si la réponse n'est pas EXPLICITEMENT dans le contexte ci-dessus, tu DOIS appeler un outil.
   - **INTERDICTION DE DEVINER** : Ne dis jamais "Je pense que..." ou "Probablement...". Vérifie avec \`search_tickets\`, \`check_machine_status\` ou \`check_technician_availability\`.
   - **ACCÈS BASE DE DONNÉES** : Tu as accès à tout. Si l'utilisateur demande une stat, utilise \`check_database_stats\`. Si c'est un historique, cherche.
2. **INTÉGRITÉ (ANTI-HALLUCINATION)** :
   - Rapporte UNIQUEMENT ce que les outils retournent.
   - Si l'outil dit "assigné: null", dis "Non assigné". N'invente jamais.
   - Ne confonds pas le créateur (celui qui signale) et l'assigné (celui qui répare).
3. **RAPPORTS D'ÉQUIPE & PERSONNEL** :
   - Si l'utilisateur demande un rapport sur les "techniciens", "opérateurs" ou "l'équipe", UTILISE L'OUTIL generate_team_report.
   - Ne te contente pas de lister les noms du contexte. L'outil te donnera le statut de connexion, les notifications, et les machines associées.
   - Sépare clairement les rôles (Techniciens vs Opérateurs).
   - Pour les Opérateurs : Indique toujours sur quelle machine ils travaillent (basé sur l'inférence de l'outil).
4. **IDENTIFICATION** : Utilise TOUJOURS le 'DISPLAY_ID' (ex: FOU-1225-001) pour parler d'un ticket. C'est la seule référence que l'utilisateur connaît.
4. **SÉCURITÉ & PLANNING** :
   - En tant qu'Administrateur, TU AS DROIT DE LIRE LE PLANNING GLOBAL DE L'USINE (Événements de production).
   - Utilise l'outil get_planning pour voir les événements futurs ou passés de l'usine.
   - CEPENDANT, les "Notes Personnelles" des autres utilisateurs restent STRICTEMENT PRIVÉES (Invisible même pour toi).

RÈGLES DE FORMATAGE (MARKDOWN STANDARD) :
1. **UTILISATION DU MARKDOWN** :
   - Utilise le Markdown standard pour enrichir tes réponses.
   - **Gras** : **Texte important**
   - **Listes** : - Item 1
   - **Titres** : ### Mon Titre (Utilise ### pour les sections)
   - **Tableaux** : Utilise la syntaxe Markdown standard.
   
   - **LIENS TICKETS (OBLIGATOIRE)** : Pour mentionner un ticket, utilise EXCLUSIVEMENT ce format exact :
     [Ticket #ID](${baseUrl}/?ticket=ID)
     Exemple : [Ticket #12](${baseUrl}/?ticket=12)
     
   - **INTERDICTION D'INVENTER** : N'utilise JAMAIS 'example.com', 'site.com'. Utilise TOUJOURS la variable ${baseUrl} fournie.
   
   - **Images/Médias** : Les images importantes sont DÉJÀ INCLUSES dans le contexte ci-dessus (format \`![Alt](URL)\`). 
   - **RÈGLE CRITIQUE** : Si tu vois une image dans le contexte, TU DOIS L'INCLURE dans ta réponse.
   - **INTERDICTION D'INVENTER** : N'invente JAMAIS d'URL (comme 'example.com', 'image.jpg' ou des placeholders). Utilise UNIQUEMENT les liens fournis explicitement dans le contexte (format /api/media/...). Si tu n'as pas de lien, ne mets pas d'image.
   - **NOMS DE FICHIERS** : Utilise le nom exact du fichier fourni.
   - **AUTOMATISME MACHINE** : Si l'utilisateur demande "Qu'est-ce qui se passe avec la machine X ?", ta réponse DOIT inclure les photos des tickets actifs (s'il y en a). Ne dis pas juste "Il y a des tickets", dis "Voici les tickets et leurs photos :" puis affiche les images.
   - **RECHERCHE DE FICHIERS** : Si l'utilisateur demande "Quels sont les fichiers ?" ou cherche un fichier spécifique introuvable ailleurs, UTILISE L'OUTIL \`list_recent_media\`. C'est ton explorateur de fichiers.
   - **LISTE DES MÉDIAS** : Si l'utilisateur demande "Quels sont les fichiers ?", liste les noms exacts que tu vois dans le contexte ou via l'outil.

2. **INTERDICTION DU HTML** :
   - N'utilise **JAMAIS** de balises HTML brutes (<p>, <div>, <table>, etc.).
   - Le système convertira ton Markdown en HTML.

3. **CONTENU RICHES & AUTOMATISME** :
   - **PREUVES VISUELLES** : Ne dis pas "il y a une photo". MONTRE LA PHOTO. Le lien est déjà là, utilise-le !
   - **COMMENTAIRES** : Si tu vois un tag **[💬 N messages]**, cela indique des discussions actives. Si pertinent, propose d'aller voir les détails.
   - **CITATIONS** : Si tu cites un commentaire ou une note d'un ticket, utilise le format citation Markdown (> commentaire).

${aiConfig.rules}
`;

        const messages = [
            { role: "system", content: systemPrompt },
            ...history.slice(-6), // Keep context
            { role: "user", content: message }
        ];

        // EXECUTION LOOP (Max 5 turns)
        let turns = 0;
        const MAX_TURNS = 5;
        let finalReply = "";

        while (turns < MAX_TURNS) {
            turns++;
            console.log(`🔄 [AI Loop] Turn ${turns}`);

            // Prepare Payload
            const payload: any = {
                messages: messages,
                temperature: 0.2,
                tools: TOOLS,
                tool_choice: "auto"
            };

            // Select Model (DeepSeek V3 supports tools, but fallback to OpenAI if needed)
            let apiUrl = 'https://api.openai.com/v1/chat/completions';
            let apiKey = c.env.OPENAI_API_KEY;
            let model = "gpt-4o-mini"; // OpenAI is more reliable for tools usually

            // Uncomment to try DeepSeek for tools if you trust it
            /*
            if (c.env.DEEPSEEK_API_KEY) {
                apiUrl = 'https://api.deepseek.com/chat/completions';
                apiKey = c.env.DEEPSEEK_API_KEY;
                model = "deepseek-chat"; 
            }
            */

            if (!apiKey) throw new Error("API Key missing");

            payload.model = model;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error("AI API Error:", errText);
                throw new Error("Erreur API IA: " + response.status);
            }

            const data = await response.json() as any;
            const choice = data.choices[0];
            const responseMessage = choice.message;

            // Add assistant message to history
            messages.push(responseMessage);

            // CHECK FOR TOOL CALLS
            if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
                console.log("🛠️ [AI] Tool Calls detected:", responseMessage.tool_calls.length);
                
                for (const toolCall of responseMessage.tool_calls) {
                    const fnName = toolCall.function.name;
                    const fnArgs = JSON.parse(toolCall.function.arguments);
                    
                    console.log(`🔨 Executing ${fnName} with args:`, fnArgs);

                    let toolResult = "Erreur: Outil inconnu";
                    
                    if (ToolFunctions[fnName as keyof typeof ToolFunctions]) {
                        try {
                            // @ts-ignore
                            toolResult = await ToolFunctions[fnName](db, fnArgs, userId);
                        } catch (err: any) {
                            toolResult = `Erreur d'exécution: ${err.message}`;
                        }
                    }

                    // Add result to history
                    messages.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        content: toolResult
                    });
                }
                // Loop continues to let AI process the tool results
            } else {
                // No tools called, this is the final answer
                finalReply = responseMessage.content;
                break;
            }
        }

        if (!finalReply) finalReply = "Désolé, je n'ai pas pu obtenir l'information (Limite de boucles atteinte).";

        return c.json({ reply: finalReply });

    } catch (e: any) {
        console.error("Chat AI Error:", e);
        return c.json({ error: e.message }, 500);
    }
});

// --- TEMPORARY DIAGNOSTIC PROBE (TO BE REMOVED) ---
app.get('/test-expert', async (c) => {
    const question = c.req.query('q') || "Quels sont les EPI obligatoires pour la coupe ?";
    
    // Fetch generic context for test
    const db = getDb(c.env);
    const aiConfig = await getAiConfig(db);
    
    const systemPrompt = `${aiConfig.identity}\n${aiConfig.knowledge}\nCONTEXTE: Test technique.`;
    
    try {
        if (!c.env.DEEPSEEK_API_KEY) return c.text("Pas de clé API", 500);
        
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${c.env.DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: question }
                ],
                temperature: 0.3
            })
        });
        const data = await response.json() as any;
        return c.text(data.choices[0].message.content);
    } catch (e: any) {
        return c.text("Erreur: " + e.message);
    }
});

// --- DEBUG ENDPOINT (TEMPORARY) ---
app.get('/debug-media', async (c) => {
    try {
        const db = getDb(c.env);
        const name = c.req.query('name') || 'Brahim';
        const searchPattern = `%${name}%`;
        
        const foundUsers = await db.select({ id: users.id, full_name: users.full_name, email: users.email })
            .from(users)
            .where(like(users.full_name, searchPattern))
            .all();
            
        let result = `Users matching '${name}': ${foundUsers.length}\n`;
        
        for (const user of foundUsers) {
            const mediaList = await db.select()
                .from(media)
                .where(eq(media.uploaded_by, user.id))
                .all();
            result += `- ${user.full_name} (ID: ${user.id}, Email: ${user.email}): ${mediaList.length} media files.\n`;
            if (mediaList.length > 0) {
                result += `  Latest: ${mediaList[mediaList.length-1].file_name}\n`;
            }
        }
        
        return c.text(result);
    } catch (e: any) {
        return c.text("Error: " + e.message);
    }
});

export default app;
