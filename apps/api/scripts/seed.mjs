// ============================================================
// VELAR : Seed de datos demo (idempotente)
// ============================================================
// Crea 6 usuarios (uno por rol), asigna partido al emisor, y precarga
// bonos y transferencias en distintos estados con sus eventos de auditoría.
//
// Uso:  npm run seed   (desde apps/api)
// Requiere apps/api/.env con SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.
// Re-ejecutable: no duplica usuarios ni bonos ya existentes.
// ============================================================

import { WebSocket } from 'ws';
if (typeof globalThis.WebSocket === 'undefined') globalThis.WebSocket = WebSocket;

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('❌ Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno (.env).');
  process.exit(1);
}
const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const PASSWORD = 'Velar12345!';
const USERS = [
  { email: 'admin@velar.cr',       role: 'admin',       full_name: 'Admin del Sistema' },
  { email: 'tse@velar.cr',         role: 'tse',         full_name: 'Auditor TSE' },
  { email: 'emisor@velar.cr',      role: 'emisor',      full_name: 'Partido Emisor (PLN)' },
  { email: 'comprador@velar.cr',   role: 'comprador',   full_name: 'Comprador Inicial' },
  { email: 'recomprador@velar.cr', role: 'recomprador', full_name: 'Recomprador' },
  { email: 'validador@velar.cr',   role: 'validador',   full_name: 'Validador de Pagos' },
];

// UUIDs fijos para idempotencia.
const B = (n) => `00000000-0000-4000-8000-0000000000${n}`;
const T = (n) => `00000000-0000-4000-8000-0000000000${n}`;
const hash = (s) => 'sha256:' + Buffer.from(s).toString('hex').slice(0, 16).padEnd(64, '0');

async function findUserByEmail(email) {
  let page = 1;
  for (;;) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email === email);
    if (hit) return hit;
    if (data.users.length < 200) return null;
    page++;
  }
}

async function ensureUser(u) {
  let user = await findUserByEmail(u.email);
  if (!user) {
    const { data, error } = await db.auth.admin.createUser({
      email: u.email, password: PASSWORD, email_confirm: true,
      user_metadata: { full_name: u.full_name },
    });
    if (error) throw error;
    user = data.user;
    console.log(`  + usuario creado: ${u.email}`);
  } else {
    console.log(`  = usuario ya existe: ${u.email}`);
  }
  // El trigger fuerza rol no privilegiado; aquí seteamos el rol real (service_role bypassa RLS).
  await db.from('profiles').update({ role: u.role, full_name: u.full_name }).eq('id', user.id);
  return user.id;
}

async function bondExists(tokenId) {
  const { data } = await db.from('bonds').select('token_id').eq('token_id', tokenId).maybeSingle();
  return !!data;
}

async function emit(ev) {
  await db.from('audit_events').insert({
    type: ev.type, bond_token_id: ev.bond ?? null, transfer_id: ev.transfer ?? null,
    actor_id: ev.actor ?? null, payload: ev.payload ?? {},
  });
}

async function main() {
  console.log('🌱 VELAR seed : iniciando...');

  // 1) Usuarios
  console.log('\n👤 Usuarios:');
  const id = {};
  for (const u of USERS) id[u.role] = await ensureUser(u);

  // 2) Partido del emisor (PLN)
  const { data: pln } = await db.from('parties').select('id').eq('code', 'PLN').single();
  if (!pln) throw new Error('No existe el partido PLN (¿se aplicó la migración inicial?)');
  await db.from('profiles').update({ party_id: pln.id }).eq('id', id.emisor);
  console.log('\n🏛️  Emisor vinculado al partido PLN');

  // 3) Bonos demo (idempotente por token_id)
  console.log('\n💵 Bonos:');
  const bonds = [
    { token: B('01'), bond_id: 'BOND-001', status: 'activo',     owner: id.comprador,   ev: 'bond_asignado' },
    { token: B('02'), bond_id: 'BOND-002', status: 'activo',     owner: id.comprador,   ev: 'bond_asignado' },
    { token: B('03'), bond_id: 'BOND-003', status: 'en_escrow',  owner: id.comprador,   ev: 'bond_asignado' },
    { token: B('04'), bond_id: 'BOND-004', status: 'activo',     owner: id.recomprador, ev: 'bond_asignado' },
    { token: B('05'), bond_id: 'BOND-005', status: 'congelado',  owner: id.comprador,   ev: 'bond_congelado' },
    { token: B('06'), bond_id: 'BOND-006', status: 'emitido',    owner: null,           ev: null },
  ];
  for (const b of bonds) {
    if (await bondExists(b.token)) { console.log(`  = ${b.bond_id} ya existe`); continue; }
    await db.from('bonds').insert({
      token_id: b.token, bond_id: b.bond_id, issuer_party_id: pln.id,
      current_owner: b.owner, status: b.status,
      document_hash: hash(b.bond_id), face_value: 1000000,
    });
    await emit({ type: 'bond_emitido', bond: b.token, actor: id.emisor, payload: { bondId: b.bond_id } });
    if (b.owner) await emit({ type: 'bond_asignado', bond: b.token, actor: id.emisor, payload: { owner: b.owner } });
    if (b.status === 'congelado') await emit({ type: 'bond_congelado', bond: b.token, actor: id.tse, payload: { motivo: 'Revisión TSE' } });
    console.log(`  + ${b.bond_id} (${b.status})`);
  }

  // 4) Transferencias demo
  console.log('\n🔄 Transferencias:');
  const transfers = [
    // Completada: BOND-004 pasó de comprador -> recomprador
    { id: T('a1'), bond: B('04'), status: 'liberada', amount: 950000, validated: true,
      chain: ['transfer_solicitada','transfer_aceptada','escrow_bloqueado','pago_registrado','pago_validado','token_liberado'] },
    // En progreso: BOND-003 bloqueado en escrow
    { id: T('a2'), bond: B('03'), status: 'en_escrow', amount: 900000, validated: false,
      chain: ['transfer_solicitada','transfer_aceptada','escrow_bloqueado'] },
    // Recién solicitada: BOND-002
    { id: T('a3'), bond: B('02'), status: 'solicitada', amount: 980000, validated: false,
      chain: ['transfer_solicitada'] },
  ];
  for (const t of transfers) {
    const { data: exists } = await db.from('transfers').select('id').eq('id', t.id).maybeSingle();
    if (exists) { console.log(`  = transfer ${t.id.slice(-2)} ya existe`); continue; }
    await db.from('transfers').insert({
      id: t.id, bond_token_id: t.bond, from_owner: id.comprador, to_owner: id.recomprador,
      status: t.status, amount: t.amount,
      payment_evidence_hash: t.chain.includes('pago_registrado') ? hash('pago-' + t.id) : null,
      validated_by: t.validated ? id.validador : null,
    });
    for (const type of t.chain) {
      const actor = type.startsWith('pago_validado') || type === 'token_liberado' ? id.validador
                  : type === 'transfer_aceptada' ? id.recomprador : id.comprador;
      await emit({ type, bond: t.bond, transfer: t.id, actor, payload: {} });
    }
    console.log(`  + transfer ${t.bond_id ?? t.id.slice(-2)} (${t.status})`);
  }

  console.log('\n✅ Seed completo.\n');
  console.log('Credenciales (password para todos): ' + PASSWORD);
  for (const u of USERS) console.log(`  ${u.role.padEnd(12)} ${u.email}`);
}

main().catch((e) => { console.error('❌ Seed falló:', e.message ?? e); process.exit(1); });
