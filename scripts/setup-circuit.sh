#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CIRCUITS_DIR="$SCRIPT_DIR/../circuits"
BUILD_DIR="$CIRCUITS_DIR/build"
CIRCOM_BIN="/Users/amar/.cargo/bin/circom"

echo ""
echo "====================================================="
echo "  MedicalZK – Circuit Setup"
echo "====================================================="
echo ""

# ── 0. Ensure build directory exists ─────────────────────────────────────────
mkdir -p "$BUILD_DIR"

# ── 1. Install circomlib ──────────────────────────────────────────────────────
echo "[1/7] Installing circomlib..."
cd "$CIRCUITS_DIR"
if [ ! -f package.json ]; then
  npm init -y > /dev/null 2>&1
fi
npm install circomlib --save > /dev/null 2>&1
echo "      Done."

# ── 2. Compile the circuit ────────────────────────────────────────────────────
echo "[2/7] Compiling cold_chain.circom..."
"$CIRCOM_BIN" cold_chain.circom \
  --r1cs \
  --wasm \
  --sym \
  -o "$BUILD_DIR" \
  -l node_modules
echo "      Done."

# ── 3. Powers of Tau – new ceremony ──────────────────────────────────────────
echo "[3/7] Starting Powers of Tau ceremony (2^12)..."
snarkjs powersoftau new bn128 12 "$BUILD_DIR/pot12_0000.ptau" -v 2>&1 | tail -3
echo "      Done."

# ── 4. Powers of Tau – first contribution ────────────────────────────────────
echo "[4/7] Adding first contribution..."
snarkjs powersoftau contribute \
  "$BUILD_DIR/pot12_0000.ptau" \
  "$BUILD_DIR/pot12_0001.ptau" \
  --name="MedicalZK first contribution" \
  -v \
  -e="MedicalZK entropy $(date +%s)" 2>&1 | tail -3
echo "      Done."

# ── 5. Powers of Tau – prepare phase 2 ───────────────────────────────────────
echo "[5/7] Preparing phase 2..."
snarkjs powersoftau prepare phase2 \
  "$BUILD_DIR/pot12_0001.ptau" \
  "$BUILD_DIR/pot12_final.ptau" \
  -v 2>&1 | tail -3
echo "      Done."

# ── 6. Groth16 setup ──────────────────────────────────────────────────────────
echo "[6/7] Running Groth16 setup..."
snarkjs groth16 setup \
  "$BUILD_DIR/cold_chain.r1cs" \
  "$BUILD_DIR/pot12_final.ptau" \
  "$BUILD_DIR/cold_chain_0000.zkey" 2>&1 | tail -3

snarkjs zkey contribute \
  "$BUILD_DIR/cold_chain_0000.zkey" \
  "$BUILD_DIR/cold_chain_0001.zkey" \
  --name="MedicalZK zkey contribution" \
  -v \
  -e="zkey entropy $(date +%s)" 2>&1 | tail -3
echo "      Done."

# ── 7. Export verification key ────────────────────────────────────────────────
echo "[7/7] Exporting verification key..."
snarkjs zkey export verificationkey \
  "$BUILD_DIR/cold_chain_0001.zkey" \
  "$BUILD_DIR/verification_key.json"
echo "      Done."

echo ""
echo "====================================================="
echo "  Setup complete!"
echo ""
echo "  Artefacts in: $BUILD_DIR"
echo "    cold_chain.r1cs"
echo "    cold_chain_js/cold_chain.wasm"
echo "    cold_chain_0001.zkey"
echo "    verification_key.json"
echo ""
echo "  Next steps:"
echo "    1. cd backend && npm install && npm run dev"
echo "    2. cd frontend && npm install && npm run dev"
echo "====================================================="
echo ""
