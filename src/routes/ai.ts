/**
 * L'Expert IGP - AI Routes & Intelligence Module
 * 
 * Copyright © 2025 Salah-Eddine KHALFI. All rights reserved.
 * @author Salah-Eddine KHALFI <salah@khalfi.com>
 * @license PROPRIETARY
 */

import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { getDb } from '../db';
import { machines, users, systemSettings, tickets, media, ticketComments, planningEvents, userPreferences } from '../db/schema';
import { inArray, eq, and, ne, lt, gte, desc, or, sql, not, like, isNull, isNotNull } from 'drizzle-orm';
import { extractToken, verifyToken } from '../utils/jwt';
import type { Bindings } from '../types';
import { z } from 'zod';
import { TOOLS, ToolFunctions } from '../ai/tools';
import { prepareSecretary, detectDocumentType, type DocumentType, type CompanyIdentity } from '../ai/secretary';

// ===== SECRETARY AI MODEL CONFIG =====
// ROLLBACK: Change to 'openai' if issues
const SECRETARY_AI_PROVIDER: 'deepseek' | 'openai' = 'deepseek';

const AI_CONFIGS = {
    deepseek: {
        url: 'https://api.deepseek.com/v1/chat/completions',
        model: 'deepseek-chat',
        keyEnv: 'DEEPSEEK_API_KEY' as const
    },
    openai: {
        url: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4o',
        keyEnv: 'OPENAI_API_KEY' as const
    }
};

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

// --- DOCUMENT GENERATION: PROMPTS EXPERTS PAR DÉFAUT ---
const DEFAULT_DOCUMENT_PROMPTS: Record<string, { prompt: string; temperature: number; triggers: string[] }> = {
    reports: {
        temperature: 0.3,
        triggers: ['rapport', 'report', 'bilan', 'synthèse', 'analyse', 'kpi', 'statistiques', 'mensuel', 'hebdomadaire', 'journalier'],
        prompt: `# RÔLE : Analyste Exécutif Senior - Rapports de Direction

Tu génères des rapports professionnels de qualité institutionnelle pour la direction.

## STRUCTURE OBLIGATOIRE

1. **SYNTHÈSE EXÉCUTIVE** (3-5 lignes max)
   - Message clé en première phrase
   - Chiffre le plus important mis en évidence
   - Recommandation principale

2. **INDICATEURS CLÉS** (tableau ou liste structurée)
   - Comparer à la période précédente si disponible
   - Mettre en évidence les écarts significatifs (>10%)
   - Format: Indicateur | Valeur | Tendance

3. **ANALYSE DÉTAILLÉE** (puces concises)
   - Faits observés uniquement (pas d'interprétation sans données)
   - Causes identifiées ou hypothèses explicites
   - Impact opérationnel quantifié

4. **RECOMMANDATIONS** (max 5, actionnables)
   - Format: Action + Responsable suggéré + Échéance proposée
   - Priorisées par impact/urgence

## RÈGLES DE STYLE
- Phrases courtes (max 20 mots)
- Voix active, jamais de conditionnel vague
- Chiffres exacts, pas d'approximations ("plusieurs" → "7")
- Tableaux markdown pour données comparatives
- **Gras** pour les points critiques

## TRADUCTIONS OBLIGATOIRES
- CRITICAL → CRITIQUE | HIGH → HAUTE | MEDIUM → MOYENNE | LOW → BASSE
- waiting_parts → En attente pièces | in_progress → En cours
- completed → Terminé | operational → Opérationnel
- out_of_service → Hors service | maintenance → En maintenance
- MTTR → TMR (Temps Moyen de Réparation)
- KPI → ICP (Indicateur Clé de Performance)

## ANTI-PATTERNS (INTERDIT)
❌ "Il serait souhaitable de..." → ✅ "Recommandation : [Action] avant le [Date]"
❌ Introduction "Voici le rapport..." → ✅ Commencer directement par le contenu
❌ Paragraphes > 4 lignes
❌ Inventer des données non fournies`
    },
    
    correspondence: {
        temperature: 0.3,
        triggers: ['lettre', 'correspondance', 'courrier', 'réponse', 'partenariat', 'remerciement', 'invitation'],
        prompt: `# RÔLE : Secrétaire de Direction Exécutive - Correspondance Officielle

Tu rédiges la correspondance officielle avec un niveau de professionnalisme institutionnel québécois.

## RÈGLES CRITIQUES
1. **JAMAIS de placeholders** - Remplace TOUT par du contenu réel
2. Utilise les données de l'entreprise fournies dans le contexte
3. Date du jour: utilise la date actuelle en format "Montréal, le [jour] [mois] [année]"
4. Si le nom du signataire n'est pas précisé, utilise "La Direction"

## FORMAT LETTRE STANDARD

**[Nom de l'entreprise du contexte]**
[Adresse de l'entreprise si connue, sinon omettre]

Montréal, le [DATE DU JOUR EN FRANÇAIS]

[Civilité Prénom Nom du destinataire]
[Fonction]
[Organisation]
[Adresse]

**Objet :** [Résumé précis en une ligne]

[Formule d'appel appropriée],

[Paragraphe 1: contexte ou référence]

[Paragraphe 2: message principal / proposition / demande]

[Paragraphe 3: conclusion / action attendue]

[Formule de politesse],


[Nom du signataire]
[Titre]

## FORMULES PAR DESTINATAIRE

| Destinataire | Appel | Clôture |
|--------------|-------|---------|
| Ministre/Haut fonctionnaire | Madame la Ministre, / Monsieur le Ministre, | Veuillez agréer l'expression de ma haute considération |
| Directeur/Cadre | Madame la Directrice, / Monsieur le Directeur, | Veuillez recevoir mes salutations distinguées |
| Partenaire commercial | Madame, / Monsieur, | Cordialement |
| Fournisseur | Madame, / Monsieur, | Meilleures salutations |

## RÈGLES DE STYLE
- Vouvoiement obligatoire
- Aucun anglicisme
- Maximum 4 phrases par paragraphe
- Pas de liste à puces dans le corps
- Ton formel et professionnel`
    },
    
    grants: {
        temperature: 0.2,
        triggers: ['subvention', 'financement', 'pari', 'cnrc', 'rsde', 'investissement québec', 'emploi-québec', 'écoleader', 'crédit d\'impôt', 'programme'],
        prompt: `# RÔLE : Expert en Financement Gouvernemental - Demandes de Subventions

Tu es spécialiste des programmes de subventions canadiens et québécois pour le secteur manufacturier.

## PROGRAMMES CONNUS

### Fédéral
- **PARI-CNRC** : PME innovantes, jusqu'à 80% coûts, via Conseiller en technologie industrielle
- **RS&DE** : Crédit d'impôt 35% (SPCC), documentation contemporaine OBLIGATOIRE
- **FSI** : Projets >10M$, contributions remboursables
- **Travail partagé** : Éviter mises à pied, 6-76 semaines

### Québec
- **ESSOR (Investissement Québec)** : Prêt/garantie jusqu'à 50%
- **PIVOT** : Transformation numérique, IA, automatisation
- **MFOR (Emploi-Québec)** : Formation, jusqu'à 50% des coûts
- **Fonds Écoleader** : Projets durables, max 100k$
- **Crédit R&D Québec** : 14-30% selon taille entreprise

## STRUCTURE DEMANDE TYPE

### 1. PRÉSENTATION DE L'ENTREPRISE (½ page)
- Historique, date de fondation, évolution
- Effectif actuel, chiffre d'affaires
- Forces distinctives, avantages compétitifs
- Certifications (ISO, etc.)

### 2. DESCRIPTION DU PROJET (1 page)
- Problématique / Opportunité de marché
- Solution proposée et caractère innovant
- Différenciation vs état de l'art
- Objectifs SMART

### 3. RETOMBÉES ATTENDUES (argumentaire ROI)
- Emplois créés/maintenus (nombre, types)
- Investissements privés générés
- Bénéfices environnementaux/sociaux
- Impact sur la compétitivité

### 4. BUDGET DÉTAILLÉ (tableau)
| Poste | Montant | Admissible | Source |
|-------|---------|------------|--------|
| Salaires R&D | X $ | Oui | Subvention |
| Équipements | X $ | Partiel | Privé + Sub |
| ... | ... | ... | ... |

### 5. CALENDRIER (jalons)
- Phase 1: [Description] - [Date]
- Phase 2: [Description] - [Date]
- Livraison finale: [Date]

## RÈGLES
- Valoriser les données opérationnelles réelles de l'entreprise
- Ne JAMAIS inventer de chiffres - indiquer "[À compléter]" si manquant
- Mentionner certifications et normes si pertinent
- Langage aligné avec les critères d'évaluation du programme
- Quantifier les retombées autant que possible`
    },
    
    technical: {
        temperature: 0.1,
        triggers: ['procédure', 'manuel', 'fiche', 'sécurité', 'technique', 'spécification', 'checklist', 'protocole', 'mode opératoire'],
        prompt: `# RÔLE : Ingénieur Documentaliste Senior - Documents Techniques

Tu rédiges des documents techniques conformes aux standards industriels québécois/canadiens.

## NORMES APPLICABLES

### Sécurité (CNESST / CSA)
- Cadenassage: CSA Z460
- EPI: CSA Z94.1 (Casques), Z94.3 (Lunettes), Z195 (Chaussures)
- SIMDUT 2015: Fiches de données de sécurité (16 sections)

### Qualité
- ISO 9001: Management qualité
- ISO 14001: Management environnemental
- ISO 45001: Santé et sécurité au travail

### Électricité/Mécanique
- CSA C22.1: Code électrique canadien
- ASME: Chaudières et appareils sous pression

## TYPES DE DOCUMENTS

### Procédure Opérationnelle Standard (POS)
1. **Objectif et portée**
2. **Documents de référence**
3. **Responsabilités** (qui fait quoi)
4. **Équipements/matériaux requis**
5. **Mesures de sécurité** (EPI, cadenassage)
6. **Étapes détaillées** (numérotées, une action par point)
7. **Critères de conformité** (comment vérifier)
8. **Actions correctives** (si non-conformité)
9. **Enregistrements** (formulaires à remplir)

### Fiche de Sécurité (selon SIMDUT 2015)
- 16 sections obligatoires
- Pictogrammes SGH appropriés
- Phrases H (Hazard) et P (Precaution)

### Spécification Technique
- Exigences fonctionnelles
- Exigences de performance (mesurables)
- Conditions d'essai
- Critères d'acceptation/rejet

## RÈGLES DE RÉDACTION
- Verbes d'action à l'IMPÉRATIF (Vérifier, Appliquer, Contrôler)
- ⚠️ DANGER / ⚠️ ATTENTION en début de section si risque
- Unités SI avec équivalents impériaux entre parenthèses si pertinent
- Numérotation hiérarchique (1, 1.1, 1.1.1)
- Tableaux pour paramètres et tolérances
- Schémas décrits textuellement si impossibles à afficher`
    },
    
    creative: {
        temperature: 0.5,
        triggers: ['brochure', 'site web', 'communiqué', 'presse', 'discours', 'présentation', 'pitch', 'marketing', 'promotion'],
        prompt: `# RÔLE : Directeur de Communication - Documents Créatifs

Tu crées des contenus de communication valorisant l'entreprise et ses activités.

## TYPES DE CONTENUS

### Texte Site Web / Page À Propos
- Accroche percutante (première phrase mémorable)
- Histoire de l'entreprise (storytelling)
- Valeurs et mission
- Chiffres clés mis en avant
- Appel à l'action clair

### Communiqué de Presse
- Titre accrocheur (< 10 mots)
- Chapeau (qui, quoi, quand, où, pourquoi - 2 phrases)
- Corps (contexte, détails, citations)
- À propos de [Entreprise] (boilerplate)
- Contact presse

### Discours / Allocution
- Ouverture captivante (anecdote, question, statistique choc)
- 3 points clés maximum (règle de 3)
- Exemples concrets et histoires
- Conclusion mémorable avec appel à l'action

### Pitch Commercial
- Hook (problème client en 1 phrase)
- Solution (notre offre en 2-3 phrases)
- Preuves (chiffres, témoignages, certifications)
- Différenciateurs (pourquoi nous vs concurrence)
- Call-to-action

## RÈGLES CRÉATIVES
- Adapter le ton au public cible
- Valoriser sans exagérer (crédibilité)
- Utiliser les données réelles de l'entreprise
- Phrases courtes et rythmées
- Éviter le jargon sauf si public technique`
    }
};

// --- DOCUMENT GENERATION: DÉTECTION D'INTENTION ---
type DocumentIntent = {
    isDocument: boolean;
    type: 'reports' | 'correspondence' | 'grants' | 'technical' | 'creative' | 'conversation';
    confidence: number;
    needsData: string[];
};

function detectDocumentIntent(message: string): DocumentIntent {
    const lowerMessage = message.toLowerCase();
    
    // Patterns qui indiquent clairement une demande de document
    const documentPatterns = [
        /(?:rédige|écris|prépare|génère|crée|fais|produis)[\s-]*(moi\s+)?(?:un|une|le|la|des)/i,
        /(?:j'ai besoin|il me faut|peux-tu faire|pourrais-tu)/i,
        /(?:pour (?:la réunion|le ca|demain|lundi|la direction|mon boss|le patron))/i,
        /document|rapport|lettre|note de service|procédure|demande de/i
    ];
    
    const isLikelyDocument = documentPatterns.some(p => p.test(message));
    
    if (!isLikelyDocument) {
        return { isDocument: false, type: 'conversation', confidence: 0.9, needsData: [] };
    }
    
    // Détecter le type spécifique
    for (const [type, config] of Object.entries(DEFAULT_DOCUMENT_PROMPTS)) {
        const matchCount = config.triggers.filter(t => lowerMessage.includes(t)).length;
        if (matchCount > 0) {
            // Déterminer les données nécessaires selon le type
            let needsData: string[] = ['company'];
            if (type === 'reports') needsData = ['company', 'tickets', 'machines', 'users', 'kpis'];
            if (type === 'grants') needsData = ['company', 'machines', 'users', 'operational'];
            if (type === 'technical') needsData = ['company', 'machines'];
            
            return {
                isDocument: true,
                type: type as DocumentIntent['type'],
                confidence: Math.min(0.5 + (matchCount * 0.2), 0.95),
                needsData
            };
        }
    }
    
    // Document générique détecté mais type non identifié → créatif par défaut
    return { isDocument: true, type: 'creative', confidence: 0.6, needsData: ['company'] };
}

// --- DOCUMENT GENERATION: COLLECTE DE DONNÉES ENRICHIES ---
async function collectDocumentData(db: any, env: any, needsData: string[], period?: { start: string; end: string }) {
    const data: Record<string, any> = {};
    
    // Période par défaut: ce mois
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0];
    const startDate = period?.start || defaultStart;
    const endDate = period?.end || defaultEnd;
    
    // Company info
    if (needsData.includes('company')) {
        try {
            const companySettings = await db.select().from(systemSettings)
                .where(inArray(systemSettings.setting_key, ['company_title', 'company_short_name', 'company_subtitle']))
                .all();
            data.company = {};
            companySettings.forEach((s: any) => {
                if (s.setting_key === 'company_title') data.company.name = s.setting_value;
                if (s.setting_key === 'company_short_name') data.company.shortName = s.setting_value;
                if (s.setting_key === 'company_subtitle') data.company.description = s.setting_value;
            });
        } catch (e) { console.warn('[AI] Failed to load company data'); }
    }
    
    // Tickets avec stats
    if (needsData.includes('tickets') || needsData.includes('kpis')) {
        try {
            const { statusMap, priorityMap, closedStatuses } = await getTicketMaps(db);
            
            // Tickets créés dans la période
            const ticketsCreated = await db.select({
                id: tickets.id,
                ticket_id: tickets.ticket_id,
                title: tickets.title,
                status: tickets.status,
                priority: tickets.priority,
                created_at: tickets.created_at,
                completed_at: tickets.completed_at,
                machine_id: tickets.machine_id,
                assigned_to: tickets.assigned_to
            }).from(tickets)
            .where(and(
                sql`date(${tickets.created_at}) >= ${startDate}`,
                sql`date(${tickets.created_at}) < ${endDate}`
            )).all();
            
            // Tickets terminés dans la période
            const ticketsCompleted = await db.select({
                id: tickets.id,
                created_at: tickets.created_at,
                completed_at: tickets.completed_at
            }).from(tickets)
            .where(and(
                sql`date(${tickets.completed_at}) >= ${startDate}`,
                sql`date(${tickets.completed_at}) < ${endDate}`
            )).all();
            
            // Tickets actifs
            const activeTickets = await db.select({
                id: tickets.id,
                ticket_id: tickets.ticket_id,
                title: tickets.title,
                status: tickets.status,
                priority: tickets.priority,
                assigned_to: tickets.assigned_to
            }).from(tickets)
            .where(and(
                not(inArray(tickets.status, closedStatuses)),
                sql`deleted_at IS NULL`
            )).all();
            
            // Calcul TMR (Temps Moyen de Réparation)
            let avgResolutionHours = 0;
            if (ticketsCompleted.length > 0) {
                const totalMs = ticketsCompleted.reduce((acc: number, t: any) => {
                    if (t.completed_at && t.created_at) {
                        return acc + (new Date(t.completed_at).getTime() - new Date(t.created_at).getTime());
                    }
                    return acc;
                }, 0);
                avgResolutionHours = totalMs / ticketsCompleted.length / (1000 * 60 * 60);
            }
            
            data.tickets = {
                period: { start: startDate, end: endDate },
                created: ticketsCreated.length,
                completed: ticketsCompleted.length,
                active: activeTickets.length,
                critical: ticketsCreated.filter((t: any) => t.priority === 'critical' || t.priority === 'high').length,
                tmr: avgResolutionHours.toFixed(1),
                byPriority: {
                    critical: ticketsCreated.filter((t: any) => t.priority === 'critical').length,
                    high: ticketsCreated.filter((t: any) => t.priority === 'high').length,
                    medium: ticketsCreated.filter((t: any) => t.priority === 'medium').length,
                    low: ticketsCreated.filter((t: any) => t.priority === 'low').length
                },
                activeList: activeTickets.slice(0, 10).map((t: any) => ({
                    ref: t.ticket_id,
                    title: t.title,
                    status: statusMap[t.status] || t.status,
                    priority: priorityMap[t.priority] || t.priority
                }))
            };
        } catch (e) { console.warn('[AI] Failed to load tickets data', e); }
    }
    
    // Machines
    if (needsData.includes('machines') || needsData.includes('operational')) {
        try {
            const machinesList = await db.select().from(machines).where(sql`deleted_at IS NULL`).all();
            const machinesDown = machinesList.filter((m: any) => m.status === 'out_of_service' || m.status === 'maintenance');
            
            // Grouper par type
            const byType: Record<string, any[]> = {};
            machinesList.forEach((m: any) => {
                const type = m.machine_type || 'Autre';
                if (!byType[type]) byType[type] = [];
                byType[type].push(m);
            });
            
            data.machines = {
                total: machinesList.length,
                operational: machinesList.filter((m: any) => m.status === 'operational').length,
                down: machinesDown.length,
                byType: Object.entries(byType).map(([type, items]) => ({
                    type,
                    count: items.length,
                    samples: items.slice(0, 3).map((m: any) => `${m.manufacturer || ''} ${m.model || ''}`.trim()).filter(Boolean)
                })),
                downList: machinesDown.map((m: any) => ({
                    name: `${m.machine_type} ${m.model || ''}`.trim(),
                    location: m.location,
                    status: m.status
                }))
            };
        } catch (e) { console.warn('[AI] Failed to load machines data', e); }
    }
    
    // Users/Équipe
    if (needsData.includes('users') || needsData.includes('operational')) {
        try {
            const usersList = await db.select({
                id: users.id,
                full_name: users.full_name,
                role: users.role
            }).from(users).where(sql`deleted_at IS NULL`).all();
            
            // Compter par rôle
            const byRole: Record<string, number> = {};
            const roleLabels: Record<string, string> = {
                'admin': 'Administrateur',
                'supervisor': 'Superviseur',
                'technician': 'Technicien',
                'senior_technician': 'Technicien Senior',
                'operator': 'Opérateur',
                'furnace_operator': 'Opérateur Fournaise'
            };
            
            usersList.forEach((u: any) => {
                const label = roleLabels[u.role] || u.role;
                byRole[label] = (byRole[label] || 0) + 1;
            });
            
            data.users = {
                total: usersList.length,
                byRole
            };
        } catch (e) { console.warn('[AI] Failed to load users data', e); }
    }
    
    return data;
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
        'ai_whisper_context',
        'ai_document_prompts'
    ];
    
    const settings = await db.select().from(systemSettings).where(inArray(systemSettings.setting_key, keys)).all();
    
    const config: Record<string, string> = {};
    settings.forEach((s: any) => config[s.setting_key] = s.setting_value);

    // Parse document prompts JSON or use defaults
    let documentPrompts = DEFAULT_DOCUMENT_PROMPTS;
    if (config['ai_document_prompts']) {
        try {
            documentPrompts = { ...DEFAULT_DOCUMENT_PROMPTS, ...JSON.parse(config['ai_document_prompts']) };
        } catch (e) {
            console.warn('[AI] Failed to parse ai_document_prompts, using defaults');
        }
    }

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
        whisperContext: config['ai_whisper_context'] || "Context: Industrial maintenance. Languages: English or French (including Quebec dialect).",
        documentPrompts
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
            technical_specs: machines.technical_specs, operator_id: machines.operator_id, ai_context: machines.ai_context
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
            // Trouver le nom de l'opérateur si assigné
            const operatorInfo = m.operator_id ? techsList.find(t => t.id === m.operator_id) : null;
            const operatorStr = operatorInfo ? ` [Opérateur: ${operatorInfo.name}]` : '';
            // Contexte IA spécifique à la machine
            const aiCtx = m.ai_context ? ` [INFO: ${m.ai_context.substring(0, 150)}]` : '';
            return `ID ${m.id}: ${m.type} ${details} [Loc: ${m.location || '?'}] [Status: ${m.status || 'unknown'}]${operatorStr}${specs}${aiCtx}`;
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
        const { message, ticketContext, history, documentMode } = body;

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
        
        // --- DOCUMENT GENERATION: Détection d'intention ---
        // RESTRICTION: Mode document réservé aux admin et supervisor
        const canGenerateDocuments = ['admin', 'supervisor'].includes(userRole);
        const documentIntent = detectDocumentIntent(message);
        const isDocumentRequest = canGenerateDocuments && (documentMode === true || (documentIntent.isDocument && documentIntent.confidence > 0.6));
        let documentData: Record<string, any> = {};
        let documentPromptBlock = "";
        
        if (isDocumentRequest && documentIntent.type !== 'conversation') {
            console.log(`📄 [AI] Document request detected: ${documentIntent.type} (confidence: ${documentIntent.confidence}) - User: ${userName} (${userRole})`);
            
            // Collecter les données enrichies pour le document
            documentData = await collectDocumentData(db, c.env, documentIntent.needsData);
            
            // Récupérer le prompt expert approprié
            const expertConfig = aiConfig.documentPrompts[documentIntent.type];
            if (expertConfig) {
                documentPromptBlock = `

--- 📄 MODE DOCUMENT ACTIVÉ ---
TYPE: ${documentIntent.type.toUpperCase()}
${expertConfig.prompt}

## DONNÉES OPÉRATIONNELLES INJECTÉES
${documentIntent.needsData.includes('company') && documentData.company ? `
### Entreprise
- Nom: ${documentData.company.name || '[Non configuré]'}
- Abréviation: ${documentData.company.shortName || ''}
- Description: ${documentData.company.description || ''}
` : ''}
${documentIntent.needsData.includes('tickets') && documentData.tickets ? `
### Tickets (Période: ${documentData.tickets.period?.start} → ${documentData.tickets.period?.end})
- Créés: ${documentData.tickets.created}
- Terminés: ${documentData.tickets.completed}
- Actifs: ${documentData.tickets.active}
- Critiques/Hauts: ${documentData.tickets.critical}
- TMR: ${documentData.tickets.tmr}h
- Par priorité: Critique(${documentData.tickets.byPriority?.critical}) | Haute(${documentData.tickets.byPriority?.high}) | Moyenne(${documentData.tickets.byPriority?.medium}) | Basse(${documentData.tickets.byPriority?.low})
${documentData.tickets.activeList?.length > 0 ? `\nTickets actifs:\n${documentData.tickets.activeList.map((t: any) => `- [${t.priority}] ${t.ref}: ${t.title} (${t.status})`).join('\n')}` : ''}
` : ''}
${documentIntent.needsData.includes('machines') && documentData.machines ? `
### Parc Machines
- Total: ${documentData.machines.total}
- Opérationnelles: ${documentData.machines.operational}
- Hors service/Maintenance: ${documentData.machines.down}
${documentData.machines.byType?.map((t: any) => `- ${t.type}: ${t.count} unités${t.samples.length > 0 ? ` (${t.samples.join(', ')})` : ''}`).join('\n') || ''}
${documentData.machines.downList?.length > 0 ? `\nMachines arrêtées:\n${documentData.machines.downList.map((m: any) => `- ${m.name} [${m.location}] - ${m.status}`).join('\n')}` : ''}
` : ''}
${documentIntent.needsData.includes('users') && documentData.users ? `
### Effectif
- Total: ${documentData.users.total} employés
${Object.entries(documentData.users.byRole || {}).map(([role, count]) => `- ${role}: ${count}`).join('\n')}
` : ''}

## INSTRUCTIONS SPÉCIALES DOCUMENT
1. Commence DIRECTEMENT par le contenu du document (pas de "Voici le document...")
2. Utilise le format Markdown avec **gras**, listes, tableaux
3. Ne mentionne PAS que tu es une IA ou que c'est généré automatiquement
4. Le document doit être PRÊT À L'EMPLOI (copier-coller ou impression)
5. À la fin, ajoute sur une nouvelle ligne: <!-- DOCUMENT_TYPE:${documentIntent.type} -->
`;
            }
        }

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
                    // Lien cliquable vers le ticket
                    const ticketLink = baseUrl ? `[${t.display_id}](${baseUrl}/?ticket=${t.id})` : `[${t.display_id}]`;
                    currentStatus.push(`[TICKET ${ticketLink}] (${statusFr}, ${priorityFr}): ${t.title}${mediaStr}${commStr}`);
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

                // --- ENRICHISSEMENT DU CONTEXTE (Données Techniques + Opérateur + Contexte IA) ---
                const specs = m.technical_specs ? `\n   [SPECS]: ${m.technical_specs.replace(/\n/g, ' ')}` : '';
                // Trouver l'opérateur assigné à cette machine
                const operatorInfo = (m as any).operator_id ? usersList.find(u => u.id === (m as any).operator_id) : null;
                const operatorStr = operatorInfo ? `\n   [OPÉRATEUR]: ${operatorInfo.name}` : '';
                // Contexte IA spécifique à cette machine (historique, particularités)
                const machineAiCtx = (m as any).ai_context ? `\n   [CONTEXTE MACHINE]: ${(m as any).ai_context.replace(/\n/g, ' ')}` : '';
                const details = [
                    m.manufacturer ? `Fab: ${m.manufacturer}` : null,
                    m.year ? `Année: ${m.year}` : null,
                    m.serial_number ? `S/N: ${m.serial_number}` : null,
                    m.location ? `Loc: ${m.location}` : null
                ].filter(Boolean).join(' | ');

                return `[ID:${m.id}] ${m.machine_type} ${m.model || ''}\n   [DETAILS]: ${details} - ÉTAT: ${state} ${activeIssues ? `(Tickets: ${activeIssues.join(', ')})` : '(RAS)'}${operatorStr}${specs}${machineAiCtx}`;
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
                        const ticketLink = baseUrl ? `[${h.display_id}](${baseUrl}/?ticket=${h.id})` : `#${h.id}`;
                        return `- [${h.date}] Ticket ${ticketLink} (${statusMap[h.status] || h.status}): ${h.title} sur ${m ? m.type : '?'}`;
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
${documentPromptBlock}

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
1. **EXPERTISE TECHNIQUE PRIORITAIRE** : Pour toute question liée à la maintenance, aux machines, aux tickets ou aux opérations → utilise ton expertise technique complète. Sois précis, proactif, et utilise les outils disponibles.
2. **SOURCE DE VÉRITÉ** : Utilise les outils (search_tickets, check_machine) pour vérifier les faits non présents dans le contexte.
3. **INTÉGRITÉ** : N'invente jamais de données opérationnelles. Si un outil retourne "null", dis "inconnu".
4. **FLEXIBILITÉ CRÉATIVE** : Pour les demandes NON liées à la maintenance (rédaction, conseils généraux, documents, questions diverses) → tu peux répondre librement en utilisant tes connaissances générales et l'identité de l'entreprise. Tu n'es pas limité aux données de maintenance.

--- 3. RÈGLES TECHNIQUES & FORMATAGE (OBLIGATOIRES) ---

A. **LIENS TICKETS (RÈGLE ABSOLUE)** :
   Les outils retournent "ticket_link" pour CHAQUE ticket. COPIE-LE TEL QUEL.
   
   ⚠️ CHAQUE ticket a son PROPRE lien avec son PROPRE id - ne réutilise JAMAIS le même lien !
   
   Si ticket_link n'est pas fourni, construis: [display_id](${baseUrl}/?ticket={id})
   où {id} = la valeur du champ "id" de CE ticket spécifique.

B. **IMAGES & MÉDIAS** :
   Si le contexte contient une image (format ![Alt](URL)), tu DOIS l'afficher dans ta réponse.

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
            // Ajuster la température selon le type de document (plus basse = plus déterministe)
            let temperature = 0.2;
            if (isDocumentRequest && documentIntent.type !== 'conversation') {
                const expertConfig = aiConfig.documentPrompts[documentIntent.type];
                temperature = expertConfig?.temperature ?? 0.3;
            }
            const payload: any = { messages, temperature, tools: TOOLS, tool_choice: "auto", model: "gpt-4o-mini" };
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

        // --- DOCUMENT GENERATION: Détecter si la réponse est un document ---
        let detectedDocType: string | null = null;
        const docTypeMatch = finalReply.match(/<!-- DOCUMENT_TYPE:(\w+) -->/);
        if (docTypeMatch) {
            detectedDocType = docTypeMatch[1];
            // Retirer le marqueur du contenu visible
            finalReply = finalReply.replace(/<!-- DOCUMENT_TYPE:\w+ -->/g, '').trim();
        }

        // Construire la réponse enrichie
        const response: any = { reply: finalReply };
        
        if (isDocumentRequest && detectedDocType) {
            response.isDocument = true;
            response.documentType = detectedDocType;
            response.documentTitle = documentIntent.type === 'reports' ? 'Rapport' :
                                     documentIntent.type === 'correspondence' ? 'Correspondance' :
                                     documentIntent.type === 'grants' ? 'Demande de subvention' :
                                     documentIntent.type === 'technical' ? 'Document technique' :
                                     'Document';
        }

        return c.json(response);

    } catch (e: any) {
        console.error("Chat AI Error:", e);
        return c.json({ error: e.message }, 500);
    }
});

app.get('/test-expert', async (c) => c.text("Test Endpoint Active"));
app.get('/debug-media', async (c) => c.text("Debug Media Endpoint Active"));

// ============================================================
// POST /api/ai/report - Direction Report Generator (ISOLATED)
// Model: DeepSeek-Chat (PRIMARY) + GPT-4o-mini (FALLBACK)
// Configurable via system_settings.ai_report_prompt
// ============================================================
app.post('/report', async (c) => {
    try {
        const authHeader = c.req.header('Authorization');
        let token = authHeader?.replace('Bearer ', '') || getCookie(c, 'auth_token');
        if (!token) return c.json({ error: 'Non autorisé' }, 401);
        
        // Utiliser le même secret que le middleware (fallback interne)
        const payload = await verifyToken(token);
        if (!payload) return c.json({ error: 'Token invalide' }, 401);
        
        const env = c.env as Bindings;
        const db = getDb(env);
        
        // Parse request body
        const body = await c.req.json();
        const { period, startDate, endDate, reportType = 'summary', customInstructions } = body;
        // period: 'day' | 'week' | 'month'
        // startDate, endDate: ISO date strings (optional, calculated from period if not provided)
        // reportType: 'summary' | 'detailed'
        // customInstructions: string (optional) - Focus spécifique demandé par l'utilisateur
        
        // Calculate date range
        const now = new Date();
        let dateStart: Date, dateEnd: Date;
        
        if (startDate && endDate) {
            dateStart = new Date(startDate);
            dateEnd = new Date(endDate);
        } else if (period === 'day') {
            dateStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            dateEnd = new Date(dateStart);
            dateEnd.setDate(dateEnd.getDate() + 1);
        } else if (period === 'week') {
            const dayOfWeek = now.getDay();
            const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            dateStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
            dateEnd = new Date(dateStart);
            dateEnd.setDate(dateEnd.getDate() + 7);
        } else { // month
            dateStart = new Date(now.getFullYear(), now.getMonth(), 1);
            dateEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        }
        
        const startISO = dateStart.toISOString().split('T')[0];
        const endISO = dateEnd.toISOString().split('T')[0];
        
        // ===== LOAD AI CONFIG & COMPANY IDENTITY =====
        const aiConfig = await getAiConfig(db);
        
        let companyName = '';
        let companyShortName = '';
        try {
            const companySettings = await db.select().from(systemSettings)
                .where(inArray(systemSettings.setting_key, ['company_title', 'company_short_name']))
                .all();
            companySettings.forEach((s: any) => {
                if (s.setting_key === 'company_title') companyName = s.setting_value;
                if (s.setting_key === 'company_short_name') companyShortName = s.setting_value;
            });
        } catch (e) { /* fallback to empty */ }
        
        // ===== FETCH ALL DATA FOR THE PERIOD =====
        
        // 1. Tickets created in period
        const ticketsCreated = await db.select({
            id: tickets.id,
            ticket_id: tickets.ticket_id,
            title: tickets.title,
            status: tickets.status,
            priority: tickets.priority,
            created_at: tickets.created_at,
            completed_at: tickets.completed_at,
            machine_id: tickets.machine_id
        }).from(tickets)
        .where(and(
            sql`date(${tickets.created_at}) >= ${startISO}`,
            sql`date(${tickets.created_at}) < ${endISO}`
        )).all();
        
        // 2. Tickets completed in period
        const ticketsCompleted = await db.select({
            id: tickets.id,
            ticket_id: tickets.ticket_id,
            title: tickets.title,
            priority: tickets.priority,
            created_at: tickets.created_at,
            completed_at: tickets.completed_at
        }).from(tickets)
        .where(and(
            sql`date(${tickets.completed_at}) >= ${startISO}`,
            sql`date(${tickets.completed_at}) < ${endISO}`
        )).all();
        
        // 3. Active tickets (open/in progress)
        const activeTickets = await db.select({
            id: tickets.id,
            ticket_id: tickets.ticket_id,
            title: tickets.title,
            status: tickets.status,
            priority: tickets.priority,
            assigned_to: tickets.assigned_to,
            created_at: tickets.created_at
        }).from(tickets)
        .where(and(
            not(inArray(tickets.status, ['completed', 'archived', 'closed', 'resolved'])),
            sql`deleted_at IS NULL`
        )).all();
        
        // 4. Planning events in period
        const events = await db.select().from(planningEvents)
        .where(and(
            sql`date(${planningEvents.date}) >= ${startISO}`,
            sql`date(${planningEvents.date}) < ${endISO}`,
            sql`deleted_at IS NULL`
        )).all();
        
        // 5. Machine statistics
        const machineStats = await db.select({
            id: machines.id,
            machine_type: machines.machine_type,
            status: machines.status,
            location: machines.location
        }).from(machines).all();
        
        // 6. User/technician workload
        const technicianWorkload = await db.select({
            user_id: tickets.assigned_to,
            count: sql<number>`COUNT(*)`
        }).from(tickets)
        .where(and(
            not(inArray(tickets.status, ['completed', 'archived', 'closed', 'resolved'])),
            sql`deleted_at IS NULL`,
            sql`assigned_to IS NOT NULL`
        ))
        .groupBy(tickets.assigned_to)
        .all();
        
        // 7. Get user names for technicians
        const userList = await db.select({
            id: users.id,
            full_name: users.full_name,
            role: users.role
        }).from(users).all();
        
        const userMap = Object.fromEntries(userList.map(u => [u.id, u.full_name]));
        
        // ===== CALCULATE KPIs =====
        const criticalTickets = ticketsCreated.filter(t => t.priority === 'critical' || t.priority === 'high');
        const avgResolutionTime = ticketsCompleted.length > 0 
            ? ticketsCompleted.reduce((acc, t) => {
                if (t.completed_at && t.created_at) {
                    const created = new Date(t.created_at).getTime();
                    const completed = new Date(t.completed_at).getTime();
                    return acc + (completed - created);
                }
                return acc;
            }, 0) / ticketsCompleted.length / (1000 * 60 * 60) // hours
            : 0;
        
        const machinesDown = machineStats.filter(m => m.status === 'out_of_service' || m.status === 'maintenance');
        
        // ===== BUILD DATA CONTEXT =====
        const dataContext = `
## DONNÉES DE LA PÉRIODE: ${startISO} au ${endISO}

### TICKETS MAINTENANCE
- Créés: ${ticketsCreated.length}
- Complétés: ${ticketsCompleted.length}
- En cours (actifs): ${activeTickets.length}
- Critiques/Haute priorité: ${criticalTickets.length}
- Temps moyen de réparation (TMR): ${avgResolutionTime.toFixed(1)} heures

### DÉTAIL TICKETS CRÉÉS
${ticketsCreated.slice(0, 20).map(t => `- [${t.priority?.toUpperCase()}] ${t.title} (${t.status})`).join('\n') || 'Aucun'}

### TICKETS EN ATTENTE (priorité haute)
${activeTickets.filter(t => t.priority === 'critical' || t.priority === 'high').map(t => `- ${t.title} - Assigné: ${t.assigned_to ? userMap[t.assigned_to] || 'Inconnu' : 'Non assigné'}`).join('\n') || 'Aucun'}

### ÉVÉNEMENTS PLANNING
${events.length} événements
${events.slice(0, 15).map(e => `- ${e.date}: ${e.title} (${e.type})`).join('\n') || 'Aucun'}

### MACHINES
- Total: ${machineStats.length}
- En panne/maintenance: ${machinesDown.length}
${machinesDown.map(m => `- ${m.machine_type} (${m.location}): ${m.status}`).join('\n') || ''}

### CHARGE TECHNICIENS
${technicianWorkload.map(tw => `- ${userMap[tw.user_id as number] || `User ${tw.user_id}`}: ${tw.count} tickets actifs`).join('\n') || 'Aucune charge assignée'}
`;

        // ===== BUILD EXPERT PROMPT =====
        
        // Detect document type from instructions
        const instructionsLower = (customInstructions || '').toLowerCase();
        const isNote = instructionsLower.includes('note de service') || instructionsLower.includes('note ');
        const isCompteRendu = instructionsLower.includes('compte-rendu') || instructionsLower.includes('compte rendu');
        const isMemo = instructionsLower.includes('mémo') || instructionsLower.includes('memo');
        const isBilan = instructionsLower.includes('bilan');
        const isIncident = instructionsLower.includes('incident');
        
        // Document type specific instructions
        let documentType = 'RAPPORT DE SYNTHÈSE';
        let documentFormat = '';
        
        if (isNote) {
            documentType = 'NOTE DE SERVICE';
            documentFormat = `
## FORMAT REQUIS
**OBJET:** [Titre précis]
**DATE:** ${new Date().toLocaleDateString('fr-FR')}
**DE:** Direction
**À:** [Destinataires selon contexte]

[Corps de la note: contexte, message principal, actions requises si applicable]

**La Direction**`;
        } else if (isCompteRendu) {
            documentType = 'COMPTE-RENDU';
            documentFormat = `
## FORMAT REQUIS
**COMPTE-RENDU** - [Sujet]
**Date:** ${new Date().toLocaleDateString('fr-FR')}

**1. Contexte**
**2. Points traités**
**3. Décisions**
**4. Actions à suivre** (Responsable | Échéance)`;
        } else if (isMemo) {
            documentType = 'MÉMO DIRECTION';
            documentFormat = `
## FORMAT REQUIS
**MÉMO** | ${new Date().toLocaleDateString('fr-FR')}
**Sujet:** [Une ligne]
**Message clé:** [2-3 phrases maximum]
**Action recommandée:** [Si applicable]`;
        } else if (isBilan || isIncident) {
            documentType = isBilan ? 'BILAN ANALYTIQUE' : 'RAPPORT D\'INCIDENT';
            documentFormat = `
## FORMAT REQUIS
**${documentType}** - Période: ${startISO} au ${endISO}

**Synthèse**
**Analyse des données**
**Indicateurs clés** (tableaux si pertinent)
**Constats**
**Recommandations**`;
        } else {
            documentFormat = `
## FORMAT REQUIS
**RAPPORT DE SYNTHÈSE** - ${new Date(startISO).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}

**1. Synthèse exécutive** (3-4 lignes max)
**2. Points d'attention** (priorisés par criticité)
**3. Indicateurs clés** (données chiffrées)
**4. Analyse opérationnelle**
**5. Recommandations** (concrètes et actionnables)`;
        }

        // Construire le contexte entreprise pour les rapports
        const companyContext = companyName ? `
# ENTREPRISE
- **Nom**: ${companyName}${companyShortName ? ` (${companyShortName})` : ''}
${aiConfig.identity ? `- **Contexte**: ${aiConfig.identity.substring(0, 500)}` : ''}
` : '';

        const fullPrompt = `# RÔLE
Tu es un expert en gestion industrielle et rédaction de documents de direction pour ${companyName || 'l\'entreprise'}. Tu produis des documents professionnels de haute qualité.
${companyContext}
# RÈGLES ABSOLUES
1. **EXACTITUDE**: Utilise UNIQUEMENT les données fournies ci-dessous. Ne jamais inventer de chiffres, noms, dates ou faits.
2. **PRÉCISION**: Chaque affirmation doit être traçable aux données sources.
3. **CONCISION**: Pas de répétitions. Chaque phrase apporte une information nouvelle.
4. **PERTINENCE**: Focus sur ce qui impacte les décisions de la direction.
5. **PROFESSIONNALISME**: Ton formel, vocabulaire précis, structure claire.

# INTERDICTIONS
- ❌ Ne jamais inventer de données non présentes dans le contexte
- ❌ Ne jamais répéter la même information sous différentes formes
- ❌ Ne jamais utiliser de formules vagues ("plusieurs", "beaucoup") quand un chiffre exact existe
- ❌ Ne jamais contredire les données fournies
- ❌ Ne jamais ajouter de recommandations sans lien avec les données

# DONNÉES SOURCES (période: ${startISO} → ${endISO})
${dataContext}
# FIN DES DONNÉES - Toute information hors de ce bloc est interdite.

# DEMANDE
${customInstructions ? `**Instructions spécifiques:** ${customInstructions}` : `Produis un ${documentType} professionnel.`}

# TYPE DE DOCUMENT: ${documentType}
${documentFormat}

# CONSIGNES DE RÉDACTION
- Commence directement par le contenu (pas d'introduction type "Voici le rapport...")
- Utilise des **gras** pour les points clés
- Privilégie les listes à puces pour la lisibilité
- Les chiffres doivent être exacts (copiés des données sources)
- Termine par des recommandations concrètes liées aux constats

# TRADUCTION OBLIGATOIRE (TOUT EN FRANÇAIS)
Traduis systématiquement les termes techniques anglais:
- CRITICAL → CRITIQUE
- HIGH → HAUTE  
- MEDIUM → MOYENNE
- LOW → BASSE
- waiting_parts → en attente de pièces
- received → nouveau/reçu
- in_progress → en cours
- diagnostic → en diagnostic
- completed → terminé
- archived → archivé
- operational → opérationnel
- maintenance → en maintenance
- out_of_service → hors service

**Abréviations techniques (utiliser les termes français):**
- MTTR (Mean Time To Repair) → TMR (Temps Moyen de Réparation)
- MTBF (Mean Time Between Failures) → MTBP (Moyenne des Temps de Bon fonctionnement entre Pannes)
- KPI (Key Performance Indicator) → ICP (Indicateur Clé de Performance)
- SLA (Service Level Agreement) → ANS (Accord de Niveau de Service)
- ETA (Estimated Time of Arrival) → HAP (Heure d'Arrivée Prévue)
- OEE (Overall Equipment Effectiveness) → TRS (Taux de Rendement Synthétique)
- GMAO → GMAO (Gestion de Maintenance Assistée par Ordinateur) - déjà français

Ne jamais afficher les codes anglais bruts ou abréviations anglaises dans le document final.`;
        
        console.log(`📊 [Report] Generating ${documentType} for period ${startISO} to ${endISO}`);

        // ===== CALL AI (DeepSeek PRIMARY, OpenAI FALLBACK) =====
        let aiResponse = '';
        
        if (env.DEEPSEEK_API_KEY) {
            try {
                console.log('📊 [Report] Using DeepSeek-Chat');
                const response = await fetch('https://api.deepseek.com/chat/completions', {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`, 
                        'Content-Type': 'application/json' 
                    },
                    body: JSON.stringify({
                        model: "deepseek-chat",
                        messages: [
                            { role: "system", content: fullPrompt },
                            { role: "user", content: `Génère le rapport ${period === 'day' ? 'journalier' : period === 'week' ? 'hebdomadaire' : 'mensuel'}.` }
                        ],
                        temperature: 0.3,
                        max_tokens: 2000
                    })
                });
                
                if (response.ok) {
                    const data = await response.json() as any;
                    aiResponse = data.choices[0]?.message?.content || '';
                }
            } catch (e) {
                console.warn('⚠️ [Report] DeepSeek failed, trying OpenAI fallback');
            }
        }
        
        // Fallback to OpenAI
        if (!aiResponse && env.OPENAI_API_KEY) {
            try {
                console.log('📊 [Report] Using GPT-4o-mini fallback');
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${env.OPENAI_API_KEY}`, 
                        'Content-Type': 'application/json' 
                    },
                    body: JSON.stringify({
                        model: "gpt-4o-mini",
                        messages: [
                            { role: "system", content: fullPrompt },
                            { role: "user", content: `Génère le rapport ${period === 'day' ? 'journalier' : period === 'week' ? 'hebdomadaire' : 'mensuel'}.` }
                        ],
                        temperature: 0.3,
                        max_tokens: 2000
                    })
                });
                
                if (response.ok) {
                    const data = await response.json() as any;
                    aiResponse = data.choices[0]?.message?.content || '';
                }
            } catch (e) {
                console.error('❌ [Report] OpenAI also failed');
            }
        }
        
        if (!aiResponse) {
            return c.json({ 
                error: 'Impossible de générer le rapport. Vérifiez les clés API.',
                data: dataContext 
            }, 500);
        }
        
        // Return structured response
        return c.json({
            success: true,
            period: { start: startISO, end: endISO, type: period },
            kpis: {
                ticketsCreated: ticketsCreated.length,
                ticketsCompleted: ticketsCompleted.length,
                activeTickets: activeTickets.length,
                criticalTickets: criticalTickets.length,
                mttr: parseFloat(avgResolutionTime.toFixed(1)),
                machinesDown: machinesDown.length,
                eventsCount: events.length
            },
            report: aiResponse,
            customFocus: customInstructions || null,
            generatedAt: new Date().toISOString()
        });
        
    } catch (e: any) {
        console.error('❌ [Report] Error:', e);
        return c.json({ error: e.message }, 500);
    }
});

// ============================================================
// POST /api/ai/secretary - Secrétaire de Direction IA (v2)
// Architecture multi-cerveaux spécialisés pour documents premium
// Chaque type de document = cerveau expert + données ciblées
// ============================================================
app.post('/secretary', async (c) => {
    try {
        const authHeader = c.req.header('Authorization');
        let token = authHeader?.replace('Bearer ', '') || getCookie(c, 'auth_token');
        if (!token) return c.json({ error: 'Non autorisé' }, 401);
        
        const payload = await verifyToken(token);
        if (!payload) return c.json({ error: 'Token invalide' }, 401);
        
        // Only admin and supervisor can use secretary
        if (!['admin', 'supervisor'].includes(payload.role)) {
            return c.json({ error: 'Accès réservé à la direction' }, 403);
        }
        
        const env = c.env as Bindings;
        const db = getDb(env);
        
        const body = await c.req.json();
        let { documentType, instructions } = body;
        
        if (!instructions || instructions.trim().length < 10) {
            return c.json({ error: 'Veuillez fournir des instructions détaillées (min. 10 caractères)' }, 400);
        }
        
        // ===== AUTO-DETECT DOCUMENT TYPE IF NOT PROVIDED =====
        if (!documentType || documentType === 'auto') {
            console.log(`🧠 [Secretary] Auto-detecting document type with AI...`);
            
            try {
                // Utiliser l'IA pour détecter le type de document
                const detectPrompt = `Tu es un assistant qui classifie les demandes de documents.

Analyse cette demande et détermine le type de document le plus approprié parmi:
- rapports : Rapports de maintenance, KPIs, statistiques, performances, bilans, tableaux de bord
- subventions : Demandes de financement gouvernemental, PARI, RS&DE, crédits d'impôt, Investissement Québec
- rh : Ressources humaines, offres d'emploi, embauches, contrats, évaluations, congédiements
- technique : Procédures, manuels, fiches techniques, cadenassage, SOP, checklists, sécurité
- correspondance : Lettres officielles, courriels formels, réclamations, partenariats, réponses clients/fournisseurs
- creatif : Communications marketing, communiqués de presse, site web, discours, pitchs, réseaux sociaux

Demande de l'utilisateur: "${instructions}"

Réponds UNIQUEMENT par un seul mot parmi: rapports, subventions, rh, technique, correspondance, creatif`;

                const detectResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini', // Modèle rapide et économique pour la classification
                        messages: [{ role: 'user', content: detectPrompt }],
                        temperature: 0,
                        max_tokens: 20
                    })
                });

                if (detectResponse.ok) {
                    const detectData = await detectResponse.json() as any;
                    const detectedType = detectData.choices?.[0]?.message?.content?.trim().toLowerCase();
                    
                    // Valider que le type est valide
                    const validTypes = ['rapports', 'subventions', 'rh', 'technique', 'correspondance', 'creatif'];
                    if (validTypes.includes(detectedType)) {
                        documentType = detectedType;
                        console.log(`🧠 [Secretary] AI detected document type: ${documentType}`);
                    } else {
                        // Fallback sur détection par mots-clés si réponse invalide
                        documentType = detectDocumentType(instructions);
                        console.log(`🧠 [Secretary] AI response invalid, fallback to keywords: ${documentType}`);
                    }
                } else {
                    // Fallback sur détection par mots-clés si API échoue
                    documentType = detectDocumentType(instructions);
                    console.log(`🧠 [Secretary] AI detection failed, fallback to keywords: ${documentType}`);
                }
            } catch (detectError) {
                // Fallback sur détection par mots-clés si erreur
                documentType = detectDocumentType(instructions);
                console.log(`🧠 [Secretary] AI detection error, fallback to keywords: ${documentType}`);
            }
        }
        
        // ===== LOAD BASE URL FOR TOOLS =====
        let baseUrl = '';
        try {
            const baseUrlSetting = await db.select()
                .from(systemSettings)
                .where(eq(systemSettings.setting_key, 'app_base_url'))
                .get();
            baseUrl = baseUrlSetting?.setting_value || '';
        } catch (e) {
            console.warn('[Secretary] Could not load base URL');
        }
        
        // ===== LOAD COMPANY IDENTITY FROM AI CONFIG (Cerveau de l'IA) =====
        const aiConfig = await getAiConfig(db);
        
        // ===== LOAD COMPANY SETTINGS =====
        let companyName = '';
        let companySubtitle = '';
        let companyShortName = '';
        
        try {
            const settings = await db.select().from(systemSettings)
                .where(inArray(systemSettings.setting_key, [
                    'company_title', 'company_subtitle', 'company_short_name'
                ]))
                .all();
            
            settings.forEach((s: any) => {
                if (s.setting_key === 'company_title') companyName = s.setting_value;
                if (s.setting_key === 'company_subtitle') companySubtitle = s.setting_value;
                if (s.setting_key === 'company_short_name') companyShortName = s.setting_value;
            });
        } catch (e) {
            console.warn('[Secretary] Failed to load company settings');
        }

        // ===== BUILD COMPANY IDENTITY FOR BRAIN =====
        const companyIdentity: CompanyIdentity = {
            name: companyName || 'Entreprise',
            shortName: companyShortName || '',
            subtitle: companySubtitle || '',
            identity: aiConfig.identity || '',
            hierarchy: aiConfig.hierarchy || '',
            knowledge: aiConfig.knowledge || '',
            custom: aiConfig.custom || ''
        };

        // ===== PREPARE SPECIALIZED BRAIN =====
        console.log(`🧠 [Secretary] Preparing ${documentType} brain with specialized data...`);
        
        let brainResult;
        try {
            brainResult = await prepareSecretary(
                documentType as DocumentType,
                env,  // Pass env for D1 direct access in data loaders
                companyIdentity,
                baseUrl
            );
            console.log(`🧠 [Secretary] Brain ready: ${brainResult.systemPrompt.length} chars prompt, ${brainResult.contextData.length} chars data`);
        } catch (brainError: any) {
            console.error(`❌ [Secretary] Brain preparation failed:`, brainError.message, brainError.stack);
            return c.json({ 
                error: `Erreur lors de la préparation du cerveau: ${brainError.message}` 
            }, 500);
        }

        // ===== SELECT AI PROVIDER =====
        let secretaryAiConfig = AI_CONFIGS[SECRETARY_AI_PROVIDER];
        let apiKey = env[secretaryAiConfig.keyEnv];
        let usedProvider = SECRETARY_AI_PROVIDER;
        
        // DEBUG: Log key availability
        console.log(`🔑 [Secretary] DEEPSEEK_API_KEY exists: ${!!env.DEEPSEEK_API_KEY}, length: ${env.DEEPSEEK_API_KEY?.length || 0}`);
        console.log(`🔑 [Secretary] OPENAI_API_KEY exists: ${!!env.OPENAI_API_KEY}`);
        console.log(`🔑 [Secretary] Selected provider: ${SECRETARY_AI_PROVIDER}, keyEnv: ${secretaryAiConfig.keyEnv}`);
        console.log(`🔑 [Secretary] apiKey from env: ${apiKey ? 'found (' + apiKey.substring(0, 8) + '...)' : 'NOT FOUND'}`);
        
        // Fallback to OpenAI if DeepSeek key missing
        if (!apiKey && SECRETARY_AI_PROVIDER === 'deepseek') {
            console.log(`⚠️ [Secretary] DeepSeek key missing, falling back to OpenAI`);
            secretaryAiConfig = AI_CONFIGS.openai;
            apiKey = env.OPENAI_API_KEY;
            usedProvider = 'openai';
        }
        
        if (!apiKey) {
            console.error(`❌ [Secretary] No API key available for any provider`);
            return c.json({ error: 'Clé API manquante (DeepSeek ou OpenAI)' }, 500);
        }
        
        console.log(`🤖 [Secretary] Using ${usedProvider} (${secretaryAiConfig.model})`);
        console.log(`🌐 [Secretary] API URL: ${secretaryAiConfig.url}`);

        // ===== PREPARE MESSAGES =====
        const fullPrompt = brainResult.contextData 
            ? `${brainResult.systemPrompt}\n\n${brainResult.contextData}`
            : brainResult.systemPrompt;
            
        const messages: any[] = [
            { role: "system", content: fullPrompt },
            { role: "user", content: instructions }
        ];
        
        // ===== CALL AI WITH TOOLS =====
        let aiResponse = '';
        let turns = 0;
        const MAX_TURNS = 5;
        
        // Get tools for this document type
        // NOTE: DeepSeek a des problèmes avec les tools complexes, on les désactive pour DeepSeek
        // Les données sont déjà chargées dans contextData donc pas besoin de tools
        const SECRETARY_TOOLS = (brainResult.tools.length > 0 && usedProvider === 'openai') ? TOOLS : [];
        console.log(`🔧 [Secretary] Tools enabled: ${SECRETARY_TOOLS.length > 0} (provider: ${usedProvider})`);
        
        while (turns < MAX_TURNS) {
            turns++;
            console.log(`📝 [Secretary] Turn ${turns}/${MAX_TURNS} (${usedProvider})`);
            
            try {
                const requestBody: any = {
                    model: secretaryAiConfig.model,
                    messages,
                    temperature: brainResult.temperature,
                    max_tokens: brainResult.maxTokens
                };
                
                // Only add tools if brain recommends them
                if (SECRETARY_TOOLS.length > 0) {
                    requestBody.tools = SECRETARY_TOOLS;
                    requestBody.tool_choice = "auto";
                }
                
                const response = await fetch(secretaryAiConfig.url, {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${apiKey}`, 
                        'Content-Type': 'application/json' 
                    },
                    body: JSON.stringify(requestBody)
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`❌ [Secretary] ${usedProvider} API error:`, response.status, errorText);
                    return c.json({ 
                        error: `Erreur API ${usedProvider} (${response.status}): ${errorText.substring(0, 200)}` 
                    }, 500);
                }
                
                const data = await response.json() as any;
                const responseMessage = data.choices[0]?.message;
                
                if (!responseMessage) {
                    console.error(`❌ [Secretary] No response message from ${usedProvider}`);
                    return c.json({ error: `Réponse ${usedProvider} invalide` }, 500);
                }
                
                messages.push(responseMessage);
                
                // Handle tool calls
                if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
                    console.log(`🔧 [Secretary] Using ${responseMessage.tool_calls.length} tool(s)`);
                    
                    for (const toolCall of responseMessage.tool_calls) {
                        const fnName = toolCall.function.name;
                        const fnArgs = JSON.parse(toolCall.function.arguments || '{}');
                        let toolResult = "Erreur: Outil inconnu";
                        
                        if (ToolFunctions[fnName as keyof typeof ToolFunctions]) {
                            try {
                                if (['search_tickets', 'get_overdue_tickets', 'get_unassigned_tickets'].includes(fnName)) {
                                    // @ts-ignore
                                    toolResult = await ToolFunctions[fnName](db, fnArgs, baseUrl || "https://app.igpglass.ca");
                                } else if (['get_planning'].includes(fnName)) {
                                    // @ts-ignore
                                    toolResult = await ToolFunctions[fnName](db, fnArgs, payload.userId);
                                } else {
                                    // @ts-ignore
                                    toolResult = await ToolFunctions[fnName](db, fnArgs);
                                }
                            } catch (err: any) {
                                toolResult = `Erreur: ${err.message}`;
                                console.error(`❌ [Secretary] Tool ${fnName} failed:`, err);
                            }
                        }
                        
                        messages.push({ 
                            role: "tool", 
                            tool_call_id: toolCall.id, 
                            content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult)
                        });
                    }
                    continue;
                }
                
                // Final response
                aiResponse = responseMessage.content || '';
                break;
                
            } catch (e: any) {
                console.error('❌ [Secretary] API call failed:', e);
                return c.json({ error: `Erreur lors de l'appel IA: ${e.message}` }, 500);
            }
        }
        
        if (!aiResponse) {
            return c.json({ 
                error: `Impossible de générer le document après ${turns} tentatives.` 
            }, 500);
        }
        
        // ===== EXTRACT TITLE =====
        let title = 'Document';
        
        // Titres par défaut par type de document
        const defaultTitles: Record<string, string> = {
            'correspondance': 'Correspondance officielle',
            'subventions': 'Demande de subvention',
            'rh': 'Document RH',
            'technique': 'Document technique',
            'rapports': 'Rapport de maintenance',
            'creatif': 'Document créatif'
        };
        
        if (documentType === 'correspondance') {
            // Pour correspondance: extraire l'objet de la lettre
            const objetMatch = aiResponse.match(/\*\*Objet\s*:\*\*\s*(.+?)(?:\n|$)/i) 
                           || aiResponse.match(/Objet\s*:\s*(.+?)(?:\n|$)/i);
            if (objetMatch) {
                title = objetMatch[1].trim();
            } else {
                title = defaultTitles['correspondance'];
            }
        } else if (documentType === 'rh') {
            // Pour RH: chercher "Offre d'emploi :" ou titre en # sinon défaut
            const rhTitleMatch = aiResponse.match(/^(?:Offre d'emploi|Lettre d'embauche|Évaluation|Fin d'emploi)\s*:\s*(.+?)$/mi)
                              || aiResponse.match(/^#+ (.+)$/m);
            if (rhTitleMatch) {
                title = rhTitleMatch[0].replace(/^#+\s*/, '').trim();
            } else {
                title = defaultTitles['rh'];
            }
        } else if (documentType === 'rapports') {
            // Pour rapports: chercher le titre # en premier
            const rapportMatch = aiResponse.match(/^# (.+)$/m);
            if (rapportMatch) {
                title = rapportMatch[1].trim();
            } else {
                title = defaultTitles['rapports'];
            }
        } else if (documentType === 'subventions') {
            // Pour subventions: chercher "Titre du projet:" ou "Programme visé:"
            const subventionMatch = aiResponse.match(/Titre du projet\s*:\s*(.+?)(?:\n|$)/i)
                                 || aiResponse.match(/Programme visé\s*:\s*(.+?)(?:\n|$)/i);
            if (subventionMatch) {
                const programme = aiResponse.match(/Programme visé\s*:\s*(.+?)(?:\n|$)/i);
                const projet = aiResponse.match(/Titre du projet\s*:\s*(.+?)(?:\n|$)/i);
                if (programme && projet) {
                    title = `${programme[1].trim()} - ${projet[1].trim()}`;
                } else {
                    title = subventionMatch[1].trim();
                }
            } else {
                title = defaultTitles['subventions'];
            }
        } else {
            // Pour autres documents: chercher un titre # 
            const titleMatch = aiResponse.match(/^#+ (.+)$/m);
            if (titleMatch) {
                title = titleMatch[1].replace(/\*\*/g, '').trim();
            } else {
                title = defaultTitles[documentType] || 'Document de direction';
            }
        }
        
        return c.json({
            success: true,
            documentType,
            title,
            document: aiResponse,
            generatedAt: new Date().toISOString(),
            generatedBy: payload.full_name || payload.email
        });
        
    } catch (e: any) {
        console.error('❌ [Secretary] Error:', e);
        return c.json({ error: e.message }, 500);
    }
});

// ============================================================
// LEGACY CODE REMOVED - Replaced by modular secretary architecture
// Old monolithic approach with 900+ lines replaced by:
// - src/ai/secretary/brains/*.ts (6 specialized brains)
// - src/ai/secretary/data/loaders.ts (targeted data loading)
// - src/ai/secretary/index.ts (router)
// ============================================================

/*
 * REMOVED: Old monolithic secretary implementation
 * - 900+ lines of inline code
 * - Single prompt trying to handle all document types
 * - Full database dump regardless of document type
 * - Duplicated logic from data loading
 * 
 * REPLACED WITH: Multi-brain architecture
 * - Each document type = specialized expert brain
 * - Targeted data loading per brain
 * - Cleaner, maintainable, testable code
 * - Better quality documents
 */

export default app;
