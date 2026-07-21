import type { ContractSummary } from '../contract-model';
import type { GlossaryTerm } from '../contract-reader';

/**
 * Development/testing fixtures for the contract reading experience (issue #39).
 *
 * `contractSummaryFixture` stands in for the structured contract that issue #38
 * will produce (see `contract-model.ts`). These are NOT production data — they
 * exist so the derivation, glossary service, and reader UI can be developed and
 * unit-tested locally with no VELAR database, secrets, or external APIs.
 */

export const contractSummaryFixture: ContractSummary = {
  bondId: 'bond-001',
  contractId: 'contract-001',
  title: 'Contrato de transferencia de bono político',
  version: 'v1',
  generatedAt: '2026-07-01T00:00:00.000Z',
  clauses: [
    {
      id: 'cl-1',
      order: 1,
      title: 'Cláusula 1 — Partes',
      category: 'partes',
      legalText:
        'Comparecen, por una parte, el PARTIDO POLÍTICO identificado en el sistema (en adelante, el "Vendedor"), y por otra parte, la persona COMPRADORA identificada mediante su cuenta verificada (en adelante, el "Comprador").',
      references: ['sellerPartyId', 'buyerId'],
    },
    {
      id: 'cl-2',
      order: 2,
      title: 'Cláusula 2 — Objeto',
      category: 'objeto',
      legalText:
        'El presente contrato tiene por objeto la transferencia de la titularidad del bono político tokenizado, representado por un token único en la red Stellar, del Vendedor al Comprador.',
      references: ['bondId', 'tokenId'],
    },
    {
      id: 'cl-3',
      order: 3,
      title: 'Cláusula 3 — Precio y forma de pago',
      category: 'pago',
      legalText:
        'El precio de la transferencia será el monto acordado entre las partes, pagadero por el Comprador mediante SINPE o transferencia bancaria, quedando registrada la evidencia del pago en el sistema.',
      references: ['price', 'paymentMethod'],
    },
    {
      id: 'cl-4',
      order: 4,
      title: 'Cláusula 4 — Custodia en escrow',
      category: 'garantia',
      legalText:
        'El token permanecerá bajo custodia en un escrow on-chain (Trustless Work) desde la aceptación de la oferta y hasta que el Vendedor confirme la recepción del pago, momento en el cual el token será liberado a favor del Comprador.',
      references: ['escrowAddress'],
    },
    {
      id: 'cl-5',
      order: 5,
      title: 'Cláusula 5 — Jurisdicción',
      category: 'jurisdiccion',
      legalText:
        'Este contrato se rige por las leyes de la República de Costa Rica y por la supervisión del Tribunal Supremo de Elecciones (TSE) en lo que corresponda.',
      references: [],
    },
  ],
};

export const glossaryFixture: GlossaryTerm[] = [
  {
    id: 'g-escrow',
    term: 'escrow',
    definition:
      'Un depósito en garantía: el token queda retenido por un tercero neutral (un contrato en la blockchain) hasta que se cumplan las condiciones acordadas, como la confirmación del pago.',
    locale: 'es',
    aliases: ['custodia', 'depósito en garantía'],
  },
  {
    id: 'g-token',
    term: 'token',
    definition: 'La representación digital única del bono en la red Stellar.',
    locale: 'es',
    aliases: ['token del bono'],
  },
  {
    id: 'g-sinpe',
    term: 'SINPE',
    definition:
      'Sistema Nacional de Pagos Electrónicos de Costa Rica, usado para transferencias de dinero entre cuentas.',
    locale: 'es',
  },
  {
    id: 'g-titularidad',
    term: 'titularidad',
    definition: 'La condición de ser el dueño legal del bono.',
    locale: 'es',
    aliases: ['titular'],
  },
  {
    id: 'g-tse',
    term: 'TSE',
    definition:
      'Tribunal Supremo de Elecciones: la institución que emite los bonos, supervisa las transferencias y audita el historial.',
    locale: 'es',
  },
];
