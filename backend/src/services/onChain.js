"use strict";

const { ethers } = require("ethers");
const path = require("path");

const deployment = require("../contracts/deployment.json");
const abi = require("../contracts/ColdChainVerifier.abi.json");

// Anvil default RPC + first test account private key
const RPC_URL   = process.env.RPC_URL   || "http://127.0.0.1:8545";
const PRIVKEY   = process.env.CHAIN_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

let _provider = null;
let _signer   = null;
let _contract = null;

function getContract() {
  if (_contract) return _contract;
  _provider = new ethers.JsonRpcProvider(RPC_URL);
  _signer   = new ethers.Wallet(PRIVKEY, _provider);
  _contract = new ethers.Contract(deployment.ColdChainVerifier, abi, _signer);
  return _contract;
}

/**
 * Convert snarkjs proof format to Solidity calldata.
 * snarkjs pi_b is stored in reversed order vs what Solidity expects.
 */
function proofToCalldata(proof, publicSignals) {
  const pA = [proof.pi_a[0], proof.pi_a[1]];
  const pB = [
    [proof.pi_b[0][1], proof.pi_b[0][0]],  // reversed
    [proof.pi_b[1][1], proof.pi_b[1][0]],  // reversed
  ];
  const pC = [proof.pi_c[0], proof.pi_c[1]];
  const pubSig = [publicSignals[0], publicSignals[1], publicSignals[2]];
  return { pA, pB, pC, pubSig };
}

/**
 * Submit a ZK proof to the ColdChainVerifier contract.
 * The contract calls Groth16Verifier on-chain — no oracle trust.
 *
 * @returns {{ txHash, blockNumber, onChainVerified }}
 */
async function submitProofOnChain(proof, publicSignals, medicineName) {
  const contract = getContract();
  const { pA, pB, pC, pubSig } = proofToCalldata(proof, publicSignals);

  const tx = await contract.submitProof(pA, pB, pC, pubSig, medicineName);
  const receipt = await tx.wait();

  // Parse ProofSubmitted event
  const event = receipt.logs
    .map((log) => { try { return contract.interface.parseLog(log); } catch { return null; } })
    .find((e) => e && e.name === "ProofSubmitted");

  const onChainVerified = event ? event.args.isValid : false;

  return {
    txHash:          receipt.hash,
    blockNumber:     receipt.blockNumber,
    onChainVerified,
    contractAddress: deployment.ColdChainVerifier,
  };
}

/**
 * Query the contract: is this commitment verified on-chain?
 */
async function isVerifiedOnChain(commitment) {
  const contract = getContract();
  return contract.isShipmentVerified(BigInt(commitment));
}

module.exports = { submitProofOnChain, isVerifiedOnChain, proofToCalldata };
