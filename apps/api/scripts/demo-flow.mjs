// ============================================================
// VELAR — Demo del flujo completo (el bono como token Stellar)
// ============================================================
// TSE emite un bono A NOMBRE del partido PLN; un USUARIO lo solicita; el
// PARTIDO acepta (token a la canasta); el usuario paga; el partido confirma
// y se libera el token al usuario. Uso: npm run demo:flow (con la API arriba).
// ============================================================
const API = process.env.API_URL || 'http://localhost:3001/api';
const SUPA = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_JknXcCiIpETjRHEEhHUbBg_r0cCNo9y';
const PASS = process.env.DEMO_PASSWORD || 'Velar12345!';

const jj = async (r) => { const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(JSON.stringify(d)); return d; };
const login = (email) => fetch(`${SUPA}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: PASS }) }).then(jj).then(x => x.access_token);
const api = (m, p, tok, body) => fetch(API + p, { method: m, headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).then(jj);
const short = (a) => (a ? a.slice(0, 8) + '…' : '(nadie)');

console.log('🔑 Login: TSE (autoridad), PARTIDO (PLN = emisor@velar.cr), USUARIO (recomprador)');
const [tse, partido, usuario] = await Promise.all([login('tse@velar.cr'), login('emisor@velar.cr'), login('recomprador@velar.cr')]);
const parties = await api('GET', '/parties', tse);
const pln = parties.find((p) => p.code === 'PLN');

const bondId = 'DEMO' + Date.now().toString().slice(-6);
console.log(`\n① TSE emite el bono ${bondId} a nombre del PARTIDO ${pln.code}`);
const bond = await api('POST', '/bonds', tse, { bondId, issuerPartyId: pln.id, documentHash: 'sha256:demo', faceValue: 1000000 });
let oc = await api('GET', `/bonds/${bond.token_id}/onchain`, tse);
console.log('   dueño on-chain:', short(oc.onchainHolder), '(= el partido)');

console.log('\n② El USUARIO ve el bono en venta y lo solicita');
const avail = await api('GET', '/bonds/available', usuario);
console.log('   bonos en venta para el usuario:', avail.length);
const t = await api('POST', '/transfers', usuario, { bondTokenId: bond.token_id, amount: 950000 });

console.log('③ El PARTIDO acepta la venta → token a la CANASTA 🔒');
await api('PATCH', `/transfers/${t.id}/accept`, partido);
oc = await api('GET', `/bonds/${bond.token_id}/onchain`, tse);
console.log('   dueño on-chain:', short(oc.onchainHolder), '(= escrow)');

console.log('④ El USUARIO registra el pago físico');
await api('PATCH', `/transfers/${t.id}/payment`, usuario, { evidence: 'comprobante-0001' });

console.log('⑤ El PARTIDO confirma el pago → libera el token al usuario');
await api('PATCH', `/transfers/${t.id}/release`, partido);
oc = await api('GET', `/bonds/${bond.token_id}/onchain`, tse);
console.log('   dueño on-chain:', short(oc.onchainHolder), '(= el usuario)');

console.log(`\n✅ LISTO. El bono pasó del partido al usuario, con el token viajando por la canasta.`);
console.log(`🔗 ${oc.assetExplorer}`);
