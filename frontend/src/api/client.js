import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 120000, // 2 min – proof generation can take a while
  headers: { "Content-Type": "application/json" },
});

// ── Shipments ──────────────────────────────────────────────────────────────────
export const getShipments = () => api.get("/shipments").then((r) => r.data);

export const getShipment = (id) =>
  api.get(`/shipments/${id}`).then((r) => r.data);

export const createShipment = (data) =>
  api.post("/shipments", data).then((r) => r.data);

// ── Proofs ─────────────────────────────────────────────────────────────────────
export const generateProof = (shipmentId) =>
  api.post(`/proofs/generate/${shipmentId}`).then((r) => r.data);

export const getProof = (shipmentId) =>
  api.get(`/proofs/${shipmentId}`).then((r) => r.data);

export const verifyProof = (shipmentId) =>
  api.post(`/proofs/verify/${shipmentId}`).then((r) => r.data);

export const verifyRawProof = (proof, publicSignals) =>
  api.post("/proofs/verify-raw", { proof, publicSignals }).then((r) => r.data);

export default api;
