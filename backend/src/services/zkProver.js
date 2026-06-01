"use strict";

const path = require("path");
const snarkjs = require("snarkjs");

// Paths to compiled circuit artefacts (produced by scripts/setup-circuit.sh)
const BUILD_DIR = path.resolve(__dirname, "../../../circuits/build");
const WASM_PATH = path.join(BUILD_DIR, "cold_chain_js/cold_chain.wasm");
const ZKEY_PATH = path.join(BUILD_DIR, "cold_chain_0001.zkey");
const VKEY_PATH = path.join(BUILD_DIR, "verification_key.json");

// Circuit only works with non-negative integers (LessEqThan is unsigned).
// We shift every scaled temperature by this offset before sending to the circuit:
//   -40°C * 100 + OFFSET = -4000 + 4000 = 0   (minimum allowed)
//   +50°C * 100 + OFFSET =  5000 + 4000 = 9000 (maximum allowed)
// Values are never negative in the circuit and always well within 2^17 = 131072.
const CIRCUIT_OFFSET = 4000;

let _verificationKey = null;
let _poseidon = null;

/**
 * Lazily load the Poseidon hash function from circomlibjs.
 * circomlibjs uses a dynamic import so we cache the result.
 */
async function getPoseidon() {
  if (_poseidon) return _poseidon;
  const { buildPoseidon } = await import("circomlibjs");
  _poseidon = await buildPoseidon();
  return _poseidon;
}

/**
 * Lazily load the Groth16 verification key JSON.
 */
function getVerificationKey() {
  if (_verificationKey) return _verificationKey;
  try {
    _verificationKey = require(VKEY_PATH);
    return _verificationKey;
  } catch (err) {
    throw new Error(
      `Verification key not found at ${VKEY_PATH}. ` +
        "Run scripts/setup-circuit.sh first."
    );
  }
}

/**
 * Compute Poseidon hash of an array of BigInt-compatible values.
 * Returns the hash as a decimal string (to match snarkjs public signals format).
 *
 * @param {number[]} temperatures - Scaled integer temperatures
 * @returns {Promise<string>}
 */
// Compute Poseidon hash over the OFFSET values — this must match what the circuit sees.
async function computeCommitment(temperatures) {
  const poseidon = await getPoseidon();
  const F = poseidon.F;

  const inputs = temperatures.map((t) => BigInt(t + CIRCUIT_OFFSET));
  const hashBuf = poseidon(inputs);
  const hashBigInt = F.toObject(hashBuf);

  return hashBigInt.toString();
}

/**
 * Generate a Groth16 ZK proof for a set of temperature readings.
 *
 * @param {number[]} temperatures - Scaled integers (length must match circuit N=10)
 * @param {number}   minTemp      - Minimum allowed temperature (scaled *100)
 * @param {number}   maxTemp      - Maximum allowed temperature (scaled *100)
 * @returns {Promise<{ proof: object, publicSignals: string[], commitment: string, timeMs: number }>}
 */
async function generateProof(temperatures, minTemp, maxTemp) {
  if (temperatures.length !== 10) {
    throw new Error(
      `Circuit expects exactly 10 readings, got ${temperatures.length}`
    );
  }

  const commitment = await computeCommitment(temperatures);

  // Apply offset so all values entering the circuit are non-negative.
  const input = {
    readings: temperatures.map((t) => (t + CIRCUIT_OFFSET).toString()),
    minTemp: (minTemp + CIRCUIT_OFFSET).toString(),
    maxTemp: (maxTemp + CIRCUIT_OFFSET).toString(),
    commitment,
  };

  const t0 = Date.now();
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    WASM_PATH,
    ZKEY_PATH
  );
  const timeMs = Date.now() - t0;

  return { proof, publicSignals, commitment, timeMs };
}

/**
 * Verify a previously generated Groth16 proof.
 *
 * @param {object}   proof         - The proof object from snarkjs
 * @param {string[]} publicSignals - The public signals array from snarkjs
 * @returns {Promise<boolean>}
 */
async function verifyProof(proof, publicSignals) {
  const vKey = getVerificationKey();
  return snarkjs.groth16.verify(vKey, publicSignals, proof);
}

module.exports = { generateProof, verifyProof, computeCommitment };
