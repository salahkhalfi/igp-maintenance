
import { Hono } from 'hono';
import { getDb } from '../db';
import { machines, users } from '../db/schema';
import { inArray } from 'drizzle-orm';
import { extractToken, verifyToken } from '../utils/jwt';
import type { Bindings } from '../types';

const app = new Hono<{ Bindings: Bindings }>();

// POST /api/ai/analyze-ticket
// Analyse un fichier audio pour pré-remplir un ticket
app.post('/analyze-ticket', async (c) => {
    try {
        const apiKey = c.env.OPENAI_API_KEY;
        if (!apiKey) {
            return c.json({ error: "Configuration manquante : OPENAI_API_KEY" }, 500);
        }

        // 1. Authentification & Identification de l'utilisateur
        const authHeader = c.req.header('Authorization');
        const token = extractToken(authHeader);
        let userRole = 'unknown';
        let userName = 'Utilisateur inconnu';

        if (token) {
            // Utiliser le secret de l'environnement Cloudflare pour la vérification
            const payload = await verifyToken(token, c.env.JWT_SECRET);
            if (payload) {
                userRole = payload.role;
                userName = payload.full_name || payload.email;
                console.log(`👤 [AI] User identified: ${userName} (${userRole})`);
            } else {
                console.warn("⚠️ [AI] Invalid token provided (Verification failed)");
                // DEBUG: Log token snippet
                console.warn("⚠️ Token snippet:", token.substring(0, 10) + "...");
            }
        } else {
            console.warn("⚠️ [AI] No token provided");
        }

        const canAssign = true; // FORCE ENABLE for AI Extraction Debugging
        // const canAssign = ['admin', 'supervisor'].includes(userRole);

        // 2. Récupération du fichier audio
        const formData = await c.req.formData();
        const audioFile = formData.get('file') as File;
        
        if (!audioFile) {
            return c.json({ error: "Aucun fichier audio fourni" }, 400);
        }

        // 2. Transcription (Whisper V3)
        // On utilise la même logique que pour le chat
        const whisperFormData = new FormData();
        whisperFormData.append('file', audioFile, 'voice_ticket.webm');
        whisperFormData.append('model', 'whisper-1');
        whisperFormData.append('language', 'fr');
        whisperFormData.append('prompt', "Technicien de maintenance industrielle. Accent québécois. Création de ticket. Termes : fuite, panne, bearing, moteur, hydraulique, pneumatique. Noms : Laurent, Brahim, Marc, Pierre, Sylvain, Patrick, Martin. Syntaxe : 'C'est pour Laurent', 'Assigné à...', 'Urgent', 'Urgence'.");

        console.log("🎤 [AI] Envoi à Whisper...");
        const transResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}` },
            body: whisperFormData
        });

        if (!transResponse.ok) {
            const err = await transResponse.text();
            console.error("❌ [AI] Whisper Error:", err);
            return c.json({ error: "Erreur transcription" }, 502);
        }

        const transData = await transResponse.json() as any;
        const transcript = transData.text;
        console.log("📝 [AI] Transcription :", transcript);

        if (!transcript || transcript.length < 5) {
            return c.json({ error: "Audio inaudible ou trop court" }, 400);
        }

        // 3. Récupération du contexte (Machines + Techniciens)
        const db = getDb(c.env);
        
        // Machines
        const machinesList = await db.select({
            id: machines.id,
            name: machines.machine_type,
            model: machines.model,
            location: machines.location
        }).from(machines).all();

        // Techniciens (pour assignation)
        const techsList = await db.select({
            id: users.id,
            name: users.full_name,
            role: users.role
        }).from(users).where(inArray(users.role, ['admin', 'supervisor', 'technician', 'senior_technician', 'team_leader'])).all();

        console.log(`👥 [AI] Loaded ${techsList.length} technicians for context matching.`);

        // Contexte formaté
        const machinesContext = machinesList.map(m => 
            `ID ${m.id}: ${m.name} ${m.model || ''} (${m.location || ''})`
        ).join('\n');

        const techsContext = techsList.map(t => 
            `ID ${t.id}: ${t.name} (${t.role})`
        ).join('\n');

        // 5. Extraction Structurée (GPT-4o-mini)
        console.log("🧠 [AI] Analyse GPT-4o-mini...");
        
        // Date locale approximative (Montreal/Est)
        // Note: Cloudflare est en UTC. On recule de 5h pour simuler l'Est.
        const localDate = new Date(new Date().getTime() - (5 * 60 * 60 * 1000));
        
        const systemPrompt = `
Tu es un assistant expert en maintenance industrielle.
Ta mission : Analyser une demande vocale brute et en extraire les données pour créer un ticket.

CONTEXTE UTILISATEUR (Demandeur):
Nom: ${userName}
Rôle: ${userRole}
FUSEAU HORAIRE : America/Montreal (UTC-5). DATE ACTUELLE : ${localDate.toISOString().replace('T', ' ').substring(0, 16)}

CONTEXTE MACHINES DISPONIBLES :
${machinesContext}

CONTEXTE EQUIPE MAINTENANCE :
${techsContext}

RÈGLES STRICTES :
1. PRIORITÉ : Si tu entends "Urgent", "Urgence", "Prioritaire", "Critique" ou un ton paniqué -> CHAMP 'priority' DOIT ÊTRE 'critical'.
2. ASSIGNATION : Tu DOIS mapper le nom entendu à un ID de la liste EQUIPE MAINTENANCE.
   - Exemple : "Pour Laurent" -> Trouve "Laurent" dans la liste -> Extrait ID -> assigne à 'assigned_to_id'.
   - Si tu trouves l'ID, LAISSE 'assigned_to_name' VIDE.
   - Si tu ne trouves PAS l'ID, mets le nom dans 'assigned_to_name'.
3. DATE : Toutes les dates (demain, lundi, etc.) sont relatives à la DATE ACTUELLE ci-dessus.
   - Format de sortie : ISO 8601 (YYYY-MM-DDTHH:mm:ss).

FORMAT DE SORTIE (JSON PUR) :
{
  "title": "Titre court et précis",
  "description": "Description technique du problème (NE PAS inclure 'Assigné à...' ni la date ici)",
  "priority": "low" | "medium" | "high" | "critical",
  "machine_id": number | null,
  "assigned_to_id": number | null,
  "assigned_to_name": "string" | null,
  "scheduled_date": "YYYY-MM-DDTHH:mm:ss" | null
}

IMPORTANT - DERNIER RAPPEL :
- Si "Urgent/Urgence" est mentionné -> "priority": "critical".
- DATE au format ISO 8601 strict.
`;

        const completionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Demande vocale (Date du jour: ${new Date().toISOString()}) : "${transcript}"` }
                ],
                temperature: 0.2,
                response_format: { type: "json_object" }
            })
        });

        if (!completionResponse.ok) {
            console.error("❌ [AI] GPT Error:", await completionResponse.text());
            return c.json({ 
                title: "Demande vocale",
                description: transcript,
                priority: "medium",
                machine_id: null
            });
        }

        const completionData = await completionResponse.json() as any;
        const jsonContent = completionData.choices[0].message.content;
        
        console.log("✨ [AI] Résultat :", jsonContent);
        
        let finalResult = JSON.parse(jsonContent);

        // Security enforcement (double check)
        // DEBUG: Temporarily allowing all assignments to verify AI extraction capability
        // This confirms if the issue is Auth/Role detection vs AI Extraction
        if (!canAssign) {
            console.warn(`⚠️ [AI] User role '${userRole}' is technically not authorized, but PASSING data for debugging.`);
            // if (finalResult.assigned_to_id || finalResult.scheduled_date) {
            //     console.warn("🛡️ [AI] Security: Stripping unauthorized assignment/scheduling");
            //     finalResult.assigned_to_id = null;
            //     finalResult.scheduled_date = null;
            // }
        }

        // Final sanity check on Date format
        if (finalResult.scheduled_date) {
             // Ensure it looks like a date
             if (!finalResult.scheduled_date.includes('T')) {
                 console.log("⚠️ [AI] Invalid date format detected, correcting:", finalResult.scheduled_date);
                 finalResult.scheduled_date = null; 
             }
        }

        return c.json(finalResult);

    } catch (e: any) {
        console.error("❌ [AI] Exception:", e);
        return c.json({ error: e.message }, 500);
    }
});

export default app;
