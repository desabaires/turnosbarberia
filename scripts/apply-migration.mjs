// Aplica una sola migration por nombre.
// Uso: node scripts/apply-migration.mjs <DATABASE_URL> <migration-file>
import fs from 'node:fs';
import path from 'node:path';
import dns from 'node:dns';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

dns.setDefaultResultOrder('ipv4first');

const url = process.argv[2];
const file = process.argv[3];
if (!url || !file) {
  console.error('Uso: node scripts/apply-migration.mjs <DATABASE_URL> <migration-file>');
  process.exit(1);
}

const require = createRequire(import.meta.url);
const { Client } = require('pg');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sqlPath = path.join(root, 'supabase', 'migrations', file);

const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
console.log('▶ Conectando…');
await client.connect();

console.log(`▶ Aplicando ${file}…`);
const sql = fs.readFileSync(sqlPath, 'utf8');
await client.query(sql);
console.log(`  ✓ ${file} OK`);

await client.end();
console.log('✅ Listo.');
