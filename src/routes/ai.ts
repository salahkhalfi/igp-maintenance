
import { Hono } from 'hono';
import { getDb } from '../db';
import { machines } from '../db/schema';
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

        // 1. Récupération du fichier audio
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
        whisperFormData.append('prompt', "Technicien de maintenance industrielle. Accent québécois. Création de ticket. Termes : fuite, panne, bearing, moteur, hydraulique, pneumatique.");

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

        // 3. Récupération du contexte (Liste des machines)
        // On récupère ID + Nom pour que l'IA puisse faire le lien
        const db = getDb(c.env);
        const machinesList = await db.select({
            id: machines.id,
            name: machines.machine_type,
            model: machines.model,
            location: machines.location
        }).from(machines).all();

        // On formate une liste compacte pour le prompt
        // Ex: "ID 1: Four (Trempe), ID 2: CNC (Intermac)..."
        const machinesContext = machinesList.map(m => 
            `ID ${m.id}: ${m.name} ${m.model || ''} (${m.location || ''})`
        ).join('\n');

        // 4. Extraction Structurée (GPT-4o-mini)
        console.log("🧠 [AI] Analyse GPT-4o-mini...");
        
        const systemPrompt = `
Tu es un assistant expert en maintenance industrielle.
Ta mission : Analyser une demande vocale brute et en extraire les données pour créer un ticket.

CONTEXTE MACHINES DISPONIBLES :
${machinesContext}

INSTRUCTIONS :
1. Analyse le texte transcrit.
2. Identifie la machine concernée. Si incertain ou "Autre", mets null ou 0.
3. Détermine la priorité (low, medium, high, critical). "Urgent" = high, "Dangereux/Arrêt prod" = critical. Par défaut = medium.
4. Génère un Titre court et précis (max 50 chars).
5. Génère une Description complète (corrige les fautes, garde le ton professionnel).

FORMAT DE SORTIE (JSON PUR) :
{
  "title": "string",
  "description": "string",
  "priority": "low" | "medium" | "high" | "critical",
  "machine_id": number | null
}
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
                    { role: "user", content: `Demande vocale : "${transcript}"` }
                ],
                temperature: 0.3, // Faible température pour être factuel
                response_format: { type: "json_object" }
            })
        });

        if (!completionResponse.ok) {
            console.error("❌ [AI] GPT Error:", await completionResponse.text());
            // Fallback : On renvoie au moins la transcription
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
        
        return c.json(JSON.parse(jsonContent));

    } catch (e: any) {
        console.error("❌ [AI] Exception:", e);
        return c.json({ error: e.message }, 500);
    }
});

export default app;
