
import { Hono } from 'hono';
import { getDb } from '../db';
import { machines, users } from '../db/schema';
import { inArray } from 'drizzle-orm';
import { extractToken, verifyToken } from '../utils/jwt';
import type { Bindings } from '../types';

const app = new Hono<{ Bindings: Bindings }>();

// --- HELPER FUNCTIONS ---

// 1. Audio Transcription (Groq > OpenAI Fallback)
async function transcribeAudio(audioFile: File, env: Bindings): Promise<string | null> {
    
    // --- STRATEGY A: GROQ (Fast & Free-ish) ---
    if (env.GROQ_API_KEY) {
        try {
            console.log("🎤 [AI] Trying Groq Whisper...");
            const formData = new FormData();
            formData.append('file', audioFile);
            formData.append('model', 'whisper-large-v3'); // Groq's super fast model
            formData.append('language', 'fr'); // Force French for consistency
            
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
            formData.append('language', 'fr'); // Force French for OpenAI to help with accent
            formData.append('prompt', "Technicien maintenance industrielle. Accent québécois. Termes: bearing, moteur, hydraulique.");

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
Tu es un assistant expert en maintenance industrielle (MaintenanceOS).
Ta mission : Analyser une demande vocale brute et en extraire les données pour créer un ticket structuré.

CONTEXTE UTILISATEUR (Demandeur):
Nom: ${context.userName}
Rôle: ${context.userRole}
DATE ACTUELLE (EST/Montréal) : ${localDate.toISOString().replace('T', ' ').substring(0, 16)}

CONTEXTE MACHINES :
${context.machines}

CONTEXTE EQUIPE :
${context.techs}

RÈGLES STRICTES :
1. PRIORITÉ : Si tu entends "Urgent", "Prioritaire", "Critique", "Emergency" ou un ton paniqué -> 'priority' = 'critical'.
2. ASSIGNATION : Mappe le nom entendu à un ID de l'équipe.
   - Si tu entends une DATE mais AUCUN NOM -> 'assigned_to_id' = 0 (Équipe).
   - Si tu trouves l'ID -> 'assigned_to_name' = null.
   - Si nom inconnu -> 'assigned_to_name' = "Nom Entendu".
3. DATE : Format ISO 8601 (YYYY-MM-DDTHH:mm:ss). Relative à la DATE ACTUELLE.
4. LANGUE : Si le texte est en Anglais, traduis le Titre et la Description en Français pour le système.

FORMAT JSON ATTENDU :
{
  "title": "Titre court",
  "description": "Description technique",
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
                return JSON.parse(content);
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
                return JSON.parse(data.choices[0].message.content);
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

        // 3. Transcribe (Cascade: Groq -> OpenAI)
        const transcript = await transcribeAudio(audioFile, c.env);
        if (!transcript) {
            return c.json({ error: "Impossible de transcrire l'audio (Services indisponibles)" }, 502);
        }

        // 4. Load Database Context
        const db = getDb(c.env);
        const machinesList = await db.select({
            id: machines.id, name: machines.machine_type, model: machines.model, location: machines.location
        }).from(machines).all();
        
        const techsList = await db.select({
            id: users.id, name: users.full_name, role: users.role
        }).from(users).where(inArray(users.role, ['admin', 'supervisor', 'technician', 'senior_technician', 'team_leader'])).all();

        const machinesContext = machinesList.map(m => `ID ${m.id}: ${m.name} ${m.model || ''} (${m.location || ''})`).join('\n');
        const techsContext = techsList.map(t => `ID ${t.id}: ${t.name} (${t.role})`).join('\n');

        // 5. Analyze (Cascade: DeepSeek -> OpenAI)
        const ticketData = await analyzeText(transcript, {
            userName, userRole, machines: machinesContext, techs: techsContext
        }, c.env);

        // 6. Final Polish
        if (ticketData.scheduled_date && !ticketData.scheduled_date.includes('T')) {
            ticketData.scheduled_date = null; // Safety check
        }

        return c.json(ticketData);

    } catch (e: any) {
        console.error("❌ [AI] Critical Error:", e);
        return c.json({ error: e.message || "Erreur système AI" }, 500);
    }
});

export default app;
