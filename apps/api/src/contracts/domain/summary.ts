import {
  BondStatus,
  ContractStatus,
  TransferStatus,
  type BondToken,
  type ClauseCategory,
  type ContractAmount,
  type ContractAttentionFlag,
  type ContractClause,
  type ContractCondition,
  type ContractKeyDate,
  type ContractObligation,
  type ContractPartyRole,
  type ContractSummary,
  type ContractSummaryInput,
  type Transfer,
} from '@velar/types';
import { resolveClauseTemplate } from './template';

/**
 * Derivation of the rich `ContractSummary` (amount, conditions, obligations,
 * key dates, status, attention flags) from real bond/transfer/template data —
 * PURE functions, no I/O. Mirrors the state machine in `docs/AGENTS.md` §4 and
 * the "never fabricate legal text" rule already established by the plain-
 * language reader (#39): every field maps to real input or is explicitly
 * marked `unknown`.
 */

const MS_PER_DAY = 86_400_000;

/** Days between two ISO date/datetime strings (to - from), UTC, fractional part truncated. */
function daysBetween(fromIso: string, toIso: string): number {
  return Math.floor((Date.parse(toIso) - Date.parse(fromIso)) / MS_PER_DAY);
}

const ACTIVE_TRANSFER_STATUSES: TransferStatus[] = [
  TransferStatus.SOLICITADA,
  TransferStatus.ACEPTADA,
  TransferStatus.CONTRAOFERTA,
  TransferStatus.EN_ESCROW,
  TransferStatus.PAGO_REGISTRADO,
  TransferStatus.PAGO_VALIDADO,
  TransferStatus.LIBERADA,
];

/** Most recent transfer that isn't rejected/cancelled, or null if none. */
function latestRelevantTransfer(transfers: Transfer[]): Transfer | null {
  const relevant = transfers.filter((t) => ACTIVE_TRANSFER_STATUSES.includes(t.status));
  if (relevant.length === 0) return null;
  return [...relevant].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0];
}

/** Status of the contract, per the bond/transfer state machine (docs/AGENTS.md §4). */
export function deriveContractStatus(bond: BondToken, transfers: Transfer[]): ContractStatus {
  if (bond.status === BondStatus.CONGELADO) return ContractStatus.CONGELADO;
  if (bond.status === BondStatus.CANCELADO) return ContractStatus.CANCELADO;

  const transfer = latestRelevantTransfer(transfers);
  if (transfer) {
    switch (transfer.status) {
      case TransferStatus.LIBERADA:
        return ContractStatus.LIBERADO;
      case TransferStatus.EN_ESCROW:
      case TransferStatus.PAGO_REGISTRADO:
      case TransferStatus.PAGO_VALIDADO:
        return ContractStatus.EN_ESCROW;
      case TransferStatus.SOLICITADA:
      case TransferStatus.ACEPTADA:
      case TransferStatus.CONTRAOFERTA:
        return ContractStatus.EN_NEGOCIACION;
      default:
        break;
    }
  }

  if (bond.status === BondStatus.ACTIVO || bond.status === BondStatus.EN_VENTA) return ContractStatus.VIGENTE;
  return ContractStatus.BORRADOR;
}

/** Transaction amount: the active transfer's, falling back to the bond's face value. */
export function deriveAmount(bond: BondToken, transfers: Transfer[]): ContractAmount {
  const transfer = latestRelevantTransfer(transfers);
  const value = transfer?.amount ?? bond.faceValue ?? null;
  return {
    value,
    currency: bond.currency ?? null,
    unknown: value === null,
  };
}

const OBLIGATION_TEMPLATES: Partial<Record<ClauseCategory, Array<{ role: ContractPartyRole; description: string }>>> = {
  pago: [
    { role: 'comprador', description: 'Pagar el monto acordado por el medio declarado y registrar la evidencia del pago.' },
  ],
  transferencia: [
    { role: 'vendedor', description: 'Transferir la titularidad del bono una vez cumplidas las condiciones acordadas.' },
  ],
  garantia: [
    { role: 'vendedor', description: 'Mantener el token en custodia (escrow) hasta confirmar el pago recibido.' },
    { role: 'comprador', description: 'Aceptar que el token quede retenido en escrow hasta la confirmación del pago.' },
  ],
  firmas: [
    { role: 'tse', description: 'Registrar y auditar la operación en la bitácora del sistema.' },
  ],
};

const CONDITION_TEMPLATES: Partial<Record<ClauseCategory, string>> = {
  garantia: 'El token permanece en escrow hasta que el Vendedor confirme la recepción del pago.',
  plazo: 'Aplican los plazos o fechas límite declarados en la cláusula correspondiente.',
  incumplimiento: 'El incumplimiento de una de las partes activa las consecuencias descritas en la cláusula correspondiente.',
};

export function deriveObligations(clauses: ContractClause[]): ContractObligation[] {
  const obligations: ContractObligation[] = [];
  for (const clause of clauses) {
    const templates = OBLIGATION_TEMPLATES[clause.category];
    if (!templates) continue;
    templates.forEach((template, index) => {
      obligations.push({
        id: `obl-${clause.id}-${index}`,
        role: template.role,
        description: template.description,
        sourceClauseId: clause.id,
      });
    });
  }
  return obligations;
}

export function deriveConditions(clauses: ContractClause[]): ContractCondition[] {
  const conditions: ContractCondition[] = [];
  for (const clause of clauses) {
    const description = CONDITION_TEMPLATES[clause.category];
    if (!description) continue;
    conditions.push({ id: `cond-${clause.id}`, description, sourceClauseId: clause.id });
  }
  return conditions;
}

export function deriveKeyDates(input: ContractSummaryInput): ContractKeyDate[] {
  const { bond, version } = input;
  const dates: ContractKeyDate[] = [
    {
      id: 'kd-issue',
      kind: 'issue_date',
      label: 'Fecha de emisión',
      date: bond.issueDate ?? null,
      unknown: !bond.issueDate,
    },
    {
      id: 'kd-maturity',
      kind: 'maturity_date',
      label: 'Fecha de vencimiento',
      date: bond.maturityDate ?? null,
      unknown: !bond.maturityDate,
    },
    {
      id: 'kd-version-published',
      kind: 'version_published',
      label: 'Publicación de la versión del contrato',
      date: version.publishedAt ?? null,
      unknown: !version.publishedAt,
    },
  ];

  const transfer = latestRelevantTransfer(input.transfers);
  if (transfer) {
    dates.push({
      id: 'kd-transfer-requested',
      kind: 'transfer_requested',
      label: 'Solicitud de transferencia',
      date: transfer.createdAt,
      unknown: false,
    });
    dates.push({
      id: 'kd-transfer-updated',
      kind: 'transfer_last_update',
      label: 'Último cambio de estado de la transferencia',
      date: transfer.updatedAt,
      unknown: false,
    });
    if (transfer.status === TransferStatus.LIBERADA) {
      dates.push({
        id: 'kd-released',
        kind: 'released',
        label: 'Fecha de liberación',
        date: transfer.updatedAt,
        unknown: false,
      });
    }
  }

  return dates;
}

const APPROACHING_MATURITY_DAYS = 30;
const STALLED_ESCROW_DAYS = 14;

export function deriveAttentionFlags(input: ContractSummaryInput): ContractAttentionFlag[] {
  const { bond, transfers, now } = input;
  const flags: ContractAttentionFlag[] = [];

  if (bond.status === BondStatus.CONGELADO) {
    flags.push({
      id: 'flag-frozen',
      severity: 'critical',
      kind: 'frozen',
      message: 'El bono está congelado por el TSE: no se puede transferir hasta que se descongele.',
    });
  }

  if (bond.maturityDate) {
    const daysToMaturity = daysBetween(now, bond.maturityDate);
    if (daysToMaturity >= 0 && daysToMaturity <= APPROACHING_MATURITY_DAYS) {
      flags.push({
        id: 'flag-approaching-maturity',
        severity: 'warning',
        kind: 'approaching_maturity',
        message: `El bono vence en ${daysToMaturity} día(s) (${bond.maturityDate}).`,
      });
    } else if (daysToMaturity < 0 && bond.status !== BondStatus.CANCELADO) {
      flags.push({
        id: 'flag-maturity-passed',
        severity: 'critical',
        kind: 'maturity_passed',
        message: `La fecha de vencimiento (${bond.maturityDate}) ya pasó.`,
      });
    }
  } else {
    flags.push({
      id: 'flag-missing-maturity',
      severity: 'info',
      kind: 'missing_key_dates',
      message: 'El bono no tiene fecha de vencimiento registrada.',
    });
  }

  const transfer = latestRelevantTransfer(transfers);
  if (transfer && (transfer.status === TransferStatus.EN_ESCROW || transfer.status === TransferStatus.PAGO_REGISTRADO)) {
    const daysStalled = daysBetween(transfer.updatedAt, now);
    if (daysStalled > STALLED_ESCROW_DAYS) {
      flags.push({
        id: 'flag-stalled-escrow',
        severity: 'warning',
        kind: 'stalled_escrow',
        message: `La transferencia lleva ${daysStalled} días sin avanzar en escrow (estado "${transfer.status}").`,
      });
    }
  }

  if (transfer?.amount != null && bond.faceValue != null && transfer.amount !== bond.faceValue) {
    flags.push({
      id: 'flag-amount-mismatch',
      severity: 'info',
      kind: 'amount_mismatch',
      message: `El monto de la transferencia (${transfer.amount}) difiere del valor facial del bono (${bond.faceValue}).`,
    });
  }

  return flags;
}

/** Resolves the version's clauses into the reader-facing `ContractClause[]` shape. */
export function deriveClauses(input: ContractSummaryInput): ContractClause[] {
  return input.version.clauses.map((clause, index) => {
    const { text } = resolveClauseTemplate(clause.bodyTemplate, input.params);
    return {
      id: clause.id,
      order: index + 1,
      title: clause.title,
      category: clause.category,
      legalText: text,
      references: clause.parameters.length > 0 ? clause.parameters : undefined,
    };
  });
}

/** Derives the full `ContractSummary` for a bond. Deterministic given `input.now`. */
export function deriveContractSummary(input: ContractSummaryInput): ContractSummary {
  const clauses = deriveClauses(input);

  return {
    bondId: input.bond.bondId,
    contractId: `contract-${input.bond.bondId}`,
    title: input.template.name,
    version: `v${input.version.versionNumber}`,
    clauses,
    generatedAt: input.now,
    country: input.template.country,
    amount: deriveAmount(input.bond, input.transfers),
    conditions: deriveConditions(clauses),
    obligations: deriveObligations(clauses),
    keyDates: deriveKeyDates(input),
    status: deriveContractStatus(input.bond, input.transfers),
    attentionFlags: deriveAttentionFlags(input),
  };
}
