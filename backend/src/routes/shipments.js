"use strict";

const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../db/database");
const { generateShipmentTemperatures } = require("../services/simulator");

const router = express.Router();

// ─── GET /api/shipments ────────────────────────────────────────────────────────
// Returns all shipments with proof status joined in
router.get("/", (req, res) => {
  try {
    const shipments = db
      .prepare(
        `
        SELECT
          s.*,
          p.verified,
          p.commitment,
          p.created_at AS proof_created_at
        FROM shipments s
        LEFT JOIN proofs p ON p.shipment_id = s.id
        ORDER BY s.created_at DESC
      `
      )
      .all();

    res.json({ success: true, shipments });
  } catch (err) {
    console.error("GET /api/shipments error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/shipments ───────────────────────────────────────────────────────
// Create a new shipment and simulate temperature readings
router.post("/", (req, res) => {
  try {
    const {
      name,
      medicine_name,
      origin,
      destination,
      // accept both snake_case and camelCase
      min_temp,
      max_temp,
      minTemp,
      maxTemp,
      reading_count,
      readingCount,
      simulate_violation,
      simulateViolation,
      shouldViolate: shouldViolateParam,
    } = req.body;

    const rawMin  = min_temp  ?? minTemp  ?? 2;
    const rawMax  = max_temp  ?? maxTemp  ?? 8;
    const rawCount = reading_count ?? readingCount ?? 10;
    const shouldViolate = simulate_violation ?? simulateViolation ?? shouldViolateParam ?? false;

    if (!name || !medicine_name || !origin || !destination) {
      return res.status(400).json({
        success: false,
        error: "name, medicine_name, origin, destination are required",
      });
    }

    if (rawMin < -40 || rawMax > 50 || rawMin >= rawMax) {
      return res.status(400).json({
        success: false,
        error: "Temperature range must be within [-40, +50]°C and minTemp < maxTemp",
      });
    }

    // Circuit uses N=10; clamp user request to 10
    const count = Math.min(Math.max(parseInt(rawCount, 10) || 10, 10), 10);

    // Scale temps by 100 for storage (no circuit offset here — offset applied in zkProver)
    const minScaled = Math.round(rawMin * 100);
    const maxScaled = Math.round(rawMax * 100);

    const { temperatures, hasViolation } = generateShipmentTemperatures(
      count,
      rawMin,
      rawMax,
      shouldViolate
    );

    const shipmentId = uuidv4();
    const now = new Date().toISOString();

    // Insert shipment
    db.prepare(
      `INSERT INTO shipments (id, name, medicine_name, origin, destination, min_temp, max_temp, created_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      shipmentId,
      name,
      medicine_name,
      origin,
      destination,
      minScaled,
      maxScaled,
      now,
      hasViolation ? "violation" : "pending"
    );

    // Insert temperature readings
    const insertReading = db.prepare(
      `INSERT INTO temperature_readings (id, shipment_id, temperature, timestamp, sensor_id)
       VALUES (?, ?, ?, ?, ?)`
    );

    const insertMany = db.transaction((readings) => {
      readings.forEach((temp, idx) => {
        const ts = new Date(
          Date.now() - (count - idx) * 3600 * 1000
        ).toISOString();
        insertReading.run(
          uuidv4(),
          shipmentId,
          temp,
          ts,
          `SENSOR-${String(idx + 1).padStart(3, "0")}`
        );
      });
    });

    insertMany(temperatures);

    const shipment = db
      .prepare("SELECT * FROM shipments WHERE id = ?")
      .get(shipmentId);
    const readings = db
      .prepare(
        "SELECT * FROM temperature_readings WHERE shipment_id = ? ORDER BY timestamp ASC"
      )
      .all(shipmentId);

    res.status(201).json({
      success: true,
      shipment,
      readings,
      hasViolation,
    });
  } catch (err) {
    console.error("POST /api/shipments error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/shipments/:id ────────────────────────────────────────────────────
// Get a single shipment with all its readings and proof (if any)
router.get("/:id", (req, res) => {
  try {
    const shipment = db
      .prepare("SELECT * FROM shipments WHERE id = ?")
      .get(req.params.id);

    if (!shipment) {
      return res.status(404).json({ success: false, error: "Shipment not found" });
    }

    const readings = db
      .prepare(
        "SELECT * FROM temperature_readings WHERE shipment_id = ? ORDER BY timestamp ASC"
      )
      .all(req.params.id);

    const proof = db
      .prepare("SELECT * FROM proofs WHERE shipment_id = ?")
      .get(req.params.id);

    res.json({
      success: true,
      shipment,
      readings,
      proof: proof
        ? {
            ...proof,
            proof_json: JSON.parse(proof.proof_json),
            public_signals: JSON.parse(proof.public_signals),
          }
        : null,
    });
  } catch (err) {
    console.error(`GET /api/shipments/${req.params.id} error:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
