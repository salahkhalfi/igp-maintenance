/**
 * Script de minification des composants JS Legacy
 * 
 * Minifie tous les fichiers de public/static/js/components/
 * vers public/static/js/dist/
 * 
 * Les originaux ne sont JAMAIS touchés.
 * 
 * Usage: node scripts/minify-legacy.cjs
 */

const { minify } = require('terser');
const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '../public/static/js/components');
const DEST_DIR = path.join(__dirname, '../public/static/js/dist');
const UTILS_DIR = path.join(__dirname, '../public/static/js');

// Fichiers à minifier
const COMPONENT_FILES = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.js'));
const UTIL_FILES = ['utils.js']; // Ajouter d'autres si nécessaire

async function minifyFile(srcPath, destPath) {
    try {
        const code = fs.readFileSync(srcPath, 'utf8');
        const result = await minify(code, {
            compress: {
                drop_console: false, // Garder console.log pour debug
                drop_debugger: true,
                passes: 2
            },
            mangle: {
                reserved: ['React', 'ReactDOM', 'axios', 'marked', 'confetti'] // Ne pas renommer ces globales
            },
            format: {
                comments: false
            }
        });

        if (result.error) {
            console.error(`❌ Erreur ${path.basename(srcPath)}:`, result.error);
            return { success: false, file: srcPath };
        }

        fs.writeFileSync(destPath, result.code);
        
        const originalSize = fs.statSync(srcPath).size;
        const minifiedSize = result.code.length;
        const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(1);
        
        return { 
            success: true, 
            file: path.basename(srcPath),
            original: originalSize,
            minified: minifiedSize,
            savings: savings
        };
    } catch (err) {
        console.error(`❌ Erreur ${path.basename(srcPath)}:`, err.message);
        return { success: false, file: srcPath, error: err.message };
    }
}

async function main() {
    console.log('🔧 Minification des composants Legacy...\n');
    
    // Créer le dossier destination si nécessaire
    if (!fs.existsSync(DEST_DIR)) {
        fs.mkdirSync(DEST_DIR, { recursive: true });
    }

    const results = [];
    let totalOriginal = 0;
    let totalMinified = 0;

    // Minifier les composants
    console.log('📦 Composants:');
    for (const file of COMPONENT_FILES) {
        const srcPath = path.join(SOURCE_DIR, file);
        const destPath = path.join(DEST_DIR, file.replace('.js', '.min.js'));
        const result = await minifyFile(srcPath, destPath);
        results.push(result);
        
        if (result.success) {
            totalOriginal += result.original;
            totalMinified += result.minified;
            console.log(`  ✅ ${result.file} → ${result.savings}% réduit`);
        }
    }

    // Minifier utils.js
    console.log('\n📦 Utilitaires:');
    for (const file of UTIL_FILES) {
        const srcPath = path.join(UTILS_DIR, file);
        if (fs.existsSync(srcPath)) {
            const destPath = path.join(DEST_DIR, file.replace('.js', '.min.js'));
            const result = await minifyFile(srcPath, destPath);
            results.push(result);
            
            if (result.success) {
                totalOriginal += result.original;
                totalMinified += result.minified;
                console.log(`  ✅ ${result.file} → ${result.savings}% réduit`);
            }
        }
    }

    // Résumé
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const totalSavings = ((1 - totalMinified / totalOriginal) * 100).toFixed(1);

    console.log('\n' + '='.repeat(50));
    console.log('📊 RÉSUMÉ:');
    console.log(`  ✅ Fichiers minifiés: ${successCount}`);
    if (failCount > 0) console.log(`  ❌ Erreurs: ${failCount}`);
    console.log(`  📁 Taille originale: ${(totalOriginal / 1024).toFixed(1)} KB`);
    console.log(`  📁 Taille minifiée: ${(totalMinified / 1024).toFixed(1)} KB`);
    console.log(`  🚀 Économie totale: ${totalSavings}% (${((totalOriginal - totalMinified) / 1024).toFixed(1)} KB)`);
    console.log('='.repeat(50));

    // Créer un fichier manifest
    const manifest = {
        generated: new Date().toISOString(),
        files: results.filter(r => r.success).map(r => ({
            original: r.file,
            minified: r.file.replace('.js', '.min.js'),
            savings: r.savings + '%'
        })),
        totalSavings: totalSavings + '%'
    };
    
    fs.writeFileSync(
        path.join(DEST_DIR, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
    );
    console.log('\n✅ Manifest créé: public/static/js/dist/manifest.json');
}

main().catch(console.error);
