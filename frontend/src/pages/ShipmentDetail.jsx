import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getShipment } from "../api/client.js";
import TemperatureChart from "../components/TemperatureChart.jsx";
import ProofVerifier from "../components/ProofVerifier.jsx";

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right max-w-xs truncate">
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    verified: "bg-green-100 text-green-800 border border-green-200",
    pending: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    failed: "bg-red-100 text-red-800 border border-red-200",
    violation: "bg-orange-100 text-orange-800 border border-orange-200",
  };
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
        map[status] || map.pending
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function ShipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getShipment(id);
      setData(result);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  function handleProofGenerated(proofData) {
    setData((prev) => ({
      ...prev,
      proof: proofData,
      shipment: {
        ...prev.shipment,
        status: proofData.verified ? "verified" : "failed",
      },
    }));
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-64 bg-gray-200 rounded-xl" />
        <div className="h-48 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const { shipment, readings, proof } = data;
  const minC = (shipment.min_temp / 100).toFixed(1);
  const maxC = (shipment.max_temp / 100).toFixed(1);
  const readingTemps = readings.map((r) => r.temperature / 100);
  const actualMin = readingTemps.length ? Math.min(...readingTemps).toFixed(2) : "-";
  const actualMax = readingTemps.length ? Math.max(...readingTemps).toFixed(2) : "-";

  return (
    <div className="page-enter space-y-6 max-w-4xl">
      {/* Back button + header */}
      <div>
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>
        <div className="flex flex-wrap items-start gap-3 justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {shipment.medicine_name}
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">{shipment.name}</p>
          </div>
          <StatusBadge status={shipment.status} />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: chart + proof */}
        <div className="lg:col-span-2 space-y-6">
          {/* Temperature chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Temperature Readings
            </h2>
            <TemperatureChart
              readings={readings}
              minTemp={shipment.min_temp}
              maxTemp={shipment.max_temp}
            />

            {/* Reading summary */}
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-0.5">Readings</p>
                <p className="text-xl font-bold text-gray-900">{readings.length}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-0.5">Min Recorded</p>
                <p className="text-xl font-bold text-blue-700">{actualMin}°C</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-0.5">Max Recorded</p>
                <p className="text-xl font-bold text-red-700">{actualMax}°C</p>
              </div>
            </div>
          </div>

          {/* ZK Proof section */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-brand-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-brand-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-gray-900">
                Zero-Knowledge Proof
              </h2>
            </div>
            <ProofVerifier
              shipmentId={shipment.id}
              existingProof={proof}
              onProofGenerated={handleProofGenerated}
            />
          </div>
        </div>

        {/* Right: shipment info */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-3">
              Shipment Info
            </h2>
            <div>
              <InfoRow label="Medicine" value={shipment.medicine_name} />
              <InfoRow label="Origin" value={shipment.origin} />
              <InfoRow label="Destination" value={shipment.destination} />
              <InfoRow label="Min Allowed" value={`${minC}°C`} />
              <InfoRow label="Max Allowed" value={`${maxC}°C`} />
              <InfoRow
                label="Created"
                value={new Date(shipment.created_at).toLocaleString()}
              />
              <InfoRow label="Status" value={shipment.status} />
            </div>
          </div>

          {/* Proof metadata */}
          {proof && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">
                Proof Details
              </h2>
              <div>
                <InfoRow
                  label="Generated"
                  value={new Date(proof.created_at).toLocaleString()}
                />
                <InfoRow
                  label="Gen. Time"
                  value={
                    proof.generation_time_ms
                      ? `${(proof.generation_time_ms / 1000).toFixed(1)}s`
                      : "—"
                  }
                />
                <InfoRow
                  label="Verified"
                  value={proof.verified ? "Yes" : "No"}
                />
                {proof.commitment && (
                  <div className="py-2">
                    <span className="block text-xs text-gray-500 mb-1">
                      Commitment
                    </span>
                    <span className="text-xs font-mono text-gray-700 break-all leading-relaxed">
                      {typeof proof.commitment === "string"
                        ? proof.commitment.slice(0, 40) + "…"
                        : "—"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ZK explanation */}
          <div className="bg-brand-50 border border-brand-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-brand-800 mb-2">
              Privacy Guarantee
            </p>
            <p className="text-xs text-brand-700 leading-relaxed">
              The ZK proof reveals only that all readings stayed within the
              allowed range. The exact temperature values remain private.
              The Poseidon commitment binds the proof to the actual sensor
              data without exposing it.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
