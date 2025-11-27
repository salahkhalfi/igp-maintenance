#!/usr/bin/env node
/**
 * SAFE STRESS TEST - v2.9.14 Performance Validation
 * Test local uniquement pour éviter ban Cloudflare
 */

const autocannon = require('autocannon');
const fs = require('fs');

// Configuration SAFE
const BASE_URL = 'http://localhost:3000';
const RESULTS_FILE = 'STRESS_TEST_RESULTS_v2.9.14_SAFE.md';

// Résultats
const results = {
  timestamp: new Date().toISOString(),
  version: 'v2.9.14 (with indexes)',
  baseline: 'v2.9.13 (no indexes)',
  tests: []
};

/**
 * Formater les résultats
 */
function formatResult(name, result) {
  return {
    name,
    duration: `${result.duration}s`,
    requests: {
      total: result.requests.total,
      average: result.requests.average,
      mean: result.requests.mean
    },
    latency: {
      mean: `${result.latency.mean}ms`,
      p50: `${result.latency.p50}ms`,
      p95: `${result.latency.p95}ms`,
      p99: `${result.latency.p99}ms`,
      max: `${result.latency.max}ms`
    },
    throughput: {
      mean: `${(result.throughput.mean / 1024 / 1024).toFixed(2)} MB/s`
    },
    errors: result.errors,
    timeouts: result.timeouts
  };
}

/**
 * Test 1: Page principale
 */
async function testHomePage() {
  console.log('\n🔥 TEST 1: Page Principale (GET /)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const result = await autocannon({
    url: BASE_URL,
    connections: 50,
    duration: 10,
    pipelining: 1
  });
  
  results.tests.push(formatResult('Page Principale', result));
  console.log(`✅ ${result.requests.total} req | Latence: ${result.latency.mean}ms`);
}

/**
 * Test 2: API Tickets (CRITIQUE - Baseline: 2,562ms)
 */
async function testTicketsAPI() {
  console.log('\n🔥 TEST 2: API Tickets - VALIDATION INDEXES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Baseline v2.9.13: 2,562ms');
  console.log('Target v2.9.14: 1,000-1,500ms (-40% to -60%)');
  
  const result = await autocannon({
    url: `${BASE_URL}/api/tickets`,
    connections: 80,
    duration: 15,
    pipelining: 1
  });
  
  results.tests.push(formatResult('API Tickets', result));
  
  const improvement = ((2562 - result.latency.mean) / 2562 * 100).toFixed(1);
  const icon = improvement >= 40 ? '✅' : improvement >= 20 ? '🟡' : '🔴';
  
  console.log(`${icon} ${result.requests.total} req | Latence: ${result.latency.mean}ms`);
  console.log(`${icon} Amélioration: ${improvement}% vs baseline`);
}

/**
 * Test 3: API Machines (CRITIQUE - Baseline: 2,320ms)
 */
async function testMachinesAPI() {
  console.log('\n🔥 TEST 3: API Machines - VALIDATION INDEXES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Baseline v2.9.13: 2,320ms');
  console.log('Target v2.9.14: 900-1,400ms (-40% to -60%)');
  
  const result = await autocannon({
    url: `${BASE_URL}/api/machines`,
    connections: 60,
    duration: 10,
    pipelining: 1
  });
  
  results.tests.push(formatResult('API Machines', result));
  
  const improvement = ((2320 - result.latency.mean) / 2320 * 100).toFixed(1);
  const icon = improvement >= 40 ? '✅' : improvement >= 20 ? '🟡' : '🔴';
  
  console.log(`${icon} ${result.requests.total} req | Latence: ${result.latency.mean}ms`);
  console.log(`${icon} Amélioration: ${improvement}% vs baseline`);
}

/**
 * Test 4: API Stats
 */
async function testStatsAPI() {
  console.log('\n🔥 TEST 4: API Stats Active Tickets');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const result = await autocannon({
    url: `${BASE_URL}/api/stats/active-tickets`,
    connections: 100,
    duration: 10,
    pipelining: 1
  });
  
  results.tests.push(formatResult('API Stats', result));
  console.log(`✅ ${result.requests.total} req | Latence: ${result.latency.mean}ms`);
}

/**
 * Générer rapport markdown
 */
function generateReport() {
  let report = `# 🚀 STRESS TEST RESULTS - v2.9.14 (SAFE)
**Date**: ${new Date(results.timestamp).toLocaleString('fr-FR')}  
**URL Testée**: ${BASE_URL} (LOCAL - Safe)  
**Version**: ${results.version}  
**Baseline**: ${results.baseline}

---

## 📊 COMPARAISON v2.9.13 → v2.9.14

### API Tickets (CRITIQUE)
| Version | Latence Moyenne | P95 | P99 | Amélioration |
|---------|-----------------|-----|-----|--------------|
| **v2.9.13** | 2,562ms | - | 5,303ms | Baseline |
| **v2.9.14** | ${results.tests[1]?.latency.mean || 'N/A'} | ${results.tests[1]?.latency.p95 || 'N/A'} | ${results.tests[1]?.latency.p99 || 'N/A'} | `;

  const ticketsImprovement = results.tests[1] ? 
    ((2562 - parseFloat(results.tests[1].latency.mean)) / 2562 * 100).toFixed(1) : 'N/A';
  report += ticketsImprovement !== 'N/A' ? `**${ticketsImprovement}%** ` : 'N/A ';
  report += ticketsImprovement >= 40 ? '✅ |' : ticketsImprovement >= 20 ? '🟡 |' : '🔴 |';
  report += '\n\n';

  report += `### API Machines (CRITIQUE)
| Version | Latence Moyenne | P95 | P99 | Amélioration |
|---------|-----------------|-----|-----|--------------|
| **v2.9.13** | 2,320ms | - | 4,652ms | Baseline |
| **v2.9.14** | ${results.tests[2]?.latency.mean || 'N/A'} | ${results.tests[2]?.latency.p95 || 'N/A'} | ${results.tests[2]?.latency.p99 || 'N/A'} | `;

  const machinesImprovement = results.tests[2] ? 
    ((2320 - parseFloat(results.tests[2].latency.mean)) / 2320 * 100).toFixed(1) : 'N/A';
  report += machinesImprovement !== 'N/A' ? `**${machinesImprovement}%** ` : 'N/A ';
  report += machinesImprovement >= 40 ? '✅ |' : machinesImprovement >= 20 ? '🟡 |' : '🔴 |';
  report += '\n\n';

  report += `---

## 📈 DÉTAILS PAR TEST

`;

  results.tests.forEach((test, index) => {
    report += `### Test ${index + 1}: ${test.name}

**Requêtes**: ${test.requests.total.toLocaleString()} (${test.requests.average.toFixed(2)} req/s)

**Latence**:
- Moyenne: ${test.latency.mean}
- P50: ${test.latency.p50}
- P95: ${test.latency.p95}
- P99: ${test.latency.p99}
- Max: ${test.latency.max}

**Erreurs**: ${test.errors} | **Timeouts**: ${test.timeouts}

---

`;
  });

  report += `## 🏆 CONCLUSION

**Gain Réel Mesuré**:
- API Tickets: ${ticketsImprovement}% amélioration
- API Machines: ${machinesImprovement}% amélioration

**Objectif**: -40% à -60% latence  
**Atteint**: ${ticketsImprovement >= 40 && machinesImprovement >= 40 ? '✅ OUI' : '🟡 Partiel'}

**Status**: ${ticketsImprovement >= 40 ? '✅ Optimisation RÉUSSIE' : '🟡 À améliorer'}
`;

  return report;
}

/**
 * Exécution principale
 */
async function runAllTests() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║  🚀 SAFE STRESS TEST - v2.9.14 Performance          ║');
  console.log('║  Local Only (No Cloudflare Ban Risk)                ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');
  
  console.log(`📍 URL: ${BASE_URL} (LOCAL)`);
  console.log(`📅 Date: ${new Date().toLocaleString('fr-FR')}`);
  console.log(`⏱️  Durée: ~1 minute\n`);
  
  try {
    await testHomePage();
    await testTicketsAPI();
    await testMachinesAPI();
    await testStatsAPI();
    
    console.log('\n\n✅ TOUS LES TESTS TERMINÉS !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const report = generateReport();
    fs.writeFileSync(RESULTS_FILE, report);
    
    console.log(`📄 Rapport: ${RESULTS_FILE}`);
    console.log(`📊 Total requêtes: ${results.tests.reduce((sum, t) => sum + t.requests.total, 0).toLocaleString()}`);
    
    // Afficher gains
    console.log('\n📊 GAINS MESURÉS:');
    const ticketsGain = results.tests[1] ? 
      ((2562 - parseFloat(results.tests[1].latency.mean)) / 2562 * 100).toFixed(1) : 'N/A';
    const machinesGain = results.tests[2] ? 
      ((2320 - parseFloat(results.tests[2].latency.mean)) / 2320 * 100).toFixed(1) : 'N/A';
    
    const ticketsIcon = ticketsGain >= 40 ? '✅' : ticketsGain >= 20 ? '🟡' : '🔴';
    const machinesIcon = machinesGain >= 40 ? '✅' : machinesGain >= 20 ? '🟡' : '🔴';
    
    console.log(`  ${ticketsIcon} API Tickets: ${ticketsGain}% (${results.tests[1]?.latency.mean || 'N/A'})`);
    console.log(`  ${machinesIcon} API Machines: ${machinesGain}% (${results.tests[2]?.latency.mean || 'N/A'})`);
    
  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    process.exit(1);
  }
}

runAllTests().catch(console.error);
