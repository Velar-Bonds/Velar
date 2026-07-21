/**
 * Motor de conciliación — FUNCIONES PURAS, sin acceso a DB ni side-effects.
 *
 * Cruza los bonos declarados en un reporte contra los bonos que el partido
 * realmente posee on-chain (alimentados por fixtures o por la capa de datos)
 * y produce discrepancias tipadas. El núcleo es determinístico y testeable a
 * partir de arrays; NO hace llamadas a Supabase.
 */
import {
  DeclaredBondRef,
  Discrepancy,
  DiscrepancyType,
  HeldBond,
  ReconciliationResult,
} from '@velar/types';

/** Tolerancia monetaria (centavos) para comparar montos declarados vs reales. */
const AMOUNT_EPSILON = 0.01;

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Agrega montos declarados por bono (varias líneas pueden citar el mismo bono). */
function aggregateDeclared(declared: DeclaredBondRef[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const ref of declared) {
    if (!ref.bondTokenId) continue;
    map.set(ref.bondTokenId, round2((map.get(ref.bondTokenId) ?? 0) + (ref.amount ?? 0)));
  }
  return map;
}

function aggregateHeld(held: HeldBond[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const bond of held) {
    if (!bond.bondTokenId) continue;
    map.set(bond.bondTokenId, round2((map.get(bond.bondTokenId) ?? 0) + (bond.amount ?? 0)));
  }
  return map;
}

/**
 * Concilia lo declarado contra lo poseído. Determinístico: mismas entradas →
 * misma salida. Las discrepancias se ordenan por tipo y token para estabilidad.
 */
export function reconcile(
  declared: DeclaredBondRef[],
  held: HeldBond[],
): ReconciliationResult {
  const declaredMap = aggregateDeclared(declared);
  const heldMap = aggregateHeld(held);

  const discrepancies: Discrepancy[] = [];
  let matchedCount = 0;

  // Recorrido de lo declarado: referencias desconocidas y montos que no cuadran.
  for (const [tokenId, declaredAmount] of declaredMap) {
    if (!heldMap.has(tokenId)) {
      discrepancies.push({
        type: DiscrepancyType.UNKNOWN_REFERENCE,
        bondTokenId: tokenId,
        declaredAmount,
        actualAmount: null,
        message: `El reporte referencia el bono ${tokenId}, que el partido no posee.`,
      });
      continue;
    }
    const actualAmount = heldMap.get(tokenId) as number;
    if (Math.abs(declaredAmount - actualAmount) > AMOUNT_EPSILON) {
      discrepancies.push({
        type: DiscrepancyType.AMOUNT_MISMATCH,
        bondTokenId: tokenId,
        declaredAmount,
        actualAmount,
        message: `Monto declarado (${declaredAmount}) no coincide con el valor real (${actualAmount}) del bono ${tokenId}.`,
      });
    } else {
      matchedCount += 1;
    }
  }

  // Recorrido de lo poseído: bonos que el partido tiene pero no declaró.
  for (const [tokenId, actualAmount] of heldMap) {
    if (!declaredMap.has(tokenId)) {
      discrepancies.push({
        type: DiscrepancyType.MISSING_BOND,
        bondTokenId: tokenId,
        declaredAmount: null,
        actualAmount,
        message: `El partido posee el bono ${tokenId} pero no está declarado en el reporte.`,
      });
    }
  }

  discrepancies.sort((a, b) =>
    a.type === b.type
      ? a.bondTokenId.localeCompare(b.bondTokenId)
      : a.type.localeCompare(b.type),
  );

  const declaredTotal = round2([...declaredMap.values()].reduce((s, n) => s + n, 0));
  const actualTotal = round2([...heldMap.values()].reduce((s, n) => s + n, 0));

  return {
    status: discrepancies.length === 0 ? 'clean' : 'discrepancies',
    discrepancies,
    declaredTotal,
    actualTotal,
    matchedCount,
  };
}

/** Extrae las referencias de bono declaradas a partir de las líneas del reporte. */
export function declaredRefsFromLineItems(
  lineItems: Array<{ bondTokenId: string | null; amount: number }>,
): DeclaredBondRef[] {
  return lineItems
    .filter((li): li is { bondTokenId: string; amount: number } => !!li.bondTokenId)
    .map((li) => ({ bondTokenId: li.bondTokenId, amount: li.amount ?? 0 }));
}
