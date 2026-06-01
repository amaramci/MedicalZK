#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="$SCRIPT_DIR/../circuits/build"
CONTRACTS_DIR="$SCRIPT_DIR/../contracts"

echo ""
echo "====================================================="
echo "  MedicalZK – Generate Solidity Verifier"
echo "====================================================="
echo ""

if [ ! -f "$BUILD_DIR/cold_chain_0001.zkey" ]; then
  echo "ERROR: $BUILD_DIR/cold_chain_0001.zkey not found."
  echo "       Run scripts/setup-circuit.sh first."
  exit 1
fi

mkdir -p "$CONTRACTS_DIR/generated"

echo "Exporting Groth16 Verifier.sol..."
snarkjs zkey export solidityverifier \
  "$BUILD_DIR/cold_chain_0001.zkey" \
  "$CONTRACTS_DIR/generated/Verifier.sol"

echo ""
echo "Generated: $CONTRACTS_DIR/generated/Verifier.sol"
echo ""
echo "The Verifier contract exposes:"
echo "  function verifyProof("
echo "    uint[2] calldata _pA,"
echo "    uint[2][2] calldata _pB,"
echo "    uint[2] calldata _pC,"
echo "    uint[3] calldata _pubSignals"
echo "  ) public view returns (bool)"
echo ""
echo "You can import it into ColdChainVerifier.sol to do"
echo "full on-chain proof verification instead of trusting the backend."
echo "====================================================="
echo ""
