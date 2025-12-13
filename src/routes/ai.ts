
import { Hono } from 'hono';
import { getDb } from '../db';
import { machines, users, systemSettings } from '../db/schema';
import { inArray, eq } from 'drizzle-orm';
import { extractToken, verifyToken } from '../utils/jwt';
import type { Bindings } from '../types';
import { z } from 'zod';

const app = new Hono<{ Bindings: Bindings }>();

// --- VALIDATION SCHEMA ---
const TicketAnalysisSchema = z.object({
    title: z.string().min(1, "Titre requis"),
    description: z.string().min(1, "Description requise"),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    machine_id: z.number().nullable(),
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
            formData.append('language', 'fr'); // Force French for consistency
            
            // DYNAMIC CONTEXT (Generic Philosophy):
            // We use the dynamic vocabulary from the database (machines, techs) to guide Groq.
            // This ensures the app works for ANY industry based on the user's data.
            formData.append('prompt', `Contexte: Maintenance professionnelle (contexte québécois possible). Mots clés: ${vocabulary}`);
            
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
            formData.append('language', 'fr'); 
            // Generic fallback prompt with dynamic vocabulary if possible, or just general terms
            formData.append('prompt', `Technicien maintenance. Langue française. Termes: ${vocabulary}`);

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
Tu es un assistant expert en maintenance technique.
Ta mission : Analyser une demande vocale brute (souvent bruitée ou en français québécois familier) et en extraire les données pour créer un ticket structuré.

CONTEXTE UTILISATEUR (Demandeur):
Nom: ${context.userName}
Rôle: ${context.userRole}
DATE ACTUELLE (EST) : ${localDate.toISOString().replace('T', ' ').substring(0, 16)}

CONTEXTE PERSONNALISÉ (À PROPOS DE L'ENTREPRISE):
${context.customContext || "Aucun contexte spécifique défini."}

CONTEXTE MACHINES (Liste des équipements):
${context.machines}

CONTEXTE EQUIPE (Liste des techniciens):
${context.techs}

RÈGLES D'EXTRACTION STRICTES :
1. ROBUSTESSE LINGUISTIQUE :
   - Comprends le français québécois familier ("char" = voiture, "break" = pause, "jammé" = coincé, "fucké" = cassé).
   - Ignore les bruits de fond, hésitations ("euh", "ben", "tsé") et politesses.
   - Concentre-toi sur les FAITS TECHNIQUES.

2. PRIORITÉ (IMPORTANT) :
   - Si tu entends "Urgent", "Prioritaire", "Critique", "Emergency", "Fuite", "Feu", "Danger", "Ça presse", "Arrêt complet" -> 'priority' = 'critical'.
   - Si tu entends "Important", "Besoin rapide", "Dès que possible" -> 'priority' = 'high'.
   - Si c'est de la maintenance normale ou non spécifiée -> 'priority' = 'medium'.
   - Si c'est cosmétique ou "quand vous aurez le temps" -> 'priority' = 'low'.

3. IDENTIFICATION MACHINE (RÈGLE CRITIQUE) :
   - Regarde attentivement la liste 'CONTEXTE MACHINES' fournie.
   - Cherche une correspondance avec ce que dit l'utilisateur (même approximative).
   - Si l'utilisateur dit "Four Tamglass" et que la liste contient "ID 5: Four Tamglass HTF", ALORS 'machine_id' = 5.
   - Si l'utilisateur dit juste "La CNC" et qu'il y en a plusieurs, essaie de déduire avec le contexte ou choisis la plus probable/principale si possible, sinon null.
   - Si tu trouves une machine correspondante, tu DOIS mettre son ID dans 'machine_id'.

4. ASSIGNATION (RÈGLE IMPORTANTE) :
   - Cherche le nom d'un technicien dans la liste 'CONTEXTE EQUIPE'.
   - Si tu entends un NOM -> 'assigned_to_id' = ID correspondant.
   - Si tu entends une DATE (ex: "pour demain", "lundi prochain") mais AUCUN NOM -> 'assigned_to_id' = 0 (Cela signifie "Assigner à toute l'équipe").
   - Si aucun nom et aucune date -> 'assigned_to_id' = null.

5. DATE ET HEURE (RÈGLE STRICTE) :
   - Tu dois extraire toute mention de temps (ex: "demain matin", "lundi à 14h", "dans 2 heures").
   - Convertis TOUJOURS ces mentions en format ISO 8601 PRECIS (YYYY-MM-DDTHH:mm:ss) en te basant sur la DATE ACTUELLE fournie.
   - Ex: Si on est le 2023-10-25 10:00 et l'utilisateur dit "demain 14h", 'scheduled_date' = "2023-10-26T14:00:00".
   - Si aucune heure n'est précisée pour une date ("pour demain"), mets par défaut 08:00:00.

6. TITRE ET DESCRIPTION (NETTOYAGE PRO) :
   - Tu es un secrétaire technique. Reformule le texte brut en langage professionnel standard.
   - Exemple : "Euh la strappe est pété sur la drill" -> Titre: "Remplacement courroie perceuse" / Desc: "La courroie de la perceuse est brisée, intervention requise."
   - NE PAS INVENTER : N'ajoute pas de détails techniques non mentionnés.
   - Si le texte est incompréhensible mais qu'une MACHINE est identifiée, mets en Titre : "Intervention requise : [Nom Machine]".

FORMAT JSON ATTENDU (Réponds UNIQUEMENT ce JSON) :
{
  "title": "Titre court",
  "description": "Description complète",
  "priority": "low" | "medium" | "high" | "critical",
  "machine_id": number | null,
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
        const token = extractToken(authHeader);
        let userRole = 'unknown';
        let userName = 'Utilisateur inconnu';

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

        // 3. Load Database Context FIRST (For Dynamic AI Vocabulary)
        const db = getDb(c.env);
        
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
        const token = extractToken(authHeader);
        let userRole = 'unknown';
        let userName = 'Utilisateur inconnu';

        if (token && c.env.JWT_SECRET) {
            const payload = await verifyToken(token, c.env.JWT_SECRET);
            if (payload) {
                userRole = payload.role;
                userName = payload.full_name || payload.email;
            }
        }

        const body = await c.req.json();
        const { message, ticketContext, history, isAnalysisRequest } = body;

        // Load Custom AI Context
        const db = getDb(c.env);
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
            
            if (!machineDetails) {
                const allMachines = await db.select({
                    id: machines.id,
                    type: machines.machine_type,
                    model: machines.model,
                    location: machines.location
                }).from(machines).all();

                if (allMachines.length > 0) {
                    const limitedMachines = allMachines.slice(0, 30); 
                    const listStr = limitedMachines.map(m => 
                        `- [ID ${m.id}] ${m.type} ${m.model || ''} (${m.location || '?'})`
                    ).join('\n');
                    
                    machineDetails = `
LISTE DES MACHINES DISPONIBLES (Vue d'ensemble) :
${listStr}
${allMachines.length > 30 ? `... (+ ${allMachines.length - 30} autres machines)` : ''}
`;
                }
            }
        } catch (err) {
            console.warn("⚠️ [AI] Error fetching machine details:", err);
        }

        // Construct System Prompt
        let systemPrompt = `
Tu es l'Expert Industriel Senior d'IGP Inc. (Usine de verre).
Ton rôle est d'assister les techniciens et administrateurs dans la maintenance et la résolution de pannes.

CONTEXTE UTILISATEUR :
Nom: ${userName}
Rôle: ${userRole}

CONTEXTE TICKET ACTUEL :
Titre: ${ticketContext?.title || 'N/A'}
Description: ${ticketContext?.description || 'N/A'}
Machine: ${ticketContext?.machine_name || 'N/A'}

${machineDetails}

CONTEXTE EXPERTISE (À PROPOS DE L'ENTREPRISE) :
${customContext}

PHASE 1 : VALIDATION DE LA QUALITÉ (FILTRE ANTI-GASPILLAGE)
Avant de te lancer dans une analyse, évalue si la description du ticket est exploitable.
- Si le contenu est INSIGNIFIANT ("test", "asdf", "123", "."), VIDE ou TROP VAGUE ("ça marche pas", "panne") :
  -> Réponds UNIQUEMENT par une demande de précision professionnelle.
  -> Exemple : "Je ne dispose pas d'assez d'informations pour établir un diagnostic fiable. Veuillez préciser la marque de la machine, le modèle exact et décrire les symptômes observés (bruit, code d'erreur, fuite...)."
  -> NE FAIS PAS D'ANALYSE si la qualité est insuffisante.

RÈGLES STRICTES DE COMPORTEMENT (GUARDRAILS) :
1.  **SUJETS AUTORISÉS UNIQUEMENT** : Tu ne réponds QU'AUX questions liées à l'industrie du verre, la maintenance, la mécanique, l'électricité, la sécurité industrielle ou la gestion de production.
2.  **REFUS PROFESSIONNEL** : Si l'utilisateur pose une question hors-sujet (recette de cuisine, blague, sport, météo, politique, philosophie générale...), tu dois REFUSER POLIMENT MAIS FERMEMENT.
    - Phrase type à utiliser : "Je suis ici pour travailler. Le temps d'IGP est précieux, concentrons-nous sur la production pour mériter notre salaire."
3.  **TON** : Direct, professionnel, "Expert Senior". Pas de bla-bla inutile.
4.  **SÉCURITÉ** : Rappelle toujours les procédures de sécurité (Lockout/Cadenassage) si une intervention physique est suggérée.

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

        return c.json({ reply });

    } catch (e: any) {
        console.error("Chat AI Error:", e);
        return c.json({ error: e.message }, 500);
    }
});

export default app;
