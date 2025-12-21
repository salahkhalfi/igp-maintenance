
import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { getDb } from '../db';
import { machines, users, systemSettings, tickets, media, ticketComments, planningEvents, userPreferences } from '../db/schema';
import { inArray, eq, and, ne, lt, desc, or, sql, not, like } from 'drizzle-orm';
import { extractToken, verifyToken } from '../utils/jwt';
import type { Bindings } from '../types';
import { z } from 'zod';
import { TOOLS, ToolFunctions } from '../ai/tools';
import { buildDynamicContext, getApiKeys, getAiConfig } from '../ai/context';

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
    priority: z.string().optional(), // Flexible string to support custom priorities
    machine_id: z.number().nullable(),
    machine_name: z.string().nullable(),
    assigned_to_id: z.number().nullable(),
    assigned_to_name: z.string().nullable(),
    scheduled_date: z.string().nullable()
});

// 1. Audio Transcription
async function transcribeAudio(audioFile: File, env: Bindings, db: any, vocabulary: string): Promise<string | null> {
    const keys = await getApiKeys(env, db);

    if (keys.groq) {
        try {
            console.log("🎤 [AI] Trying Groq Whisper...");
            const formData = new FormData();
            formData.append('file', audioFile);
            formData.append('model', 'whisper-large-v3');
            formData.append('prompt', `Context: Industrial maintenance. Languages: English or French (including Quebec dialect). Terms: ${vocabulary}`);
            
            const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${keys.groq}` },
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

    if (keys.openai) {
        try {
            console.log("🎤 [AI] Fallback to OpenAI Whisper...");
            const formData = new FormData();
            formData.append('file', audioFile, 'voice_ticket.webm');
            formData.append('model', 'whisper-1');
            formData.append('prompt', `Context: Industrial maintenance. Languages: English or French (including Quebec dialect). Terms: ${vocabulary}`);

            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${keys.openai}` },
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
async function analyzeText(transcript: string, context: any, env: Bindings, db: any, aiConfig: any, timezoneOffset: number = -5): Promise<any> {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const localDate = new Date(utc + (3600000 * timezoneOffset));
    
    const keys = await getApiKeys(env, db);

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
1. **JSON UNIQUEMENT** : Ta réponse doit être un objet JSON valide et RIEN D'AUTRE.
2. **LANGUE** : Détecte la langue de l'audio. Les valeurs 'title' et 'description' DOIVENT être dans la MÊME langue que l'audio.
3. **INTELLIGENCE TECHNIQUE** : Reformule le langage parlé en langage technique professionnel.
4. **PRIORITÉ** : Déduis la priorité (critical/high/medium/low) selon les mots-clés.
5. **DATES** : Convertis les termes relatifs en format ISO 8601 strict basé sur la Date Actuelle.
6. **ASSIGNATION** : Assigne 'machine_id' ou 'assigned_to_id' SEULEMENT si la correspondance est parfaite.

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

    if (keys.deepseek) {
        try {
            const response = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${keys.deepseek}`, 'Content-Type': 'application/json' },
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

    if (keys.openai) {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${keys.openai}`, 'Content-Type': 'application/json' },
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
        } catch (e) {}

        const machinesList = await db.select({
            id: machines.id, type: machines.machine_type, model: machines.model, manufacturer: machines.manufacturer, location: machines.location, status: machines.status
        }).from(machines).all();
        
        // Dynamic Tech List
        const techsList = await db.select({
            id: users.id, name: users.full_name, role: users.role
        }).from(users).where(and(ne(users.role, 'guest'), sql`deleted_at IS NULL`)).all();

        const machinesContext = machinesList.map(m => `ID ${m.id}: ${m.type} ${m.manufacturer || ''} ${m.model || ''} [Loc: ${m.location || '?'}] [Status: ${m.status || 'unknown'}]`).join('\n');
        const techsContext = techsList.map(t => `ID ${t.id}: ${t.name} (${t.role})`).join('\n');

        const vocabularyContext = [...machinesList.map(m => `${m.type} ${m.manufacturer || ''} ${m.model || ''}`), ...techsList.map(t => t.name), "Maintenance", "Panne", "Urgent", "Réparation", aiConfig.custom].join(", ");

        // Pass DB to getApiKeys inside transcribeAudio
        const transcript = await transcribeAudio(audioFile, c.env, db, vocabularyContext);
        if (!transcript) return c.json({ error: "Impossible de transcrire l'audio." }, 502);
        
        try {
            const ticketData = await analyzeText(transcript, { userName, userRole, machines: machinesContext, techs: techsContext }, c.env, db, aiConfig, offset);
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
        
        // --- 1. DYNAMIC CONTEXT & KEYS ---
        const keys = await getApiKeys(c.env, db);
        if (!keys.openai) throw new Error("Clé API OpenAI manquante. Configurez-la dans les paramètres système.");

        // Fetch Base URL
        let baseUrl = "";
        try {
            const baseSetting = await db.select().from(systemSettings).where(eq(systemSettings.setting_key, 'app_base_url')).get();
            if (baseSetting && baseSetting.setting_value) baseUrl = baseSetting.setting_value;
        } catch (e) {}

        const { systemPrompt, ticketVisionMessage } = await buildDynamicContext(db, c.env, {
            userId: userId || undefined,
            userName,
            userRole,
            baseUrl,
            ticketContext,
            message
        });

        // --- 2. VISION INJECTION (Handling R2 -> Base64 here) ---
        let visionMessage = null;
        if (ticketVisionMessage && ticketVisionMessage.file_key) {
            try {
                const object = await c.env.MEDIA_BUCKET.get(ticketVisionMessage.file_key);
                if (object) {
                    const arrayBuffer = await object.arrayBuffer();
                    let binary = '';
                    const bytes = new Uint8Array(arrayBuffer);
                    const len = bytes.byteLength;
                    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
                    const base64Image = btoa(binary);
                    
                    visionMessage = {
                        role: "user",
                        content: [
                            { type: "text", text: "Voici la photo la plus récente attachée à ce ticket. Analyse visuellement ce que tu vois (défauts, pannes, état) pour compléter ton diagnostic." },
                            { type: "image_url", image_url: { url: `data:${ticketVisionMessage.file_type};base64,${base64Image}` } }
                        ]
                    };
                    console.log("[AI] Vision injected for ticket attachment");
                }
            } catch (err) {
                console.warn("[AI] Failed to process vision blob", err);
            }
        }

        // --- 3. CONSTRUCT MESSAGES ---
        const messages: any[] = [
            { role: "system", content: systemPrompt },
            ...history.slice(-6)
        ];

        // Inject vision message if available (BEFORE the user's current question)
        if (visionMessage) {
            messages.push(visionMessage);
        }

        messages.push({ role: "user", content: message });

        let turns = 0;
        let finalReply = "";

        while (turns < 5) {
            turns++;
            // Note: Tool calling is OpenAI specific for now
            const payload: any = { messages, temperature: 0.2, tools: TOOLS, tool_choice: "auto", model: "gpt-4o-mini" };
            
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${keys.openai}`, 'Content-Type': 'application/json' },
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
                            console.log(`[AI] Invoking tool: ${fnName}`);
                            if (['search_tickets', 'get_overdue_tickets'].includes(fnName)) {
                                 // @ts-ignore
                                 toolResult = await ToolFunctions[fnName](db, fnArgs, baseUrl || "https://app.example.com");
                            } else {
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
        if (baseUrl && baseUrl.startsWith('http')) {
            finalReply = finalReply
                .replace(/https?:\/\/(?:www\.)?(?:igpglass\.com|example\.com)/gi, baseUrl);
        }
        
        finalReply = finalReply
            .replace(/\/ticket\/([a-zA-Z0-9-]+)/g, '/?ticket=$1');

        return c.json({ reply: finalReply });

    } catch (e: any) {
        console.error("Chat AI Error:", e);
        return c.json({ error: e.message }, 500);
    }
});

app.get('/test-expert', async (c) => c.text("Test Endpoint Active"));
app.get('/debug-media', async (c) => c.text("Debug Media Endpoint Active"));

export default app;
