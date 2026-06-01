const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_PATH = path.join(__dirname, "../../data/cold_chain.db");

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS shipments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    medicine_name TEXT NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    min_temp INTEGER NOT NULL,
    max_temp INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    status TEXT NOT NULL DEFAULT 'pending'
  );

  CREATE TABLE IF NOT EXISTS temperature_readings (
    id TEXT PRIMARY KEY,
    shipment_id TEXT NOT NULL,
    temperature INTEGER NOT NULL,
    timestamp TEXT NOT NULL,
    sensor_id TEXT NOT NULL,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS proofs (
    id TEXT PRIMARY KEY,
    shipment_id TEXT NOT NULL UNIQUE,
    proof_json TEXT NOT NULL,
    public_signals TEXT NOT NULL,
    commitment TEXT NOT NULL,
    verified INTEGER NOT NULL DEFAULT 0,
    generation_time_ms INTEGER,
    tx_hash TEXT,
    block_number INTEGER,
    on_chain_verified INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
  );
`);

module.exports = db;
