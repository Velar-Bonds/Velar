// ============================================================
// VELAR — Demo del flujo completo (el bono como token Stellar)
// ============================================================
// Flujo nuevo: la AUTORIDAD (TSE) emite el bono a un usuario; otro usuario
// SOLICITA comprarlo; el DUEÑO acepta (token a la canasta); el comprador
// registra el pago; el VENDEDOR confirma y se libera el token al comprador.
// Uso:  npm run demo:flow   (con la API corriendo: npm run start)
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

console.log('🔑 Iniciando sesión…  (TSE = autoridad; comprador y recomprador = usuarios)');
const [tTse, tComprador, tRecomprador] = await Promise.all([
  login('tse@velar.cr'), login('comprador@velar.cr'), login('recomprador@velar.cr'),
]);
const meComprador = await api('GET', '/users/me', tComprador);
const parties = await api('GET', '/parties', tTse);
const pln = parties.find((p) => p.code === 'PLN');

const bondId = 'DEMO' + Date.now().toString().slice(-6);
console.log(`\n① AUTORIDAD (TSE) emite el bono ${bondId} [partido ${pln.code}] → USUARIO comprador`);
const bond = await api('POST', '/bonds', tTse, {
  bondId, issuerPartyId: pln.id, documentHash: 'sha256:demo', faceValue: 1000000, initialOwner: meComprador.id,
});
const id = bond.token_id;
let oc = await api('GET', `/bonds/${id}/onchain`, tTse);
console.log(`   dueño on-chain: ${tag(oc.onchainHolder)}`);

console.log(`\n② USUARIO recomprador VE el bono disponible y SOLICITA comprarlo`);
const available = await api('GET', '/bonds/available', tRecomprador);
console.log(`   bonos disponibles para el recomprador: ${available.length}`);
const t = await api('POST', '/transfers', tRecomprador, { bondTokenId: id, amount: 950000 });

console.log(`③ El DUEÑO (comprador) acepta vender → el token entra a la CANASTA 🔒`);
await api('PATCH', `/transfers/${t.id}/accept`, tComprador);
oc = await api('GET', `/bonds/${id}/onchain`, tTse);
console.log(`   dueño on-chain: ${tag(oc.onchainHolder)}`);

console.log(`④ El COMPRADOR (recomprador) registra el pago físico`);
await api('PATCH', `/transfers/${t.id}/payment`, tRecomprador, { evidence: 'comprobante-0001' });

console.log(`⑤ El VENDEDOR (comprador) confirma el pago → libera el token al comprador`);
await api('PATCH', `/transfers/${t.id}/release`, tComprador);
oc = await api('GET', `/bonds/${id}/onchain`, tTse);
console.log(`   dueño on-chain: ${tag(oc.onchainHolder)}`);

console.log(`\n✅ LISTO. El bono pasó del primer dueño al recomprador, con el token viajando por la canasta.`);
console.log(`🔗 Vé el bono en la blockchain pública:\n   ${oc.assetExplorer}`);
