// Aplica todas las migrations en supabase/migrations/ (en orden) + supabase/seed.sql.
// Uso: node scripts/apply-schema.mjs <DATABASE_URL>
// Donde DATABASE_URL es la "Connection string (URI)" de Settings → Database (con tu password).

import fs from 'node:fs';
import path from 'node:path';
import dns from 'node:dns';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

dns.setDefaultResultOrder('ipv4first');

const url = process.argv[2] || process.env.DATABASE_URL;
if (!url) {
  console.error('❌ Falta DATABASE_URL como argumento o variable de entorno.');
  console.error('   Conseguila en: Supabase → Settings → Database → Connection string (URI)');
  console.error('   Ej: node scripts/apply-schema.mjs "postgresql://postgres:TU_PASS@db.xxxx.supabase.co:5432/postgres"');
  process.exit(1);
}

let pg;
try {
  const require = createRequire(import.meta.url);
  pg = require('pg');
} catch {
  console.error('❌ Falta la dependencia `pg`. Instalala con: npm install pg');
  process.exit(1);
}

const { Client } = pg;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDir = path.join(root, 'supabase', 'migrations');
const seedPath      = path.join(root, 'supabase', 'seed.sql');

const migrationFiles = fs.readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

console.log('▶ Conectando a Supabase…');
await client.connect();

for (const file of migrationFiles) {
  console.log(`▶ Aplicando ${file}…`);
  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
  await client.query(sql);
  console.log(`  ✓ ${file} OK`);
}

console.log('▶ Aplicando seed…');
const seedSql = fs.readFileSync(seedPath, 'utf8');
await client.query(seedSql);
console.log('  ✓ seed OK');

await client.end();
console.log('✅ Listo. Tu base está lista para usar.');
