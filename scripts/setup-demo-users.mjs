// Crea/asegura las 2 cuentas demo del shop barberia-demo y limpia datos
// transaccionales (turnos, ventas, egresos) del shop demo.
//
// Uso:
//   node --env-file=.env.production.local scripts/setup-demo-users.mjs
//
// Idempotente: corrédolo cuantas veces quieras. Si las cuentas ya existen,
// resetea password y reasegura sus profiles + shop_members.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
  console.error('Corré con: node --env-file=.env.production.local scripts/setup-demo-users.mjs');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const PASSWORD = 'Demo1234';

const OWNER = {
  email: 'dueno.demo@turnosbarberia.app',
  name:  'Dueño Demo',
  phone: '+5491111111111',
  isAdmin: true
};

const CLIENT = {
  email: 'cliente.demo@turnosbarberia.app',
  name:  'Cliente Demo',
  phone: '+5491122222222',
  isAdmin: false
};

const SHOP_SLUG = 'barberia-demo';

async function findUserByEmail(email) {
  // listUsers no filtra server-side, paginamos.
  let page = 1;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < 200) return null;
    page += 1;
    if (page > 20) return null;
  }
}

async function ensureUser({ email, name, phone }) {
  let user = await findUserByEmail(email);
  if (user) {
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { name, phone }
    });
    if (error) throw error;
    console.log(`  ✓ user existente reseteado: ${email}`);
    return user;
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { name, phone }
  });
  if (error) throw error;
  console.log(`  ✓ user creado: ${email}`);
  return data.user;
}

async function main() {
  console.log('▶ Buscando shop barberia-demo…');
  const { data: shop, error: shopErr } = await supabase
    .from('shops')
    .select('id, slug, name, is_active, plan')
    .eq('slug', SHOP_SLUG)
    .maybeSingle();
  if (shopErr) throw shopErr;
  if (!shop) {
    console.error(`  ✗ Shop "${SHOP_SLUG}" no encontrado. Asegurá que las migrations corrieron.`);
    process.exit(1);
  }
  console.log(`  ✓ shop_id = ${shop.id} · is_active=${shop.is_active} · plan=${shop.plan}`);

  if (!shop.is_active || shop.plan !== 'pro') {
    console.log('▶ Activando shop + plan pro (para mostrar todas las features)…');
    const { error } = await supabase
      .from('shops')
      .update({ is_active: true, plan: 'pro' })
      .eq('id', shop.id);
    if (error) throw error;
    console.log('  ✓ shop activado y seteado a plan pro');
  }

  console.log('▶ Asegurando demo users…');
  const ownerUser  = await ensureUser(OWNER);
  const clientUser = await ensureUser(CLIENT);

  console.log('▶ Upsert profiles…');
  const profileRows = [
    { id: ownerUser.id,  name: OWNER.name,  email: OWNER.email,  phone: OWNER.phone,  is_admin: true,  shop_id: shop.id },
    { id: clientUser.id, name: CLIENT.name, email: CLIENT.email, phone: CLIENT.phone, is_admin: false, shop_id: shop.id }
  ];
  const { error: profErr } = await supabase
    .from('profiles')
    .upsert(profileRows, { onConflict: 'id' });
  if (profErr) throw profErr;
  console.log('  ✓ profiles seteados (is_admin + shop_id)');

  console.log('▶ Upsert shop_members (owner)…');
  const { error: memErr } = await supabase
    .from('shop_members')
    .upsert(
      [{ profile_id: ownerUser.id, shop_id: shop.id, role: 'owner' }],
      { onConflict: 'profile_id,shop_id' }
    );
  if (memErr) throw memErr;
  console.log('  ✓ shop_member owner asegurado');

  // Asegurar que el shop tenga owner_id seteado al demo owner
  if (!shop.owner_id || shop.owner_id !== ownerUser.id) {
    console.log('▶ Seteando shops.owner_id al demo owner…');
    const { error } = await supabase
      .from('shops')
      .update({ owner_id: ownerUser.id })
      .eq('id', shop.id);
    if (error) console.warn('  ⚠ no se pudo setear owner_id (probablemente ya está):', error.message);
    else console.log('  ✓ owner_id seteado');
  }

  console.log('▶ Limpiando datos transaccionales del shop demo…');
  const tables = [
    { name: 'sales',        col: 'shop_id' },
    { name: 'expenses',     col: 'shop_id' },
    { name: 'appointments', col: 'shop_id' }
  ];
  for (const t of tables) {
    const { error, count } = await supabase
      .from(t.name)
      .delete({ count: 'exact' })
      .eq(t.col, shop.id);
    if (error) {
      console.warn(`  ⚠ no se pudo limpiar ${t.name}: ${error.message}`);
    } else {
      console.log(`  ✓ ${t.name} limpiado (${count ?? 0} filas)`);
    }
  }

  console.log('');
  console.log('✅ Listo. Credenciales demo:');
  console.log(`   Dueño:   ${OWNER.email}  /  ${PASSWORD}`);
  console.log(`   Cliente: ${CLIENT.email}  /  ${PASSWORD}`);
  console.log(`   Shop:    /${SHOP_SLUG}`);
}

main().catch((err) => {
  console.error('❌ Error:', err.message || err);
  process.exit(1);
});
