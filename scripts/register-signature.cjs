#!/usr/bin/env node
/**
 * Script pour enregistrer une signature manuscrite dans system_settings
 * 
 * UTILISATION:
 * node scripts/register-signature.cjs <userId> <userName> <imagePath>
 * 
 * EXEMPLE:
 * node scripts/register-signature.cjs 1 "Marc Bélanger" ./signature-marc.png
 * 
 * SÉCURITÉ:
 * - Ce script doit être exécuté uniquement par un administrateur
 * - La signature est stockée en base64 dans system_settings
 * - Clé: director_signature_{userId}
 */

const fs = require('fs');
const path = require('path');

async function registerSignature() {
    const args = process.argv.slice(2);
    
    if (args.length < 3) {
        console.log(`
╔═══════════════════════════════════════════════════════════════╗
║         ENREGISTREMENT DE SIGNATURE MANUSCRITE                 ║
╠═══════════════════════════════════════════════════════════════╣
║                                                                ║
║ UTILISATION:                                                   ║
║   node scripts/register-signature.cjs <userId> <userName> <image>║
║                                                                ║
║ EXEMPLE:                                                       ║
║   node scripts/register-signature.cjs 1 "Marc Bélanger" ./sig.png║
║                                                                ║
║ FORMATS SUPPORTÉS: PNG, JPG, JPEG, GIF, WEBP                   ║
║                                                                ║
║ RÉSULTAT:                                                      ║
║   - Génère une commande SQL à exécuter dans D1                 ║
║   - OU utilise l'API si --api est spécifié                     ║
║                                                                ║
╚═══════════════════════════════════════════════════════════════╝
`);
        process.exit(1);
    }
    
    const userId = parseInt(args[0], 10);
    const userName = args[1];
    const imagePath = args[2];
    
    if (isNaN(userId)) {
        console.error('❌ Erreur: userId doit être un nombre');
        process.exit(1);
    }
    
    if (!fs.existsSync(imagePath)) {
        console.error(`❌ Erreur: Fichier non trouvé: ${imagePath}`);
        process.exit(1);
    }
    
    // Déterminer le type MIME
    const ext = path.extname(imagePath).toLowerCase();
    const mimeTypes = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
    };
    
    const mimeType = mimeTypes[ext];
    if (!mimeType) {
        console.error(`❌ Erreur: Format non supporté: ${ext}`);
        console.error('   Formats acceptés: PNG, JPG, JPEG, GIF, WEBP');
        process.exit(1);
    }
    
    // Lire et encoder l'image
    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');
    
    // Créer l'objet de données
    const signatureData = {
        base64,
        userName,
        mimeType,
        registeredAt: new Date().toISOString()
    };
    
    const settingKey = `director_signature_${userId}`;
    const settingValue = JSON.stringify(signatureData);
    
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║              ✅ SIGNATURE PRÉPARÉE                             ║
╠═══════════════════════════════════════════════════════════════╣
║ User ID: ${String(userId).padEnd(52)}║
║ Nom: ${userName.padEnd(56)}║
║ Type: ${mimeType.padEnd(55)}║
║ Taille: ${(base64.length / 1024).toFixed(2)} KB (base64)${' '.repeat(40)}║
╚═══════════════════════════════════════════════════════════════╝

🔧 COMMANDE SQL À EXÉCUTER DANS CLOUDFLARE D1:

INSERT OR REPLACE INTO system_settings (setting_key, setting_value)
VALUES ('${settingKey}', '${settingValue.replace(/'/g, "''")}');

📝 OU via Wrangler:
npx wrangler d1 execute maintenance-db --command="INSERT OR REPLACE INTO system_settings (setting_key, setting_value) VALUES ('${settingKey}', '...');"

⚠️ Note: La commande complète avec les données base64 est trop longue pour être affichée.
   Utilisez le fichier SQL généré ci-dessous.
`);

    // Générer un fichier SQL
    const sqlFile = `scripts/signature-${userId}.sql`;
    const sqlContent = `-- Signature manuscrite pour ${userName} (ID: ${userId})
-- Généré le ${new Date().toISOString()}
-- ⚠️ SÉCURITÉ: Ce fichier contient des données sensibles

INSERT OR REPLACE INTO system_settings (setting_key, setting_value)
VALUES ('${settingKey}', '${settingValue.replace(/'/g, "''")}');

-- Pour vérifier:
-- SELECT setting_key FROM system_settings WHERE setting_key LIKE 'director_signature_%';
`;

    fs.writeFileSync(sqlFile, sqlContent);
    console.log(`📄 Fichier SQL généré: ${sqlFile}`);
    console.log(`
Pour appliquer en local:
  npx wrangler d1 execute maintenance-db --local --file=${sqlFile}

Pour appliquer en production:
  npx wrangler d1 execute maintenance-db --file=${sqlFile}
`);
}

registerSignature().catch(err => {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
});
