"use strict";

const express = require("express");
const cors = require("cors");

const shipmentsRouter = require("./routes/shipments");
const proofsRouter = require("./routes/proofs");

const PORT = process.env.PORT || 3001;

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use("/api/shipments", shipmentsRouter);
app.use("/api/proofs", proofsRouter);

// Health-check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "MedicalZK Backend",
    timestamp: new Date().toISOString(),
  });
});

// ── 404 / Error handlers ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.path} not found` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  const safeMsg = (err.message || String(err)).replace(/[\x00-\x1F\x7F]/g, " ").trim();
  res.status(500).json({ success: false, error: safeMsg });
});

// ── Start ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\nMedicalZK backend running on http://localhost:${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/api/health`);
  console.log(`  Shipments: http://localhost:${PORT}/api/shipments`);
  console.log(`  Proofs: http://localhost:${PORT}/api/proofs\n`);
});
