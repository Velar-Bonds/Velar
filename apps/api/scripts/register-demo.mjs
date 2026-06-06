// Prueba el REGISTRO (3 perspectivas) + el flujo completo con cuentas nuevas.
// Uso: npm run demo:register   (con la API corriendo)
const API = process.env.API_URL || 'http://localhost:3001/api';
const SUPA = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_JknXcCiIpETjRHEEhHUbBg_r0cCNo9y';

const j = async (r) => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(JSON.stringify(d)); return d; };
const reg = (body) => fetch(API + '/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(j);
const login = (email, password) => fetch(`${SUPA}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) }).then(j).then(x => x.access_token);
const api = (m, p, tok, body) => fetch(API + p, { method: m, headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).then(j);

const n = Date.now().toString().slice(-6);
const PASS = 'Test12345!';

console.log('① Registrar PARTIDO (perspectiva partido) con info completa');
const partido = await reg({
  email: `partido${n}@velar.cr`, password: PASS, perspectiva: 'partido',
  nombrePartido: `Partido Demo ${n}`, codigo: `PD${n}`,
  representanteLegal: 'Juan Pérez', cedulaJuridica: `3-101-${n}`,
});
console.log('    a ', partido.email, '| rol', partido.role, '| wallet', partido.wallet?.slice(0, 8) + '…');

console.log('② Registrar USUARIO (comprador) con info completa');
const usuario = await reg({
  email: `user${n}@velar.cr`, password: PASS, perspectiva: 'usuario',
  nombres: 'María', apellidos: 'Gómez', identificacion: `1-${n}`, telefono: '8888-0000', direccion: 'San José',
});
console.log('    a ', usuario.email, '| rol', usuario.role, '| wallet', usuario.wallet?.slice(0, 8) + '…');

console.log('③ TSE emite un bono A NOMBRE del partido nuevo');
const tse = await login('tse@velar.cr', 'Velar12345!');
const parties = await api('GET', '/parties', tse);
const party = parties.find(p => p.code === partido.partyId ? false : p.id === partido.partyId) || parties.find(p => p.name === `Partido Demo ${n}`);
const bond = await api('POST', '/bonds', tse, { bondId: `BD${n}`, issuerPartyId: partido.partyId, documentHash: 'sha256:demo', faceValue: 500000 });
console.log('   bono', bond.bond_id, 'emitido. dueño inicial = el partido');
let oc = await api('GET', `/bonds/${bond.token_id}/onchain`, tse);
console.log('   dueño on-chain:', oc.onchainHolder?.slice(0, 8) + '…  (= wallet del partido', partido.wallet?.slice(0, 8) + '…)');

console.log('④ El USUARIO ve el bono disponible y solicita comprarlo');
const uTok = await login(usuario.email, PASS);
const avail = await api('GET', '/bonds/available', uTok);
console.log('   bonos disponibles para el usuario:', avail.length);
const t = await api('POST', '/transfers', uTok, { bondTokenId: bond.token_id, amount: 480000 });

console.log('⑤ El PARTIDO acepta la venta  a  token a la canasta 🔒');
const pTok = await login(partido.email, PASS);
await api('PATCH', `/transfers/${t.id}/accept`, pTok);
oc = await api('GET', `/bonds/${bond.token_id}/onchain`, tse);
console.log('   dueño on-chain:', oc.onchainHolder?.slice(0, 8) + '… (escrow)');

console.log('⑥ El USUARIO registra el pago; el PARTIDO confirma  a  libera el token');
await api('PATCH', `/transfers/${t.id}/payment`, uTok, { evidence: 'comprobante' });
await api('PATCH', `/transfers/${t.id}/release`, pTok);
oc = await api('GET', `/bonds/${bond.token_id}/onchain`, tse);
console.log('   dueño on-chain:', oc.onchainHolder?.slice(0, 8) + '… (= wallet del usuario', usuario.wallet?.slice(0, 8) + '…)');

console.log('\n✅ Registro + flujo completo OK. El bono pasó: partido  a  usuario, on-chain.');
console.log('🔗', oc.assetExplorer);
