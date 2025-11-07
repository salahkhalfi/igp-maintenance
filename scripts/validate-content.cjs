#!/usr/bin/env node

/**
 * Script de validation de cohérence du contenu
 * Vérifie que les guides et versions sont synchronisés
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkContentConsistency() {
  log('cyan', '\n🔍 Validation de la cohérence du contenu...\n');
  
  const indexPath = path.join(__dirname, '..', 'src', 'index.tsx');
  const content = fs.readFileSync(indexPath, 'utf-8');
  
  let errors = 0;
  let warnings = 0;
  
  // 1. Vérifier le nombre de rôles dans les deux guides
  log('blue', '📋 Vérification du nombre de rôles...');
  
  const modalRolesMatch = content.match(/title: "👥 Les (\d+) Rôles/);
  const staticRolesMatch = content.match(/font-bold">👥 Les (\d+) Rôles/);
  
  if (modalRolesMatch && staticRolesMatch) {
    const modalRoles = modalRolesMatch[1];
    const staticRoles = staticRolesMatch[1];
    
    if (modalRoles === staticRoles) {
      log('green', `  ✅ Nombre de rôles cohérent: ${modalRoles} rôles`);
    } else {
      log('red', `  ❌ ERREUR: Incohérence du nombre de rôles!`);
      log('red', `     Modal: ${modalRoles} rôles`);
      log('red', `     Page statique: ${staticRoles} rôles`);
      errors++;
    }
  } else {
    log('yellow', '  ⚠️  Impossible de détecter le nombre de rôles');
    warnings++;
  }
  
  // 2. Vérifier la version dans les deux guides
  log('blue', '\n📦 Vérification de la version...');
  
  // Chercher spécifiquement dans les footers/badges de version
  const modalVersionMatch = content.match(/✨ v(\d+\.\d+\.\d+) - Mise à jour/);
  const staticVersionMatch = content.match(/🏷️ <strong>Version (\d+\.\d+\.\d+)/);
  
  if (modalVersionMatch && staticVersionMatch) {
    const modalVersion = modalVersionMatch[1];
    const staticVersion = staticVersionMatch[1];
    
    if (modalVersion === staticVersion) {
      log('green', `  ✅ Version cohérente: v${modalVersion}`);
    } else {
      log('red', `  ❌ ERREUR: Versions différentes!`);
      log('red', `     Modal footer: v${modalVersion}`);
      log('red', `     Page statique footer: v${staticVersion}`);
      errors++;
    }
  } else {
    log('yellow', '  ⚠️  Impossible de détecter les versions dans les footers');
    log('yellow', `     Modal match: ${modalVersionMatch ? 'OK' : 'NOT FOUND'}`);
    log('yellow', `     Static match: ${staticVersionMatch ? 'OK' : 'NOT FOUND'}`);
    warnings++;
  }
  
  // 3. Vérifier que les deux guides existent
  log('blue', '\n📖 Vérification de l\'existence des guides...');
  
  const hasModalGuide = content.includes('const UserGuideModal');
  const hasStaticGuide = content.includes('app.get(\'/guide\'');
  
  if (hasModalGuide) {
    log('green', '  ✅ Modal UserGuideModal trouvé');
  } else {
    log('red', '  ❌ ERREUR: Modal UserGuideModal manquant!');
    errors++;
  }
  
  if (hasStaticGuide) {
    log('green', '  ✅ Route /guide trouvée');
  } else {
    log('red', '  ❌ ERREUR: Route /guide manquante!');
    errors++;
  }
  
  // 4. Vérifier la présence de section messagerie
  log('blue', '\n💬 Vérification de la section messagerie...');
  
  const hasMessagingInModal = content.includes('title: "💬 Messagerie') || content.includes('title: \'💬 Messagerie');
  const hasMessagingInStatic = content.includes('Messagerie Équipe');
  
  if (hasMessagingInModal) {
    log('green', '  ✅ Section messagerie dans modal');
  } else {
    log('yellow', '  ⚠️  Section messagerie absente du modal');
    warnings++;
  }
  
  if (hasMessagingInStatic) {
    log('green', '  ✅ Section messagerie dans page statique');
  } else {
    log('yellow', '  ⚠️  Section messagerie absente de la page statique');
    warnings++;
  }
  
  // 5. Résumé
  log('cyan', '\n' + '='.repeat(50));
  log('cyan', '📊 RÉSUMÉ DE LA VALIDATION');
  log('cyan', '='.repeat(50));
  
  if (errors === 0 && warnings === 0) {
    log('green', '\n✅ PARFAIT! Aucune erreur ni avertissement.\n');
    return 0;
  } else if (errors === 0) {
    log('yellow', `\n⚠️  ${warnings} avertissement(s) trouvé(s).\n`);
    return 0;
  } else {
    log('red', `\n❌ ${errors} erreur(s) et ${warnings} avertissement(s) trouvé(s).\n`);
    log('red', '🚨 VEUILLEZ CORRIGER LES ERREURS AVANT DE DÉPLOYER!\n');
    return 1;
  }
}

// Exécution
const exitCode = checkContentConsistency();
process.exit(exitCode);
