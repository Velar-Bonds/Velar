// ============================================================
// VELAR — Demo del flujo completo (el bono como token Stellar)
// ============================================================
// Emite un bono NUEVO como token real en Stellar testnet y corre todo el
// ciclo vía la API: emisión → transferencia → canasta(escrow) → pago →
// validación → liberación. Muestra el dueño on-chain en cada paso y los
// links al explorador público (stellar.expert).
//
// Requisitos: API corriendo (npm run start) + wallets provisionadas
//   (npm run provision:wallets) + datos demo (npm run seed).
// Uso:  npm run demo:flow
// ============================================================
import w from '../.stellar-wallets.json' with { type: 'json' };

const API = process.env.API_URL || 'http://localhost:3001/api';
const SUPA = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_JknXcCiIpETjRHEEhHUbBg_r0cCNo9y';
const PASS = process.env.DEMO_PASSWORD || 'Velar12345!';

async function login(email) {
  const r = await fetch(`${SUPA}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASS }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('login falló ' + email + ': ' + JSON.stringify(j));
  return j.access_token;
}
const H = (t) => ({ Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' });
const api = async (m, path, tok, body) => {
  const r = await fetch(API + path, { method: m, headers: H(tok), body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${m} ${path} -> ${r.status}: ${JSON.stringify(j)}`);
  return j;
};
const tag = (addr) => {
  for (const [name, v] of Object.entries(w)) if (v.publicKey === addr) return name.toUpperCase();
  return addr ? addr.slice(0, 6) + '…' : '(nadie)';
};

console.log('🔑 Iniciando sesión como cada rol…');
const [tEmisor, tComprador, tRecomprador, tValidador, tTse] = await Promise.all([
  login('emisor@velar.cr'), login('comprador@velar.cr'),
  login('recomprador@velar.cr'), login('validador@velar.cr'), login('tse@velar.cr'),
]);

const meComprador = await api('GET', '/users/me', tComprador);
const meRecomprador = await api('GET', '/users/me', tRecomprador);
const parties = await api('GET', '/parties', tEmisor);
const pln = parties.find((p) => p.code === 'PLN');

const bondId = 'DEMO' + Date.now().toString().slice(-6);
console.log(`\n① EMISOR emite el bono ${bondId} como TOKEN en Stellar → COMPRADOR`);
const bond = await api('POST', '/bonds', tEmisor, {
  bondId, issuerPartyId: pln.id, documentHash: 'sha256:demo-doc', faceValue: 1000000,
  initialOwner: meComprador.id,
});
const id = bond.token_id;
let oc = await api('GET', `/bonds/${id}/onchain`, tTse);
console.log(`   dueño on-chain: ${tag(oc.onchainHolder)}`);

console.log(`\n② COMPRADOR solicita transferir el bono → RECOMPRADOR`);
const t = await api('POST', '/transfers', tComprador, { bondTokenId: id, toOwner: meRecomprador.id, amount: 950000 });

console.log(`③ RECOMPRADOR acepta → el TOKEN entra a la CANASTA (escrow) 🔒`);
await api('PATCH', `/transfers/${t.id}/accept`, tRecomprador);
oc = await api('GET', `/bonds/${id}/onchain`, tTse);
console.log(`   dueño on-chain: ${tag(oc.onchainHolder)}`);

console.log(`④ RECOMPRADOR registra el pago físico (se guarda el hash de la evidencia)`);
await api('PATCH', `/transfers/${t.id}/payment`, tRecomprador, { evidence: 'comprobante-banco-0001' });

console.log(`⑤ VALIDADOR confirma el pago`);
await api('PATCH', `/transfers/${t.id}/validate`, tValidador);

console.log(`⑥ VALIDADOR libera → el TOKEN sale de la canasta → RECOMPRADOR`);
await api('PATCH', `/transfers/${t.id}/release`, tValidador);
oc = await api('GET', `/bonds/${id}/onchain`, tTse);
console.log(`   dueño on-chain: ${tag(oc.onchainHolder)}`);

console.log(`\n✅ LISTO. El token del bono viajó: COMPRADOR → CANASTA → RECOMPRADOR (todo en blockchain).`);
console.log(`\n🔗 Vé el bono en la blockchain pública:`);
console.log(`   ${oc.assetExplorer}`);
console.log(`\n   (En esa página vas a ver el activo del bono y TODAS sus transacciones reales.)`);
