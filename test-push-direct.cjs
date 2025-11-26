#!/usr/bin/env node
/**
 * Script de test direct des notifications push
 * 
 * Usage:
 *   node test-push-direct.cjs [user_id]
 * 
 * Ce script ne teste PAS l'envoi réel (nécessite VAPID_PRIVATE_KEY)
 * Il vérifie seulement la configuration et les subscriptions en DB
 */

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║        🔍 TEST DIAGNOSTIC - Push Notifications                ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log('📋 VÉRIFICATIONS DE CONFIGURATION\n');
console.log('═'.repeat(70));

// 1. Vérifier wrangler.jsonc
const fs = require('fs');
const path = require('path');

const wranglerPath = path.join(__dirname, 'wrangler.jsonc');

if (fs.existsSync(wranglerPath)) {
  const wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
  
  const hasPushEnabled = wranglerContent.includes('PUSH_ENABLED');
  const hasVapidPublic = wranglerContent.includes('VAPID_PUBLIC_KEY');
  
  console.log(`${hasPushEnabled ? '✅' : '❌'} PUSH_ENABLED défini`);
  console.log(`${hasVapidPublic ? '✅' : '❌'} VAPID_PUBLIC_KEY défini`);
  
  if (hasPushEnabled && hasVapidPublic) {
    console.log(`\n✅ Configuration wrangler.jsonc: OK\n`);
  } else {
    console.log(`\n❌ Configuration wrangler.jsonc: INCOMPLÈTE\n`);
  }
} else {
  console.log('❌ wrangler.jsonc introuvable\n');
}

// 2. Vérifier service-worker.js
const swPath = path.join(__dirname, 'public/service-worker.js');

if (fs.existsSync(swPath)) {
  const swContent = fs.readFileSync(swPath, 'utf8');
  
  const hasPushListener = swContent.includes("addEventListener('push'");
  const hasNotificationClick = swContent.includes("addEventListener('notificationclick'");
  const hasViewTicket = swContent.includes("action === 'view_ticket'");
  
  console.log('\n📱 SERVICE WORKER\n');
  console.log('═'.repeat(70));
  console.log(`${hasPushListener ? '✅' : '❌'} Event listener 'push' présent`);
  console.log(`${hasNotificationClick ? '✅' : '❌'} Event listener 'notificationclick' présent`);
  console.log(`${hasViewTicket ? '✅' : '❌'} Gestion action 'view_ticket' présente`);
  
  if (hasPushListener && hasNotificationClick && hasViewTicket) {
    console.log(`\n✅ Service Worker: OK\n`);
  } else {
    console.log(`\n⚠️ Service Worker: INCOMPLET\n`);
  }
} else {
  console.log('\n❌ service-worker.js introuvable\n');
}

// 3. Instructions pour vérifier en production
console.log('\n🔬 COMMANDES DE DIAGNOSTIC EN PRODUCTION\n');
console.log('═'.repeat(70));

console.log(`
1️⃣  Vérifier secrets Cloudflare:
   npx wrangler pages secret list --project-name webapp
   
   Attendu:
   ✅ VAPID_PRIVATE_KEY: Value Encrypted
   ✅ JWT_SECRET: Value Encrypted

2️⃣  Vérifier subscriptions en base de données:
   npx wrangler d1 execute maintenance-db \\
     --command="SELECT COUNT(*) as total FROM push_subscriptions"
   
   Si total = 0 → Aucune subscription active

3️⃣  Vérifier logs push récents:
   npx wrangler d1 execute maintenance-db \\
     --command="SELECT * FROM push_logs ORDER BY created_at DESC LIMIT 5"
   
   Chercher status: 'success' ou 'failed'

4️⃣  Vérifier vos subscriptions personnelles:
   npx wrangler d1 execute maintenance-db \\
     --command="SELECT ps.*, u.first_name FROM push_subscriptions ps JOIN users u ON ps.user_id = u.id WHERE u.email = 'VOTRE_EMAIL@example.com'"

5️⃣  Tester création ticket:
   - Se connecter sur https://mecanique.igpglass.ca
   - Créer nouveau ticket
   - Assigner à vous-même
   - Attendre 5-10 secondes
   - Vérifier notification
`);

console.log('\n💡 PROBLÈMES COURANTS\n');
console.log('═'.repeat(70));

console.log(`
❌ Bouton push reste ROUGE:
   → Permissions navigateur refusées
   → Clic sur cadenas 🔒 → Notifications → Autoriser

❌ Push envoyé (success) mais non reçu (ANDROID CHROME):
   → Android bloque notifications en arrière-plan
   → Solution: INSTALLER L'APP EN PWA
   → Chrome → Menu → "Installer l'application"

❌ Subscription existe mais push échoue:
   → Vérifier logs: error_message dans push_logs
   → Endpoint peut être expiré (410 Gone)
   → Réactiver notifications (clic rouge → vert)

❌ Service Worker inactif:
   → DevTools → Application → Service Workers
   → Si "stopped" → Recharger page (Ctrl+F5)
`);

console.log('\n🎯 SOLUTION LA PLUS PROBABLE\n');
console.log('═'.repeat(70));

console.log(`
SI ANDROID CHROME:
  1. Installer app en PWA (Menu → Installer l'application)
  2. Ouvrir l'app depuis icône écran d'accueil
  3. Activer notifications (bouton vert)
  4. Tester avec ticket

SI DESKTOP:
  1. Vérifier bouton push est VERT
  2. Vérifier permissions navigateur
  3. Créer ticket de test
  4. DevTools → Console pour voir logs

SI IOS SAFARI:
  1. Réglages → Safari → Notifications
  2. Autoriser mecanique.igpglass.ca
  3. Tester avec ticket
`);

console.log('\n✅ Diagnostic terminé\n');
console.log('Pour plus d\'informations, voir: DIAGNOSTIC_PUSH_NOTIFICATIONS.md\n');
