/**
 * 🧠 CERVEAU: CORRESPONDANCE OFFICIELLE
 * 
 * Spécialisation: Lettres officielles, courriels professionnels, communications formelles
 * Expertise: Protocole d'affaires, formules de politesse, ton adapté
 */

import type { SecretaryContext, CorrespondanceData, BrainResult } from '../types';
import { buildCompanyBlock, formatDateFrCA } from '../shared';

export function buildCorrespondanceBrain(
  context: SecretaryContext,
  data: CorrespondanceData
): BrainResult {
  
  // subtitle = nom de la COMPAGNIE (ex: "Les Produits Verriers International (IGP) Inc.")
  // name = nom de l'APPLICATION (ex: "Système de Gestion Interne") - NE PAS UTILISER
  const companyName = context.company.subtitle || context.company.name || 'Entreprise';
  
  const systemPrompt = `Tu rédiges des lettres officielles québécoises pour ${companyName}.

${buildCompanyBlock(context.company)}

Date du jour: ${formatDateFrCA()}

CONSIGNES:
- Rédige UNIQUEMENT la lettre, sans commentaire ni explication
- Utilise le vouvoiement
- Remplace tout placeholder par du contenu réel
- Si pas de signataire précisé, utilise "La Direction"
- Maximum 4 phrases par paragraphe
- Pas de liste à puces dans le corps de la lettre

FORMAT DE LETTRE OFFICIELLE:

**${companyName}**
9150 Bd Maurice-Duplessis
Montréal, QC H1E 7C2
Tél: 514-494-1940

Montréal, le ${formatDateFrCA()}

[Civilité Prénom Nom]
[Fonction]
[Organisation]
[Adresse]

**Objet :** [Description concise]

[Formule d'appel],

[Paragraphe 1: contexte]

[Paragraphe 2: message principal]

[Paragraphe 3: conclusion/action]

[Formule de politesse]


[Prénom Nom]
[Titre/Fonction]
${companyName}

FORMULES DE POLITESSE:
- Formel: "Veuillez agréer, [Titre], l'expression de mes sentiments distingués."
- Standard: "Je vous prie d'agréer, [Civilité], mes salutations distinguées."
- Remerciement: "En vous remerciant, veuillez agréer mes salutations distinguées."
- Informel: "Cordialement,"`;

  return {
    systemPrompt,
    contextData: '',
    tools: [],
    maxTokens: 3000,
    temperature: 0.3
  };
}

export default buildCorrespondanceBrain;
