import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getShipments } from "../api/client.js";
import ShipmentCard from "../components/ShipmentCard.jsx";
import CreateShipment from "../components/CreateShipment.jsx";

function StatCard({ label, value, color, icon }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getShipments();
      setShipments(data.shipments || []);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          "Failed to load shipments. Is the backend running on port 3001?"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleCreated(result) {
    setShowCreate(false);
    navigate(`/shipment/${result.shipment.id}`);
  }

  const verified = shipments.filter((s) => s.status === "verified").length;
  const failed = shipments.filter(
    (s) => s.status === "failed" || s.status === "violation"
  ).length;
  const pending = shipments.filter((s) => s.status === "pending").length;

  return (
    <div className="page-enter space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cold Chain Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Zero-Knowledge verified pharmaceutical transport
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Shipment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Shipments"
          value={shipments.length}
          color="bg-brand-50"
          icon={
            <svg className="w-6 h-6 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
        <StatCard
          label="Verified"
          value={verified}
          color="bg-green-50"
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Pending"
          value={pending}
          color="bg-yellow-50"
          icon={
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Failed / Violation"
          value={failed}
          color="bg-red-50"
          icon={
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      </div>

      {/* ZK explanation banner */}
      <div className="bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-100 rounded-xl p-5 flex gap-4">
        <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-5 h-5 text-brand-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-sm">
          <p className="font-semibold text-brand-900 mb-1">How Zero-Knowledge Proofs Work Here</p>
          <p className="text-brand-700 leading-relaxed">
            IoT sensors record temperature readings (scaled ×100 for integer arithmetic). The Circom circuit
            proves <strong>all readings stayed within [min, max]</strong> using a Poseidon hash commitment —
            without revealing the exact temperatures. The Groth16 proof is cryptographically verified by the
            backend and can optionally be submitted on-chain.
          </p>
        </div>
      </div>

      {/* Shipment list */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-40"
            />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <svg
            className="w-10 h-10 text-red-400 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-red-700 font-medium mb-1">Connection Error</p>
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={load}
            className="mt-4 px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : shipments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <svg
            className="w-12 h-12 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <p className="text-gray-500 font-medium mb-1">No shipments yet</p>
          <p className="text-gray-400 text-sm mb-4">
            Create your first shipment to get started
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Create Shipment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shipments.map((s) => (
            <ShipmentCard key={s.id} shipment={s} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateShipment
          onCreated={handleCreated}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
