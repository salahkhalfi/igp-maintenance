const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const HOME_TS = path.join(__dirname, '../src/views/home.ts');
const DIST_DIR = path.join(__dirname, '../public/static/js/dist');

function getFileHash(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
}

function main() {
    console.log('🔄 Cache busting...');
    
    let homeContent = fs.readFileSync(HOME_TS, 'utf8');
    let updates = 0;
    
    const regex = /(\w+\.min\.js)\?v=([a-z0-9]+)/g;
    
    homeContent = homeContent.replace(regex, (match, filename, oldVersion) => {
        const filePath = path.join(DIST_DIR, filename);
        if (fs.existsSync(filePath)) {
            const newVersion = getFileHash(filePath);
            if (newVersion !== oldVersion) {
                console.log(`  ✅ ${filename}: ${oldVersion} → ${newVersion}`);
                updates++;
                return `${filename}?v=${newVersion}`;
            }
        }
        return match;
    });
    
    if (updates > 0) {
        fs.writeFileSync(HOME_TS, homeContent);
        console.log(`\n✅ ${updates} version(s) updated`);
    } else {
        console.log('\n✅ All versions up to date');
    }
}

main();
