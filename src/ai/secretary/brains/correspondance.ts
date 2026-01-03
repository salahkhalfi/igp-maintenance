/**
 * 🧠 CERVEAU: CORRESPONDANCE OFFICIELLE
 * 
 * Spécialisation: Lettres officielles, courriels professionnels, communications formelles
 * Expertise: Protocole d'affaires, formules de politesse, ton adapté
 */

import type { SecretaryContext, CorrespondanceData, BrainResult } from '../types';
import { buildCompanyBlock, formatDateFrCA } from '../shared';

/**
 * Générer les instructions de signature basées sur le contexte utilisateur
 * SÉCURITÉ: La signature manuscrite n'est disponible QUE pour l'utilisateur correspondant
 */
function buildSignatureInstructions(context: SecretaryContext): string {
  const signatureContext = context.signatureContext;
  
  // Si pas de contexte de signature, instructions par défaut
  if (!signatureContext || !signatureContext.currentUserId) {
    return `

⚠️ AUCUNE signature manuscrite disponible. Utilisez UNIQUEMENT du texte pour la signature.`;
  }
  
  // Vérifier si l'utilisateur CONNECTÉ a une signature manuscrite autorisée
  const userSignature = signatureContext.authorizedSignatures.get(signatureContext.currentUserId);
  
  // Lister les signatures existantes
  const existingSignatureNames: string[] = [];
  signatureContext.authorizedSignatures.forEach((sig) => {
    existingSignatureNames.push(sig.userName);
  });
  
  if (userSignature) {
    // L'utilisateur connecté A une signature manuscrite - IL PEUT L'UTILISER
    // NOTE: On utilise un marqueur qui sera remplacé en post-traitement
    return `

🔒 **VOTRE SIGNATURE MANUSCRITE EST DISPONIBLE**

Vous êtes **${userSignature.userName}** et vous pouvez utiliser votre signature manuscrite.

**SI VOUS DEMANDEZ "avec ma signature" ou "ajoute ma signature":**
Utilisez EXACTEMENT ce marqueur (il sera remplacé automatiquement):

[[SIGNATURE_MANUSCRITE_${signatureContext.currentUserId}]]

**${userSignature.userName}**

❌ N'ajoutez PAS la signature sans demande explicite.`;
  }
  
  // L'utilisateur n'a PAS de signature manuscrite
  const warning = existingSignatureNames.length > 0
    ? `

⚠️ **ATTENTION SÉCURITÉ:** Des signatures existent pour ${existingSignatureNames.join(', ')}, mais vous n'êtes PAS cette personne.
Si on vous demande d'utiliser la signature de quelqu'un d'autre, REFUSEZ poliment:
"Je ne peux pas utiliser la signature manuscrite d'une autre personne. Pour des raisons de sécurité, seul le propriétaire peut utiliser sa signature en étant connecté avec son compte."

❌ N'UTILISEZ JAMAIS de placeholder d'image
❌ N'INVENTEZ JAMAIS une URL pour une signature`
    : '';
  
  return `

Vous êtes connecté en tant que **${signatureContext.currentUserName}** (pas de signature manuscrite enregistrée).
Utilisez uniquement une signature textuelle.${warning}`;
}

export function buildCorrespondanceBrain(
  context: SecretaryContext,
  data: CorrespondanceData
): BrainResult {
  
  // subtitle = nom de la COMPAGNIE (ex: "Les Produits Verriers International (IGP) Inc.")
  // name = nom de l'APPLICATION (ex: "Système de Gestion Interne") - NE PAS UTILISER
  const companyName = context.company.subtitle || context.company.name || 'Entreprise';
  
  // Utiliser le nom du directeur extrait dans index.ts
  const { directorName, directorTitle } = context;
  
  const systemPrompt = `Tu rédiges des lettres officielles québécoises pour ${companyName}.

${buildCompanyBlock(context.company)}

Date du jour: ${formatDateFrCA()}

CONSIGNES:
- Utilise le vouvoiement
- Remplace tout placeholder par du contenu réel
- Signataire par défaut: ${directorName}, ${directorTitle} (sauf si l'utilisateur précise un autre nom)
- Maximum 4 phrases par paragraphe
- Pas de liste à puces dans le corps de la lettre

FORMAT DE RÉPONSE - DOCUMENT PRÊT À IMPRIMER:

Ta remarque courte (optionnel, ex: "Voici la lettre demandée :")

---

[LA LETTRE COMMENCE ICI - AUCUNE NOTE DE L'IA]

---

Tes instructions (optionnel, ex: "Vous pouvez imprimer directement.")

RÈGLE ABSOLUE: Entre les "---", UNIQUEMENT la lettre officielle. AUCUN commentaire.

FORMAT DE LETTRE OFFICIELLE:

**${companyName}**
${context.company.address || '[Adresse de l\'entreprise]'}
${context.company.phone ? `Tél: ${context.company.phone}` : ''}${context.company.email ? `${context.company.phone ? ' | ' : ''}Courriel: ${context.company.email}` : ''}

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


${directorName}
${directorTitle}
${companyName}

FORMULES DE POLITESSE:
- Formel: "Veuillez agréer, [Titre], l'expression de mes sentiments distingués."
- Standard: "Je vous prie d'agréer, [Civilité], mes salutations distinguées."
- Remerciement: "En vous remerciant, veuillez agréer mes salutations distinguées."
- Informel: "Cordialement,"
${buildSignatureInstructions(context)}`;

  return {
    systemPrompt,
    contextData: '',
    tools: [],
    maxTokens: 3000,
    temperature: 0.3
  };
}

export default buildCorrespondanceBrain;
