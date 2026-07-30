/**
 * Primitivas puras de hash-chain para el audit log tamper-evident (#41).
 * Sin DB, sin NestJS, sin Date.now() — solo crypto determinista.
 */
import { createHash } from 'crypto';
import {
  ChainedAuditEvent,
  ChainIntegrityIssue,
  ChainVerificationResult,
} from '@velar/types';

export interface ChainableEventInput {
  chainSeq: number;
  prevHash: string | null;
  type: string;
  bondTokenId: string | null;
  transferId: string | null;
  actorId: string | null;
  payload: unknown;
  txHash: string | null;
  createdAt: string;
}

/** Ordena claves de objetos recursivamente (arrays preservan orden). */
function sortKeysDeep(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  const obj = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = sortKeysDeep(obj[key]);
  }
  return sorted;
}

/** Serialización canónica y determinística (claves ordenadas recursivamente) para el hash. */
export function canonicalize(input: ChainableEventInput): string {
  // Claves en orden fijo; payload se ordena recursivamente.
  const canonical = {
    chainSeq: input.chainSeq,
    prevHash: input.prevHash,
    type: input.type,
    bondTokenId: input.bondTokenId,
    transferId: input.transferId,
    actorId: input.actorId,
    payload: sortKeysDeep(input.payload),
    txHash: input.txHash,
    createdAt: input.createdAt,
  };
  return JSON.stringify(canonical);
}

/** sha256(prevHash + canonical) en hex. prevHash null se trata como cadena vacía. */
export function computeEventHash(prevHash: string | null, canonical: string): string {
  return createHash('sha256')
    .update((prevHash ?? '') + canonical)
    .digest('hex');
}

function toChainableInput(event: ChainedAuditEvent): ChainableEventInput {
  return {
    chainSeq: event.chainSeq as number,
    prevHash: event.prevHash,
    type: event.type,
    bondTokenId: event.bondTokenId,
    transferId: event.transferId,
    actorId: event.actorId,
    payload: event.payload,
    txHash: event.txHash ?? null,
    createdAt: event.createdAt,
  };
}

/**
 * Verifica una cadena de eventos YA ORDENADA por chainSeq ascendente.
 * Solo participan filas con chainSeq no-nulo (las anteriores a la migración de
 * la cadena quedan chainSeq=null y se ignoran silenciosamente — no son un issue).
 * Detecta:
 *  - 'gap': un salto no consecutivo en chainSeq entre dos filas encadenadas consecutivas.
 *  - 'broken_link': prevHash de una fila no coincide con el hash de la fila anterior en la cadena
 *    (o no es null para la primera fila encadenada).
 *  - 'hash_mismatch': el hash almacenado no coincide con el hash recomputado a partir de sus propios campos.
 */
export function verifyChain(events: ChainedAuditEvent[]): ChainVerificationResult {
  const issues: ChainIntegrityIssue[] = [];
  let checkedCount = 0;
  let prevChained: ChainedAuditEvent | null = null;

  for (const event of events) {
    if (event.chainSeq == null) {
      continue;
    }

    checkedCount += 1;

    if (prevChained !== null) {
      const expectedSeq = (prevChained.chainSeq as number) + 1;
      if (event.chainSeq !== expectedSeq) {
        issues.push({
          type: 'gap',
          chainSeq: event.chainSeq,
          message: `Expected chainSeq ${expectedSeq} after ${prevChained.chainSeq}, found ${event.chainSeq}`,
        });
      }

      if (event.prevHash !== prevChained.hash) {
        issues.push({
          type: 'broken_link',
          chainSeq: event.chainSeq,
          message: `prevHash does not match previous event hash at chainSeq ${prevChained.chainSeq}`,
        });
      }
    } else if (event.prevHash !== null) {
      issues.push({
        type: 'broken_link',
        chainSeq: event.chainSeq,
        message: 'First chained event must have prevHash null',
      });
    }

    const canonical = canonicalize(toChainableInput(event));
    const expectedHash = computeEventHash(event.prevHash, canonical);
    if (event.hash !== expectedHash) {
      issues.push({
        type: 'hash_mismatch',
        chainSeq: event.chainSeq,
        message: `Stored hash does not match recomputed hash at chainSeq ${event.chainSeq}`,
      });
    }

    prevChained = event;
  }

  return {
    valid: issues.length === 0,
    checkedCount,
    issues,
  };
}
