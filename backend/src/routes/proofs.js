"use strict";

const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../db/database");
const { generateProof, verifyProof } = require("../services/zkProver");
const { submitProofOnChain, isVerifiedOnChain } = require("../services/onChain");

const router = express.Router();

// ─── POST /api/proofs/generate/:shipmentId ─────────────────────────────────────
// Generate a ZK proof for the given shipment
router.post("/generate/:shipmentId", async (req, res) => {
  try {
    const { shipmentId } = req.params;

    const shipment = db
      .prepare("SELECT * FROM shipments WHERE id = ?")
      .get(shipmentId);

    if (!shipment) {
      return res.status(404).json({ success: false, error: "Shipment not found" });
    }

    const readings = db
      .prepare(
        "SELECT temperature FROM temperature_readings WHERE shipment_id = ? ORDER BY timestamp ASC"
      )
      .all(shipmentId);

    if (readings.length !== 10) {
      return res.status(400).json({
        success: false,
        error: `Circuit requires exactly 10 readings, shipment has ${readings.length}`,
      });
    }

    const temperatures = readings.map((r) => r.temperature);
    const { min_temp: minTemp, max_temp: maxTemp } = shipment;

    let proofResult;
    let proofError = null;

    try {
      proofResult = await generateProof(temperatures, minTemp, maxTemp);
    } catch (err) {
      // Proof generation itself failed – likely because a reading is out of range
      // (the circuit constraint will be violated)
      // Strip non-printable / control characters so the message is JSON-safe
      proofError = (err.message || String(err)).replace(/[\x00-\x1F\x7F]/g, " ").trim();
    }

    if (proofError) {
      // Update shipment status to failed
      db.prepare("UPDATE shipments SET status = ? WHERE id = ?").run(
        "failed",
        shipmentId
      );

      // Delete any old proof
      db.prepare("DELETE FROM proofs WHERE shipment_id = ?").run(shipmentId);

      return res.status(422).json({
        success: false,
        error:
          "Proof generation failed – temperature constraint violated. " +
          proofError,
        shipmentId,
      });
    }

    const { proof, publicSignals, commitment, timeMs } = proofResult;

    // Off-chain verify (fast, no gas)
    const isValid = await verifyProof(proof, publicSignals);

    // On-chain submit — contract runs Groth16 pairing check itself
    let onChainResult = null;
    try {
      onChainResult = await submitProofOnChain(proof, publicSignals, shipment.medicine_name);
    } catch (chainErr) {
      console.warn("On-chain submission failed (chain may be down):", chainErr.message);
    }

    const now = new Date().toISOString();
    const existingProof = db
      .prepare("SELECT id FROM proofs WHERE shipment_id = ?")
      .get(shipmentId);

    const txHash      = onChainResult?.txHash      || null;
    const blockNumber = onChainResult?.blockNumber  || null;
    const onChainVerified = onChainResult?.onChainVerified ?? null;

    if (existingProof) {
      db.prepare(
        `UPDATE proofs SET proof_json=?, public_signals=?, commitment=?, verified=?, generation_time_ms=?,
         tx_hash=?, block_number=?, on_chain_verified=?, created_at=? WHERE shipment_id=?`
      ).run(
        JSON.stringify(proof), JSON.stringify(publicSignals), commitment,
        isValid ? 1 : 0, timeMs, txHash, blockNumber,
        onChainVerified === null ? null : (onChainVerified ? 1 : 0),
        now, shipmentId
      );
    } else {
      db.prepare(
        `INSERT INTO proofs
           (id, shipment_id, proof_json, public_signals, commitment, verified,
            generation_time_ms, tx_hash, block_number, on_chain_verified, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        uuidv4(), shipmentId, JSON.stringify(proof), JSON.stringify(publicSignals),
        commitment, isValid ? 1 : 0, timeMs, txHash, blockNumber,
        onChainVerified === null ? null : (onChainVerified ? 1 : 0),
        now
      );
    }

    db.prepare("UPDATE shipments SET status = ? WHERE id = ?").run(
      isValid ? "verified" : "failed", shipmentId
    );

    res.json({
      success: true,
      proof,
      publicSignals,
      commitment,
      verified: isValid,
      generationTimeMs: timeMs,
      onChain: onChainResult ? {
        txHash:      onChainResult.txHash,
        blockNumber: onChainResult.blockNumber,
        verified:    onChainResult.onChainVerified,
        contract:    onChainResult.contractAddress,
      } : null,
    });
  } catch (err) {
    console.error(
      `POST /api/proofs/generate/${req.params.shipmentId} error:`,
      err
    );
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/proofs/:shipmentId ───────────────────────────────────────────────
// Get the stored proof for a shipment
router.get("/:shipmentId", (req, res) => {
  try {
    const proof = db
      .prepare("SELECT * FROM proofs WHERE shipment_id = ?")
      .get(req.params.shipmentId);

    if (!proof) {
      return res
        .status(404)
        .json({ success: false, error: "No proof found for this shipment" });
    }

    res.json({
      success: true,
      proof: {
        ...proof,
        proof_json: JSON.parse(proof.proof_json),
        public_signals: JSON.parse(proof.public_signals),
      },
    });
  } catch (err) {
    console.error(
      `GET /api/proofs/${req.params.shipmentId} error:`,
      err
    );
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/proofs/verify/:shipmentId ──────────────────────────────────────
// Re-verify the stored proof for a shipment
router.post("/verify/:shipmentId", async (req, res) => {
  try {
    const proofRow = db
      .prepare("SELECT * FROM proofs WHERE shipment_id = ?")
      .get(req.params.shipmentId);

    if (!proofRow) {
      return res
        .status(404)
        .json({ success: false, error: "No proof found for this shipment" });
    }

    const proof = JSON.parse(proofRow.proof_json);
    const publicSignals = JSON.parse(proofRow.public_signals);

    const isValid = await verifyProof(proof, publicSignals);

    // Update stored verification status
    db.prepare("UPDATE proofs SET verified = ? WHERE shipment_id = ?").run(
      isValid ? 1 : 0,
      req.params.shipmentId
    );
    db.prepare("UPDATE shipments SET status = ? WHERE id = ?").run(
      isValid ? "verified" : "failed",
      req.params.shipmentId
    );

    res.json({ success: true, verified: isValid, proof, publicSignals });
  } catch (err) {
    console.error(
      `POST /api/proofs/verify/${req.params.shipmentId} error:`,
      err
    );
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/proofs/verify-raw ──────────────────────────────────────────────
// Verify an arbitrary proof + publicSignals submitted as JSON body
router.post("/verify-raw", async (req, res) => {
  try {
    const { proof, publicSignals } = req.body;

    if (!proof || !publicSignals) {
      return res.status(400).json({
        success: false,
        error: "proof and publicSignals are required",
      });
    }

    const isValid = await verifyProof(proof, publicSignals);
    res.json({ success: true, verified: isValid });
  } catch (err) {
    console.error("POST /api/proofs/verify-raw error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
