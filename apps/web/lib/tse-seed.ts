// Seed data visual para el panel TSE — se usa cuando el backend no devuelve datos
export const SEED_PARTIES = [
  { id: 'p1', name: 'Partido Aurora', code: 'PA' },
  { id: 'p2', name: 'Movimiento Verde', code: 'MV' },
  { id: 'p3', name: 'Frente Nacional', code: 'FN' },
];

export const SEED_BONDS = [
  { token_id: 'b1', bond_id: 'SOL-2026-001', issuer_party_id: 'p1', status: 'activo', face_value: 5_000_000, currency: 'CRC', certificate_number: 'CERT-2026-001', series: 'Serie A', interest_rate: 6.5, issue_date: '2026-01-15', maturity_date: '2027-01-15', parties: { name: 'Partido Aurora', code: 'PA' }, profiles: { full_name: 'Partido Aurora' }, created_at: '2026-01-15T09:14:00Z' },
  { token_id: 'b2', bond_id: 'SOL-2026-002', issuer_party_id: 'p1', status: 'en_venta', face_value: 2_500_000, currency: 'CRC', certificate_number: 'CERT-2026-002', series: 'Serie A', interest_rate: 5.0, issue_date: '2026-02-01', maturity_date: '2027-02-01', parties: { name: 'Partido Aurora', code: 'PA' }, profiles: { full_name: 'María González' }, created_at: '2026-02-01T08:47:00Z' },
  { token_id: 'b3', bond_id: 'SOL-2026-003', issuer_party_id: 'p2', status: 'activo', face_value: 10_000_000, currency: 'CRC', certificate_number: 'CERT-2026-003', series: 'Serie B', interest_rate: null, issue_date: '2026-03-10', maturity_date: '2028-03-10', parties: { name: 'Movimiento Verde', code: 'MV' }, profiles: { full_name: 'Movimiento Verde' }, created_at: '2026-03-10T16:32:00Z' },
  { token_id: 'b4', bond_id: 'SOL-2026-004', issuer_party_id: 'p2', status: 'vendido', face_value: 1_800_000, currency: 'USD', certificate_number: 'CERT-2026-004', series: 'Serie A', interest_rate: 4.75, issue_date: '2026-01-20', maturity_date: '2026-07-20', parties: { name: 'Movimiento Verde', code: 'MV' }, profiles: { full_name: 'Carlos Mora' }, created_at: '2026-01-20T11:02:00Z' },
  { token_id: 'b5', bond_id: 'SOL-2026-005', issuer_party_id: 'p3', status: 'activo', face_value: 7_500_000, currency: 'CRC', certificate_number: 'CERT-2026-005', series: 'Serie C', interest_rate: 7.0, issue_date: '2026-04-05', maturity_date: '2029-04-05', parties: { name: 'Frente Nacional', code: 'FN' }, profiles: { full_name: 'Frente Nacional' }, created_at: '2026-04-05T15:11:00Z' },
];

export const SEED_REQUESTS = [
  { id: 'r1', party_id: 'p1', status: 'pendiente', face_value: 8_000_000, currency: 'CRC', series: 'Serie B', certificate_number: 'CERT-REQ-001', interest_rate: 6.0, issue_date: '2026-05-20', maturity_date: '2028-05-20', created_at: '2026-05-20T09:14:00Z', parties: { name: 'Partido Aurora', code: 'PA' } },
  { id: 'r2', party_id: 'p2', status: 'pendiente', face_value: 3_200_000, currency: 'CRC', series: 'Serie C', certificate_number: 'CERT-REQ-002', interest_rate: 5.5, issue_date: '2026-05-20', maturity_date: '2027-11-20', created_at: '2026-05-20T08:47:00Z', parties: { name: 'Movimiento Verde', code: 'MV' } },
  { id: 'r3', party_id: 'p3', status: 'pendiente', face_value: 15_000_000, currency: 'CRC', series: 'Serie A', certificate_number: 'CERT-REQ-003', interest_rate: null, issue_date: '2026-05-19', maturity_date: '2029-05-19', created_at: '2026-05-19T16:32:00Z', parties: { name: 'Frente Nacional', code: 'FN' } },
  { id: 'r4', party_id: 'p1', status: 'aprobado', face_value: 5_000_000, currency: 'CRC', series: 'Serie A', certificate_number: 'CERT-2026-001', interest_rate: 6.5, created_at: '2026-01-14T10:00:00Z', parties: { name: 'Partido Aurora', code: 'PA' } },
  { id: 'r5', party_id: 'p2', status: 'rechazado', face_value: 20_000_000, currency: 'CRC', series: 'Serie D', rejection_reason: 'Monto excede límite permitido.', created_at: '2026-03-01T14:30:00Z', parties: { name: 'Movimiento Verde', code: 'MV' } },
];

export const SEED_TRANSFERS = [
  { id: 't1', status: 'liberada', amount: 2_500_000, bond_token_id: 'b2', created_at: '2026-02-15T10:05:00Z', bonds: { bond_id: 'SOL-2026-002' }, from_profile: { full_name: 'Partido Aurora' }, to_profile: { full_name: 'María González' } },
  { id: 't2', status: 'liberada', amount: 1_800_000, bond_token_id: 'b4', created_at: '2026-02-20T11:20:00Z', bonds: { bond_id: 'SOL-2026-004' }, from_profile: { full_name: 'Movimiento Verde' }, to_profile: { full_name: 'Carlos Mora' } },
  { id: 't3', status: 'solicitada', amount: 7_500_000, bond_token_id: 'b5', created_at: '2026-05-20T09:00:00Z', bonds: { bond_id: 'SOL-2026-005' }, from_profile: { full_name: 'Frente Nacional' }, to_profile: { full_name: 'Empresa SA' } },
  { id: 't4', status: 'en_escrow', amount: 5_000_000, bond_token_id: 'b1', created_at: '2026-05-19T14:30:00Z', bonds: { bond_id: 'SOL-2026-001' }, from_profile: { full_name: 'Partido Aurora' }, to_profile: { full_name: 'Juan Pérez' } },
];

// Trazabilidad por bono (historial de propietarios)
export const SEED_TRACEABILITY: Record<string, Array<{ owner: string; since: string; until?: string; tx?: string; status: string }>> = {
  'SOL-2026-001': [
    { owner: 'Partido Aurora', since: '2026-01-15T09:14:00Z', status: 'emitido' },
    { owner: 'Partido Aurora', since: '2026-01-15T09:20:00Z', status: 'activo' },
  ],
  'SOL-2026-002': [
    { owner: 'Partido Aurora', since: '2026-02-01T08:47:00Z', status: 'emitido' },
    { owner: 'Partido Aurora', since: '2026-02-01T09:00:00Z', until: '2026-02-15T10:05:00Z', status: 'activo' },
    { owner: 'María González', since: '2026-02-15T10:05:00Z', status: 'en_venta', tx: 'TX-8F3A…7021' },
  ],
  'SOL-2026-003': [
    { owner: 'Movimiento Verde', since: '2026-03-10T16:32:00Z', status: 'activo' },
  ],
  'SOL-2026-004': [
    { owner: 'Movimiento Verde', since: '2026-01-20T11:02:00Z', status: 'emitido' },
    { owner: 'Movimiento Verde', since: '2026-01-20T11:10:00Z', until: '2026-02-20T11:20:00Z', status: 'activo' },
    { owner: 'Carlos Mora', since: '2026-02-20T11:20:00Z', status: 'vendido', tx: 'TX-C29B…4412' },
  ],
  'SOL-2026-005': [
    { owner: 'Frente Nacional', since: '2026-04-05T15:11:00Z', status: 'activo' },
  ],
};
