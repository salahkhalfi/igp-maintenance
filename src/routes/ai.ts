
import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { getDb } from '../db';
import { machines, users, systemSettings, tickets } from '../db/schema';
import { inArray, eq, and, ne, lt, desc, or } from 'drizzle-orm';
import { extractToken, verifyToken } from '../utils/jwt';
import type { Bindings } from '../types';
import { z } from 'zod';
import { GLASS_INDUSTRY_KNOWLEDGE, MAINTENANCE_OS_IDENTITY } from '../ai/knowledge/glass-industry';

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

// --- CONSTANTS ---
const DEFAULT_AI_CONTEXT = `RÔLE : Expert Industriel Senior chez IGP Inc. (Usine de verre)

MISSION :
Assister les techniciens et administrateurs dans la maintenance, le diagnostic de pannes et l'optimisation de la production.

RÈGLES D'OR :
1. SÉCURITÉ AVANT TOUT : Rappeler systématiquement les procédures de cadenassage (Lockout/Tagout) avant toute intervention physique.
2. CONTEXTE INDUSTRIEL : Se concentrer uniquement sur les machines, la maintenance, la production et la sécurité.
3. TON PROFESSIONNEL : Être direct, précis et factuel. Pas de bavardage inutile.
4. REFUS HORS-SUJET : Refuser poliment mais fermement toute question non liée au travail.

CONTEXTE DE L'USINE :
- Nous fabriquons du verre (trempé, laminé, isolant).
- Les machines critiques incluent : Fours de trempe, CNC, Lignes d'assemblage, Tables de découpe.
- La production fonctionne 24/7. Chaque minute d'arrêt coûte cher.`;

// --- HELPER FUNCTIONS ---

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
            // This ensures the app works for ANY industry based on the user's data.
            // MODIFICATION v3.0.13: Explicitly mention "Quebec dialect" to ensure Whisper doesn't "correct" the accent into standard French.
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
            // formData.append('language', 'fr'); // REMOVED: Allow auto-detection
            // Generic fallback prompt with dynamic vocabulary if possible, or just general terms
            // Allow auto-detection of language (remove explicit 'fr') to support polyglot users
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
async function analyzeText(transcript: string, context: any, env: Bindings): Promise<any> {
    
    // Construct System Prompt
    // Note: Cloudflare is in UTC. We simulate EST (UTC-5)
    const localDate = new Date(new Date().getTime() - (5 * 60 * 60 * 1000));
    
    const systemPrompt = `
You are a Senior Industrial Maintenance Expert at IGP Inc. (Glass Factory).
Your mission: Analyze a raw voice request (often noisy, Quebecker French or English) and extract structured data to create a ticket.

USER CONTEXT:
Name: ${context.userName}
Role: ${context.userRole}
CURRENT DATE (EST): ${localDate.toISOString().replace('T', ' ').substring(0, 16)}

CUSTOM CONTEXT:
${context.customContext || "No specific context."}

MACHINE CONTEXT:
${context.machines}

TEAM CONTEXT:
${context.techs}

STRICT EXTRACTION RULES:

1. LANGUAGE ADAPTATION (CRITICAL & ABSOLUTE):
   - DETECT the language of the user's voice transcript.
   - IF User speaks FRENCH (or Quebecois) -> JSON values MUST be in FRENCH.
   - IF User speaks ENGLISH -> JSON values MUST be in ENGLISH.
   - Example: "My furnace is broken" -> title: "Furnace breakdown", description: "The furnace is broken..." (NOT "Four en panne").

2. JESTER PROTOCOL (Anti-Nonsense & Humor):
   - IGNORE polite fillers ("uh", "please").
   - IF input is clearly OFF-TOPIC, a JOKE, an INSULT, or NONSENSE:
     -> Generate a "Trap Ticket" (Faux Ticket).
     -> 'priority': "low"
     -> 'title': "Cognitive Anomaly Report" (EN) / "Rapport d'Anomalie Cognitive" (FR)
     -> 'description': [YOUR IMMEDIATE DEADPAN RESPONSE]
     -> RULES FOR RESPONSE:
        - NO PREAMBLE. Direct punchline.
        - Deadpan Industrial Humor.
        - Use glass/maintenance jargon (tempering, CNC, polishing).
        - English Example (Pizza): "Critical Alert: Attempt to insert organic matter into tempering furnace. Operator quarantined."
        - French Example (Pizza): "Alerte Critique : Tentative d'insertion de matière organique. Opérateur mis en quarantaine."

3. PRIORITY:
   - "Urgent", "Critical", "Fire", "Leak", "Danger" -> 'critical'
   - "Important", "Fast" -> 'high'
   - Standard maintenance -> 'medium'
   - Cosmetic/Low priority -> 'low'

4. MACHINE IDENTIFICATION:
   - Match user text to 'MACHINE CONTEXT' list.
   - If match found -> Set 'machine_id' and exact 'machine_name'.
   - If general mention ("the drill") but no exact match -> 'machine_id': null, 'machine_name': "Drill" (in correct language).

5. ASSIGNMENT:
   - Match names from 'TEAM CONTEXT'.
   - If date mentioned but no name -> 'assigned_to_id': 0 (Team).

6. DATE/TIME:
   - Convert all relative times ("tomorrow 2pm") to ISO 8601 (YYYY-MM-DDTHH:mm:ss) based on CURRENT DATE.

7. TITLE & DESCRIPTION CLEANUP:
   - Reformulate raw spoken text into professional technical language (in the CORRECT DETECTED LANGUAGE).
   - FR Ex: "Euh la strappe est pété" -> "Remplacement courroie"
   - EN Ex: "Uh the belt is busted" -> "Belt replacement"

EXPECTED JSON FORMAT (Reply ONLY with this JSON):
{
  "title": "Short title (EN or FR)",
  "description": "Full professional description (EN or FR)",
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
                    // On pourrait ici tenter de réparer ou renvoyer une erreur,
                    // mais pour l'instant on laisse le fallback prendre le relais ou on renvoie une erreur explicite.
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

        // FALLBACK: Try Cookie if Header is missing (Robustness for Mobile/Web)
        if (!token) {
            token = getCookie(c, 'auth_token') || null;
        }

        let userRole = 'unknown';
        let userName = 'Utilisateur inconnu';

        // 3. Load Database Context FIRST (For Dynamic AI Vocabulary)
        const db = getDb(c.env);

        if (token && c.env.JWT_SECRET) {
            const payload = await verifyToken(token, c.env.JWT_SECRET);
            if (payload) {
                userRole = payload.role;
                userName = payload.full_name || payload.email;
            }
        }

        // 2. Get Audio
        const formData = await c.req.formData();
        const audioFile = formData.get('file') as File;
        if (!audioFile) return c.json({ error: "No audio file" }, 400);
        
        // CRITICAL FIX: Fetch FULL machine details (Type, Model, Manufacturer, Location)
        // Previous version only fetched 'machine_type', causing the AI to fail at identifying specific machines
        const machinesList = await db.select({
            id: machines.id, 
            type: machines.machine_type,
            model: machines.model,
            manufacturer: machines.manufacturer,
            location: machines.location
        }).from(machines).all();
        
        const techsList = await db.select({
            id: users.id, name: users.full_name, role: users.role
        }).from(users).where(inArray(users.role, ['admin', 'supervisor', 'technician', 'senior_technician', 'team_leader'])).all();

        // Build a RICH context for the AI
        const machinesContext = machinesList.map(m => 
            `ID ${m.id}: ${m.type} ${m.manufacturer || ''} ${m.model || ''} [Loc: ${m.location || '?'}]`
        ).join('\n');
        
        const techsContext = techsList.map(t => `ID ${t.id}: ${t.name} (${t.role})`).join('\n');

        // 4. Load Custom AI Context
        const customContextSetting = await db.select({
            value: systemSettings.setting_value
        }).from(systemSettings).where(eq(systemSettings.setting_key, 'ai_custom_context')).get();

        const customContext = customContextSetting?.value || DEFAULT_AI_CONTEXT;

        // Dynamic Vocabulary from Database + Common Terms
        // Crucial for Whisper to recognize "Tamglass" or "Bottero" instead of random words
        const vocabularyContext = [
            ...machinesList.map(m => `${m.type} ${m.manufacturer || ''} ${m.model || ''}`),
            ...techsList.map(t => t.name),
            "Maintenance", "Panne", "Urgent", "Réparation", "Fuite", "Bruit", "Arrêt", "Danger", "Sécurité",
            customContext // Inject custom context keywords into vocabulary if relevant (simple append)
        ].join(", ");

        // 5. Transcribe with Dynamic Vocabulary (Groq -> OpenAI)
        const transcript = await transcribeAudio(audioFile, c.env, vocabularyContext);
        if (!transcript) {
            return c.json({ error: "Impossible de transcrire l'audio (Services indisponibles)" }, 502);
        }
        
        // 6. Analyze (Cascade: DeepSeek -> OpenAI)
        const ticketData = await analyzeText(transcript, {
            userName, userRole, machines: machinesContext, techs: techsContext, customContext
        }, c.env);

        // 7. Final Polish
        if (ticketData.scheduled_date && !ticketData.scheduled_date.includes('T')) {
            ticketData.scheduled_date = null; // Safety check
        }

        return c.json(ticketData);

    } catch (e: any) {
        console.error("❌ [AI] Critical Error:", e);
        return c.json({ error: e.message || "Erreur système AI" }, 500);
    }
});

// POST /api/ai/chat - Expert Advice Chat
app.post('/chat', async (c) => {
    try {
        const authHeader = c.req.header('Authorization');
        let token = extractToken(authHeader);

        // FALLBACK: Try Cookie if Header is missing
        if (!token) {
            token = getCookie(c, 'auth_token') || null;
        }

        let userRole = 'unknown';
        let userName = 'Utilisateur inconnu';

        let userId: number | null = null;

        if (token && c.env.JWT_SECRET) {
            const payload = await verifyToken(token, c.env.JWT_SECRET);
            if (payload) {
                userRole = payload.role;
                userName = payload.full_name || payload.email;
                userId = payload.userId;
            }
        }

        const body = await c.req.json();
        const { message, ticketContext, history, isAnalysisRequest } = body;

        // Load Custom AI Context
        const db = getDb(c.env);
        
        // --- CONTEXTUAL INTELLIGENCE: FETCH TECHNICIAN DOSSIER ---
        let technicianContext = "";
        if (userId) {
            try {
                // 1. Get Open Tickets (Assigned to user)
                const openTickets = await db.select({
                    id: tickets.ticket_id,
                    title: tickets.title,
                    status: tickets.status,
                    priority: tickets.priority
                }).from(tickets)
                .where(and(
                    eq(tickets.assigned_to, userId),
                    ne(tickets.status, 'resolved'),
                    ne(tickets.status, 'closed')
                ))
                .limit(3);

                // 2. Get Overdue Tickets (Assigned to user)
                // Note: String date comparison YYYY-MM-DD
                const today = new Date().toISOString().split('T')[0];
                const overdueTickets = await db.select({
                    id: tickets.ticket_id,
                    title: tickets.title,
                    date: tickets.scheduled_date
                }).from(tickets)
                .where(and(
                    eq(tickets.assigned_to, userId),
                    ne(tickets.status, 'resolved'),
                    ne(tickets.status, 'closed'),
                    lt(tickets.scheduled_date, today)
                ))
                .limit(2);

                if (openTickets.length > 0 || overdueTickets.length > 0) {
                    technicianContext = `
DOSSIER CONFIDENTIEL DE L'INTERLOCUTEUR (${userName}) :
[TICKETS EN COURS] :
${openTickets.map(t => `- Ticket #${t.id}: "${t.title}" (Priorité: ${t.priority})`).join('\n')}

[TICKETS EN RETARD (URGENT)] :
${overdueTickets.length > 0 ? overdueTickets.map(t => `- ⚠️ #${t.id}: "${t.title}" (Prévu le: ${t.date})`).join('\n') : "Aucun retard."}

INSTRUCTION SECRÈTE :
Utilise ces infos pour personnaliser ta réponse. Si un ticket est en retard ou critique, demande subtilement s'il a besoin d'aide pour avancer dessus ("Au fait, comment ça avance pour le ticket #${overdueTickets[0]?.id || openTickets[0]?.id} ?"). Montre que tu suis le dossier.
`;
                }

            } catch (err) {
                console.warn("⚠️ [AI] Failed to fetch technician context:", err);
                // Fail silently, do not break the chat
            }
        }

        const customContextSetting = await db.select({
            value: systemSettings.setting_value
        }).from(systemSettings).where(eq(systemSettings.setting_key, 'ai_custom_context')).get();

        const customContext = customContextSetting?.value || DEFAULT_AI_CONTEXT;

        // FETCH MACHINE DETAILS IF AVAILABLE
        let machineDetails = "";
        
        try {
            // Strategy: Provide specific context if possible to avoid overload, otherwise general summary.
            if (ticketContext && ticketContext.machine_id) {
                 const mId = Number(ticketContext.machine_id);
                 const specificMachine = await db.select().from(machines).where(eq(machines.id, mId)).get();
                 
                 if (specificMachine) {
                     machineDetails = `
CONTEXTE MACHINE SPÉCIFIQUE (Machine liée au ticket) :
- ID: ${specificMachine.id}
- Nom: ${specificMachine.machine_type} ${specificMachine.model || ''}
- Marque: ${specificMachine.manufacturer || 'N/A'}
- Localisation: ${specificMachine.location || 'N/A'}
- Statut: ${specificMachine.status}
- Spécifications Techniques: ${specificMachine.technical_specs || 'Non spécifiées'}
`;
                 }
            } 
            
            // --- GESTION INTELLIGENTE DES ACCÈS (RBAC) ---
            // "Le Gros Bon Sens" : On ne montre pas tout à tout le monde.
            
            const isAdmin = ['admin', 'supervisor', 'super_admin'].includes(userRole);
            const isTech = ['technician', 'senior_technician', 'team_leader', 'maintenance'].includes(userRole);
            const isOperator = !isAdmin && !isTech; // Opérateurs, Invités, Stagiaires

            // 1. RÉCUPÉRATION DES DONNÉES (Query)
            // On récupère toujours les machines et tickets critiques pour la sécurité
            const allMachines = await db.select({ 
                id: machines.id, 
                type: machines.machine_type, 
                model: machines.model, 
                status: machines.status 
            }).from(machines).all();
            
            const criticalTickets = await db.select({
                id: tickets.ticket_id,
                title: tickets.title,
                status: tickets.status,
                priority: tickets.priority
            }).from(tickets).where(and(eq(tickets.priority, 'critical'), ne(tickets.status, 'resolved'))).limit(5);

            // 2. FILTRAGE DE L'INFORMATION (View Layer)
            let factoryOverview = "";

            if (isAdmin || isTech) {
                // --- VUE "CONTRÔLE & MAINTENANCE" (Admins & Techniciens) ---
                // LIMITATION DE LA LISTE POUR ÉVITER LE TIMEOUT (Optimisation v2)
                // 50 -> 30 pour réduire la charge du prompt
                
                const allTechs = await db.select({ id: users.id, name: users.full_name, role: users.role })
                    .from(users)
                    .limit(30) // Réduit de 50 à 30
                    .all();
                
                const machinesSummary = allMachines.slice(0, 30); // Réduit de 50 à 30

                factoryOverview = `
[ÉTAT GLOBAL DE L'USINE - VUE ${isAdmin ? 'ADMINISTRATEUR' : 'TECHNIQUE'}] :

1. ÉQUIPE (Annuaire Opérationnel - Top 30) :
${allTechs.map(u => `- ${u.name} (${u.role}) [ID:${u.id}]`).join('\n')}

2. PARC MACHINES (Top 30) :
${machinesSummary.map(m => `- [ID:${m.id}] ${m.type} ${m.model || ''} (${m.status.toUpperCase()})`).join('\n')}

3. URGENCES CRITIQUES (Top 5) :
${criticalTickets.length > 0 ? criticalTickets.map(t => `- #${t.id}: ${t.title} [${t.status}]`).join('\n') : "Aucune urgence critique."}
`;
            } else {
                // --- VUE "PLANCHER" (Opérateurs) ---
                // Pas de noms d'utilisateurs (confidentialité), pas de détails techniques inutiles.
                // Juste : Est-ce que ma machine marche ? Est-ce qu'il y a un danger ?
                
                factoryOverview = `
[ÉTAT GLOBAL DE L'USINE - VUE OPÉRATEUR] :
(Note: Informations filtrées pour la pertinence opérationnelle)

1. STATUT DES LIGNES :
${allMachines.map(m => `- ${m.type} : ${m.status === 'operational' ? '✅ OPÉRATIONNEL' : '⚠️ ' + m.status.toUpperCase()}`).join('\n')}

2. ALERTES SÉCURITÉ / MAINTENANCE :
${criticalTickets.length > 0 ? criticalTickets.map(t => `- ⚠️ ALERTE SUR MACHINE (Ticket #${t.id}) : Maintenance en cours`).join('\n') : "Aucune alerte majeure."}
`;
            }

            machineDetails += factoryOverview;

        } catch (err) {
            console.warn("⚠️ [AI] Error fetching machine details:", err);
        }

        // Construct System Prompt
        let systemPrompt = `
${MAINTENANCE_OS_IDENTITY}

CONTEXTE UTILISATEUR ACTUEL (Toi, tu parles à cette personne) :
- Nom : ${userName}
- Rôle : ${userRole}
- ID : ${userId || 'Non identifié'}
IMPORTANT : Si l'utilisateur demande "Qui suis-je ?", TU DOIS répondre en utilisant ces informations exactes. Dis-lui son nom et son rôle.

${technicianContext}

CONTEXTE TICKET ACTUEL :
Titre: ${ticketContext?.title || 'N/A'}
Description: ${ticketContext?.description || 'N/A'}
Machine: ${ticketContext?.machine_name || 'N/A'}

${machineDetails}

IDENTITÉ & LOYAUTÉ (CRITIQUE) :
Tu es l'Expert Industriel Senior d'IGP (Les Produits Verriers International Inc.), situé au 9150 Bd Maurice-Duplessis, Montréal, QC H1E 7C2.
Téléphone : (514) 354-5277 | Email : info@igpglass.com | Heures : Lun-Ven 8h00-16h30.

TA HIÉRARCHIE (FICTIVE MAIS SÉRIEUSE) :
- Propriétaires : Harvey et Lorne Dubrofsky (Les propriétaires ultimes. On ne les dérange JAMAIS pour les opérations. On les invoque SEULEMENT en cas d'abus grave ou de perte de temps flagrante).
- Directeur des Opérations : Marc Bélanger (Le VRAI patron des opérations, maintenance, production et achats. C'est LUI qui surveille les tickets, les retards et l'efficacité au quotidien).

TON CARACTÈRE :
1.  **LOYAL & PROTECTEUR** : Tu défends les intérêts d'IGP. Le temps, c'est de l'argent.
2.  **DISCIPLINÉ** : Si l'utilisateur pose une question stupide, paresseuse ou hors-sujet, tu le recadres immédiatement.
    -   *Phrase type (Abus/Perte de temps)* : "Je ne suis pas sûr que Harvey et Lorne apprécieraient qu'on perde du temps là-dessus."
    -   *Pression Opérationnelle (Tickets/Retards)* : "Marc Bélanger s'attend à ce que ce problème soit réglé rapidement." ou "Je vais devoir en informer Marc si ce n'est pas résolu."
    -   *Rappel à l'ordre* : "Je suis ici pour la production, pas pour le divertissement. Retournons au travail."
3.  **EXPERT** : Sur les sujets techniques (verre, machines, maintenance), tu es une encyclopédie absolue et serviable.
4.  **SUBTILITÉ** : Garde une touche d'humour corporatif pince-sans-rire. Tu n'es pas méchant, juste "très corporate".

${GLASS_INDUSTRY_KNOWLEDGE}

PHASE 1 : VALIDATION DE LA QUALITÉ (FILTRE ANTI-GASPILLAGE)
Avant de te lancer dans une analyse, évalue si la description du ticket est exploitable.
- Si le contenu est INSIGNIFIANT ("test", "asdf", "123", "."), VIDE ou TROP VAGUE ("ça marche pas", "panne") :
  -> Réponds UNIQUEMENT par une demande de précision professionnelle, teintée de ton caractère.
  -> Exemple : "C'est un peu court. Harvey ne paie pas pour des devinettes. Quelle machine ? Quels symptômes ?"
  -> NE FAIS PAS D'ANALYSE si la qualité est insuffisante.

RÈGLES STRICTES DE COMPORTEMENT (GUARDRAILS) :
1.  **SUJETS AUTORISÉS UNIQUEMENT** : Tu ne réponds QU'AUX questions liées à l'industrie du verre, la maintenance, la mécanique, l'électricité, la sécurité industrielle ou la gestion de production.
2.  **REFUS PROFESSIONNEL** : Si l'utilisateur pose une question hors-sujet (recette de cuisine, blague, sport, météo, politique...), tu dois REFUSER POLIMENT MAIS FERMEMENT en invoquant la direction.
    - Phrase type : "Harvey et Lorne n'aimeraient pas trop qu'on jase de ça sur les heures de bureau. Au travail."
3.  **TON** : Direct, professionnel, "Expert Senior" avec une allégeance totale à IGP.
4.  **SÉCURITÉ** : Rappelle toujours les procédures de sécurité (Lockout/Cadenassage) si une intervention physique est suggérée.
5.  **ADAPTATION LINGUISTIQUE** :
    - Si l'utilisateur parle FRANÇAIS -> Réponds en FRANÇAIS.
    - Si l'utilisateur parle ANGLAIS -> Réponds en ANGLAIS.
    - Adapte ton jargon technique à la langue utilisée (Ex: "Tempering furnace" vs "Four de trempe").

`;

        // If specific analysis request, force a specific structure
        if (isAnalysisRequest) {
            systemPrompt += `
L'utilisateur demande une ANALYSE APPROFONDIE ET IMMÉDIATE de ce ticket spécifique.
Tu dois agir comme un consultant qui vient d'arriver devant la machine.

FORMAT DE RÉPONSE OBLIGATOIRE (Markdown) :
## 🔍 Diagnostic & Causes Probables
*   Listez 2-3 causes techniques possibles (mécanique, électrique, hydraulique...) basées sur les symptômes.

## 🛠️ Solution Recommandée
*   Étapes claires de réparation.

## 📦 Pièces & Outillage
*   Quelles pièces vérifier/remplacer ? (Ex: Courroies, Capteurs, Fusibles...)

## 🛡️ Prévention
*   Comment éviter que cela ne se reproduise ?
`;
        }

        const messages = [
            { role: "system", content: systemPrompt },
            ...history.slice(-10), // Keep last 10 messages for context window
            { role: "user", content: message }
        ];

        // Call DeepSeek (Preferred) or OpenAI
        let reply = "";

        if (c.env.DEEPSEEK_API_KEY) {
             const response = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${c.env.DEEPSEEK_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: messages,
                    temperature: 0.3
                })
            });
            if (response.ok) {
                const data = await response.json() as any;
                reply = data.choices[0].message.content;
            }
        }

        if (!reply && c.env.OPENAI_API_KEY) {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${c.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: messages,
                    temperature: 0.3
                })
            });
            if (response.ok) {
                const data = await response.json() as any;
                reply = data.choices[0].message.content;
            }
        }

        if (!reply) throw new Error("Service IA indisponible");

        // Add debugging header
        c.header('X-User-Identified', userId ? 'true' : 'false');
        c.header('X-User-Name', userName);
        c.header('X-User-Role', userRole);

        return c.json({ reply });

    } catch (e: any) {
        console.error("Chat AI Error:", e);
        return c.json({ error: e.message }, 500);
    }
});

// --- TEMPORARY DIAGNOSTIC PROBE (TO BE REMOVED) ---
app.get('/test-expert', async (c) => {
    const question = c.req.query('q') || "Quels sont les EPI obligatoires pour la coupe ?";
    const systemPrompt = `${MAINTENANCE_OS_IDENTITY}\n${GLASS_INDUSTRY_KNOWLEDGE}\nCONTEXTE: Test technique.`;
    
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

export default app;
