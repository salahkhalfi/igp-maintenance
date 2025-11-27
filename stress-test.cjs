#!/usr/bin/env node
/**
 * STRESS TEST SUITE - IGP Maintenance v2.9.13
 * Tests de charge pour identifier les bottlenecks de performance
 */

const autocannon = require('autocannon');
const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:3000';
const RESULTS_FILE = 'STRESS_TEST_RESULTS_v2.9.13.md';

// Résultats globaux
const results = {
  timestamp: new Date().toISOString(),
  version: 'v2.9.13',
  tests: []
};

/**
 * Formater les résultats autocannon
 */
function formatResult(name, result) {
  return {
    name,
    duration: `${result.duration}s`,
    requests: {
      total: result.requests.total,
      average: result.requests.average,
      mean: result.requests.mean,
      p99: result.latency.p99,
      p999: result.latency.p999
    },
    latency: {
      mean: `${result.latency.mean}ms`,
      p50: `${result.latency.p50}ms`,
      p95: `${result.latency.p95}ms`,
      p99: `${result.latency.p99}ms`,
      p999: `${result.latency.p999}ms`,
      max: `${result.latency.max}ms`
    },
    throughput: {
      mean: `${(result.throughput.mean / 1024 / 1024).toFixed(2)} MB/s`,
      total: `${(result.throughput.total / 1024 / 1024).toFixed(2)} MB`
    },
    errors: result.errors,
    timeouts: result.timeouts,
    non2xx: result.non2xx || 0
  };
}

/**
 * Test 1: Page principale (GET /)
 */
async function testHomePage() {
  console.log('\n🔥 TEST 1: Page Principale (GET /)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const result = await autocannon({
    url: BASE_URL,
    connections: 50,
    duration: 10,
    pipelining: 1,
    title: 'Home Page Load Test'
  });
  
  results.tests.push(formatResult('Page Principale (GET /)', result));
  console.log(`✅ Requêtes: ${result.requests.total} | Latence moyenne: ${result.latency.mean}ms`);
}

/**
 * Test 2: API Stats (GET /api/stats/active-tickets)
 */
async function testStatsAPI() {
  console.log('\n🔥 TEST 2: API Stats Active Tickets');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const result = await autocannon({
    url: `${BASE_URL}/api/stats/active-tickets`,
    connections: 100,
    duration: 15,
    pipelining: 1,
    title: 'Stats API Load Test'
  });
  
  results.tests.push(formatResult('API Stats Active Tickets', result));
  console.log(`✅ Requêtes: ${result.requests.total} | Latence moyenne: ${result.latency.mean}ms`);
}

/**
 * Test 3: API Tickets (GET /api/tickets)
 */
async function testTicketsAPI() {
  console.log('\n🔥 TEST 3: API Tickets (GET /api/tickets)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const result = await autocannon({
    url: `${BASE_URL}/api/tickets`,
    connections: 80,
    duration: 15,
    pipelining: 1,
    title: 'Tickets API Load Test'
  });
  
  results.tests.push(formatResult('API Tickets (GET)', result));
  console.log(`✅ Requêtes: ${result.requests.total} | Latence moyenne: ${result.latency.mean}ms`);
}

/**
 * Test 4: API Machines (GET /api/machines)
 */
async function testMachinesAPI() {
  console.log('\n🔥 TEST 4: API Machines (GET /api/machines)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const result = await autocannon({
    url: `${BASE_URL}/api/machines`,
    connections: 60,
    duration: 10,
    pipelining: 1,
    title: 'Machines API Load Test'
  });
  
  results.tests.push(formatResult('API Machines (GET)', result));
  console.log(`✅ Requêtes: ${result.requests.total} | Latence moyenne: ${result.latency.mean}ms`);
}

/**
 * Test 5: Fichiers statiques (GET /favicon.ico)
 */
async function testStaticFiles() {
  console.log('\n🔥 TEST 5: Fichiers Statiques (favicon.ico)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const result = await autocannon({
    url: `${BASE_URL}/favicon.ico`,
    connections: 200,
    duration: 10,
    pipelining: 5,
    title: 'Static Files Load Test'
  });
  
  results.tests.push(formatResult('Fichiers Statiques (favicon.ico)', result));
  console.log(`✅ Requêtes: ${result.requests.total} | Latence moyenne: ${result.latency.mean}ms`);
}

/**
 * Test 6: Charge mixte (multiple endpoints)
 */
async function testMixedLoad() {
  console.log('\n🔥 TEST 6: Charge Mixte (Multiple Endpoints)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const result = await autocannon({
    url: BASE_URL,
    connections: 100,
    duration: 20,
    requests: [
      { path: '/' },
      { path: '/api/stats/active-tickets' },
      { path: '/api/tickets' },
      { path: '/api/machines' },
      { path: '/api/users' },
      { path: '/favicon.ico' }
    ],
    title: 'Mixed Load Test'
  });
  
  results.tests.push(formatResult('Charge Mixte (6 endpoints)', result));
  console.log(`✅ Requêtes: ${result.requests.total} | Latence moyenne: ${result.latency.mean}ms`);
}

/**
 * Générer le rapport Markdown
 */
function generateReport() {
  let report = `# 🔥 STRESS TEST RESULTS - v2.9.13
**Date**: ${new Date(results.timestamp).toLocaleString('fr-FR')}  
**URL Testée**: ${BASE_URL}  
**Version**: ${results.version}

---

## 📊 RÉSUMÉ EXÉCUTIF

`;

  // Tableau récapitulatif
  report += `| Test | Requêtes Totales | Latence Moyenne | P95 | P99 | Erreurs |\n`;
  report += `|------|------------------|-----------------|-----|-----|--------|\n`;
  
  results.tests.forEach(test => {
    report += `| ${test.name} | ${test.requests.total.toLocaleString()} | ${test.latency.mean} | ${test.latency.p95} | ${test.latency.p99} | ${test.errors} |\n`;
  });

  report += `\n---\n\n## 📈 DÉTAILS PAR TEST\n\n`;

  // Détails pour chaque test
  results.tests.forEach((test, index) => {
    report += `### Test ${index + 1}: ${test.name}\n\n`;
    report += `**Durée**: ${test.duration}\n\n`;
    
    report += `#### Requêtes\n`;
    report += `- **Total**: ${test.requests.total.toLocaleString()}\n`;
    report += `- **Moyenne/sec**: ${test.requests.average.toFixed(2)}\n`;
    report += `- **Mean**: ${test.requests.mean.toFixed(2)}\n\n`;
    
    report += `#### Latence\n`;
    report += `- **Moyenne**: ${test.latency.mean}\n`;
    report += `- **P50 (médiane)**: ${test.latency.p50}\n`;
    report += `- **P95**: ${test.latency.p95}\n`;
    report += `- **P99**: ${test.latency.p99}\n`;
    report += `- **P99.9**: ${test.latency.p999}\n`;
    report += `- **Max**: ${test.latency.max}\n\n`;
    
    report += `#### Débit\n`;
    report += `- **Moyen**: ${test.throughput.mean}\n`;
    report += `- **Total**: ${test.throughput.total}\n\n`;
    
    report += `#### Erreurs\n`;
    report += `- **Erreurs**: ${test.errors}\n`;
    report += `- **Timeouts**: ${test.timeouts}\n`;
    report += `- **Non-2xx**: ${test.non2xx}\n\n`;
    
    report += `---\n\n`;
  });

  // Analyse et recommandations
  report += `## 🎯 ANALYSE ET RECOMMANDATIONS\n\n`;
  
  const avgLatencies = results.tests.map(t => parseFloat(t.latency.mean));
  const maxLatency = Math.max(...avgLatencies);
  const minLatency = Math.min(...avgLatencies);
  
  report += `### Performance Globale\n`;
  report += `- **Latence minimale**: ${minLatency.toFixed(2)}ms\n`;
  report += `- **Latence maximale**: ${maxLatency.toFixed(2)}ms\n`;
  report += `- **Ratio**: ${(maxLatency / minLatency).toFixed(2)}x\n\n`;
  
  report += `### Seuils de Performance\n`;
  report += `| Catégorie | Seuil | Statut |\n`;
  report += `|-----------|-------|--------|\n`;
  
  results.tests.forEach(test => {
    const latency = parseFloat(test.latency.mean);
    let status = '✅ Excellent';
    if (latency > 100) status = '🟡 Acceptable';
    if (latency > 500) status = '🟠 À surveiller';
    if (latency > 1000) status = '🔴 Critique';
    
    report += `| ${test.name} | ${test.latency.mean} | ${status} |\n`;
  });
  
  report += `\n### Recommandations\n\n`;
  
  const hasErrors = results.tests.some(t => t.errors > 0 || t.non2xx > 0);
  const hasSlowEndpoints = results.tests.some(t => parseFloat(t.latency.mean) > 500);
  
  if (hasErrors) {
    report += `- ⚠️ **Erreurs détectées**: Investiguer les endpoints avec erreurs\n`;
  }
  
  if (hasSlowEndpoints) {
    report += `- 🟠 **Latence élevée**: Optimiser les endpoints >500ms\n`;
  }
  
  if (!hasErrors && !hasSlowEndpoints) {
    report += `- ✅ **Performance optimale**: Tous les endpoints sont rapides (<500ms)\n`;
    report += `- ✅ **0 erreur**: Aucune erreur détectée durant le test\n`;
    report += `- ✅ **Prêt pour production**: L'application peut gérer la charge testée\n`;
  }
  
  report += `\n---\n\n`;
  report += `## 🏆 CONCLUSION\n\n`;
  report += `Version **v2.9.13** testée sous charge.\n\n`;
  report += `**Métriques Clés**:\n`;
  report += `- ✅ Total requêtes traitées: ${results.tests.reduce((sum, t) => sum + t.requests.total, 0).toLocaleString()}\n`;
  report += `- ✅ Latence moyenne globale: ${(avgLatencies.reduce((a, b) => a + b, 0) / avgLatencies.length).toFixed(2)}ms\n`;
  report += `- ✅ Taux d'erreur: ${(results.tests.reduce((sum, t) => sum + t.errors + t.non2xx, 0) / results.tests.reduce((sum, t) => sum + t.requests.total, 0) * 100).toFixed(3)}%\n`;
  
  return report;
}

/**
 * Exécution principale
 */
async function runAllTests() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║  🔥 STRESS TEST SUITE - IGP Maintenance v2.9.13     ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');
  
  console.log(`📍 URL cible: ${BASE_URL}`);
  console.log(`📅 Date: ${new Date().toLocaleString('fr-FR')}`);
  console.log(`⏱️  Durée estimée: ~2 minutes\n`);
  
  try {
    await testHomePage();
    await testStatsAPI();
    await testTicketsAPI();
    await testMachinesAPI();
    await testStaticFiles();
    await testMixedLoad();
    
    console.log('\n\n✅ TOUS LES TESTS TERMINÉS !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Générer le rapport
    const report = generateReport();
    fs.writeFileSync(RESULTS_FILE, report);
    
    console.log(`📄 Rapport généré: ${RESULTS_FILE}`);
    console.log(`📊 Total requêtes: ${results.tests.reduce((sum, t) => sum + t.requests.total, 0).toLocaleString()}`);
    
    // Afficher résumé
    console.log('\n📊 RÉSUMÉ:');
    results.tests.forEach(test => {
      const latency = parseFloat(test.latency.mean);
      const icon = latency < 100 ? '✅' : latency < 500 ? '🟡' : '🔴';
      console.log(`  ${icon} ${test.name}: ${test.requests.total.toLocaleString()} req | ${test.latency.mean}`);
    });
    
  } catch (error) {
    console.error('\n❌ ERREUR durant le stress test:', error.message);
    process.exit(1);
  }
}

// Lancer les tests
runAllTests().catch(console.error);
