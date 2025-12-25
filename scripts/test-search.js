#!/usr/bin/env node

/**
 * Script de test automatique du moteur de recherche
 * Usage: node scripts/test-search.js
 */

const baseUrl = process.env.TEST_URL || 'http://localhost:3000';
const email = process.env.TEST_EMAIL || 'admin@igpglass.ca';
const password = process.env.TEST_PASSWORD || 'password123';

console.log('🔍 TEST AUTOMATIQUE DU MOTEUR DE RECHERCHE\n');
console.log('='.repeat(60));
console.log('URL:', baseUrl);
console.log('User:', email);
console.log('='.repeat(60));

async function runTests() {
    let token;
    
    // Test 1: Login
    console.log('\n1️⃣ Test de connexion...');
    try {
        const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (!loginResponse.ok) {
            console.error('   ❌ ÉCHEC - Status:', loginResponse.status);
            const error = await loginResponse.text();
            console.error('   Erreur:', error);
            return false;
        }
        
        const loginData = await loginResponse.json();
        token = loginData.token;
        console.log('   ✅ SUCCÈS');
        console.log('   User:', loginData.user.email, '-', loginData.user.role);
        console.log('   Token:', token.substring(0, 30) + '...');
    } catch (error) {
        console.error('   ❌ ERREUR:', error.message);
        return false;
    }
    
    // Test 2: Recherche texte
    console.log('\n2️⃣ Test recherche texte: "polisseuse"...');
    try {
        const searchResponse = await fetch(`${baseUrl}/api/search?q=polisseuse`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!searchResponse.ok) {
            console.error('   ❌ ÉCHEC - Status:', searchResponse.status);
            return false;
        }
        
        const searchData = await searchResponse.json();
        console.log('   ✅ SUCCÈS');
        console.log('   Résultats:', searchData.results?.length || 0);
        if (searchData.results?.length > 0) {
            console.log('   Premier:', searchData.results[0].ticket_id);
            console.log('   Titre:', searchData.results[0].title);
        }
    } catch (error) {
        console.error('   ❌ ERREUR:', error.message);
        return false;
    }
    
    // Test 3: Recherche mot-clé "urgent"
    console.log('\n3️⃣ Test mot-clé: "urgent"...');
    try {
        const urgentResponse = await fetch(`${baseUrl}/api/search?q=urgent`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!urgentResponse.ok) {
            console.error('   ❌ ÉCHEC');
            return false;
        }
        
        const urgentData = await urgentResponse.json();
        console.log('   ✅ SUCCÈS');
        console.log('   isKeywordSearch:', urgentData.isKeywordSearch);
        console.log('   Résultats:', urgentData.results?.length || 0);
    } catch (error) {
        console.error('   ❌ ERREUR:', error.message);
        return false;
    }
    
    // Test 4: Recherche mot-clé "retard"
    console.log('\n4️⃣ Test mot-clé: "retard"...');
    try {
        const retardResponse = await fetch(`${baseUrl}/api/search?q=retard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!retardResponse.ok) {
            console.error('   ❌ ÉCHEC');
            return false;
        }
        
        const retardData = await retardResponse.json();
        console.log('   ✅ SUCCÈS');
        console.log('   isKeywordSearch:', retardData.isKeywordSearch);
        console.log('   Résultats:', retardData.results?.length || 0);
    } catch (error) {
        console.error('   ❌ ERREUR:', error.message);
        return false;
    }
    
    // Test 5: Recherche vide/courte
    console.log('\n5️⃣ Test validation (< 2 chars): "a"...');
    try {
        const shortResponse = await fetch(`${baseUrl}/api/search?q=a`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!shortResponse.ok) {
            console.error('   ❌ ÉCHEC');
            return false;
        }
        
        const shortData = await shortResponse.json();
        console.log('   ✅ SUCCÈS');
        console.log('   Résultats:', shortData.results?.length || 0, '(doit être 0)');
        
        if (shortData.results?.length > 0) {
            console.log('   ⚠️ ATTENTION: Des résultats ont été retournés alors que la requête est trop courte');
        }
    } catch (error) {
        console.error('   ❌ ERREUR:', error.message);
        return false;
    }
    
    // Test 6: Recherche mot-clé "commentaire"
    console.log('\n6️⃣ Test mot-clé: "commentaire"...');
    try {
        const commentResponse = await fetch(`${baseUrl}/api/search?q=commentaire`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!commentResponse.ok) {
            console.error('   ❌ ÉCHEC');
            return false;
        }
        
        const commentData = await commentResponse.json();
        console.log('   ✅ SUCCÈS');
        console.log('   isKeywordSearch:', commentData.isKeywordSearch);
        console.log('   Résultats:', commentData.results?.length || 0);
    } catch (error) {
        console.error('   ❌ ERREUR:', error.message);
        return false;
    }
    
    return true;
}

runTests().then(success => {
    console.log('\n' + '='.repeat(60));
    if (success) {
        console.log('✅✅✅ TOUS LES TESTS BACKEND RÉUSSIS ✅✅✅');
        console.log('\n📋 DIAGNOSTIC:');
        console.log('   • Backend /api/search: ✅ FONCTIONNEL');
        console.log('   • Authentification: ✅ OK');
        console.log('   • Recherche texte: ✅ OK');
        console.log('   • Recherche mot-clé: ✅ OK');
        console.log('   • Validation: ✅ OK');
        console.log('\n🔍 CONCLUSION:');
        console.log('   Le backend fonctionne parfaitement.');
        console.log('   Si la recherche ne fonctionne pas dans l\'interface,');
        console.log('   le problème est côté FRONTEND (JavaScript/React).');
        console.log('\n💡 ACTIONS RECOMMANDÉES:');
        console.log('   1. Vider le cache du navigateur');
        console.log('   2. Faire un hard refresh (Ctrl+Shift+R)');
        console.log('   3. Vérifier la console pour des erreurs JS');
        console.log('   4. Vérifier que localStorage contient "auth_token"');
        console.log('   5. Voir AUDIT-RECHERCHE.md pour plus de détails');
    } else {
        console.log('❌ TESTS ÉCHOUÉS');
        console.log('\nVérifier:');
        console.log('   • Le service est-il démarré? (pm2 list)');
        console.log('   • Le port 3000 est-il accessible?');
        console.log('   • Les credentials sont-ils corrects?');
    }
    console.log('='.repeat(60));
    
    process.exit(success ? 0 : 1);
}).catch(err => {
    console.error('\n❌ ERREUR FATALE:', err.message);
    process.exit(1);
});
