import fs from 'fs';
import path from 'path';
const configPath = path.join(process.cwd(), 'wrangler.jsonc');
if (!fs.existsSync(configPath)) {
    console.error('❌ wrangler.jsonc not found!');
    process.exit(1);
}
try {
    const rawContent = fs.readFileSync(configPath, 'utf-8');
    // Simple regex to strip comments (// and /* */)
    const jsonContent = rawContent
        .replace(/\/\/.*$/gm, '') // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
    const config = JSON.parse(jsonContent);
    const requiredFields = ['name', 'main', 'compatibility_date', 'd1_databases'];
    const missingFields = [];
    for (const field of requiredFields) {
        if (!config[field]) {
            missingFields.push(field);
        }
    }
    if (config.d1_databases && Array.isArray(config.d1_databases)) {
        const d1 = config.d1_databases[0];
        if (!d1.binding || !d1.database_id) {
            console.error('❌ Invalid D1 configuration. "binding" and "database_id" are required.');
            process.exit(1);
        }
        if (d1.database_id === 'REPLACE_WITH_YOUR_D1_DATABASE_ID') {
            console.warn('⚠️  Warning: D1 database_id is set to placeholder.');
        }
    }
    else {
        missingFields.push('d1_databases');
    }
    if (missingFields.length > 0) {
        console.error(`❌ Missing required fields: ${missingFields.join(', ')}`);
        process.exit(1);
    }
    if (!config.main.endsWith('.ts') && !config.main.endsWith('.js')) {
        console.error('❌ "main" must point to a .ts or .js file');
        process.exit(1);
    }
    console.log('✅ Configuration is valid!');
    process.exit(0);
}
catch (error) {
    console.error('❌ Error parsing wrangler.jsonc:', error);
    process.exit(1);
}
