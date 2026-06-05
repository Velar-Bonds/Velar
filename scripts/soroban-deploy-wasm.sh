#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# VELAR — Compila y sube el contrato VelarBond a Stellar Testnet.
#
# Requiere:
#   - rustup con target wasm32-unknown-unknown
#   - stellar-cli  (https://github.com/stellar/stellar-cli)
#   - una identidad stellar fondeada con XLM testnet
#
# Uso:
#   ./scripts/soroban-deploy-wasm.sh [identity_name]
#
# Después de correr este script, copiá las dos líneas que imprime al final
# en apps/api/.env y reiniciá el backend.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

IDENTITY="${1:-platform}"
CONTRACT_DIR="$(cd "$(dirname "$0")/../contracts/velar-bond" && pwd)"

echo "▸ Compilando contrato VelarBond…"
cd "$CONTRACT_DIR"
cargo build --target wasm32-unknown-unknown --release

WASM="$CONTRACT_DIR/target/wasm32-unknown-unknown/release/velar_bond.wasm"
if [ ! -f "$WASM" ]; then
  echo "✗ WASM no generado en $WASM"; exit 1
fi
echo "  wasm size: $(wc -c < "$WASM") bytes"

echo ""
echo "▸ Optimizando WASM…"
stellar contract optimize --wasm "$WASM" || true

OPT_WASM="${WASM%.wasm}.optimized.wasm"
USE_WASM="$WASM"
[ -f "$OPT_WASM" ] && USE_WASM="$OPT_WASM"

echo ""
echo "▸ Subiendo WASM a testnet (identity: $IDENTITY)…"
WASM_HASH=$(stellar contract upload \
  --source-account "$IDENTITY" \
  --network testnet \
  --wasm "$USE_WASM")

TSE_ADDRESS=$(stellar keys address "$IDENTITY")

echo ""
echo "─────────────────────────────────────────────────────────────────────"
echo "✓ WASM subido. Agregá esto a apps/api/.env :"
echo ""
echo "SOROBAN_VELAR_BOND_WASM_HASH=$WASM_HASH"
echo "SOROBAN_TSE_ADDRESS=$TSE_ADDRESS"
echo ""
echo "Y reiniciá el backend (npm run start en apps/api)."
echo "─────────────────────────────────────────────────────────────────────"
