import React, { useState } from "react";
import { createShipment } from "../api/client.js";

const MEDICINES = [
  "Insulin",
  "Herceptin (Trastuzumab)",
  "Humira (Adalimumab)",
  "Keytruda (Pembrolizumab)",
  "Rituxan (Rituximab)",
  "Enbrel (Etanercept)",
  "COVID-19 mRNA Vaccine",
  "Epoetin Alfa",
  "Factor VIII",
  "Remicade (Infliximab)",
];

const CITIES = [
  "New York, USA",
  "London, UK",
  "Berlin, Germany",
  "Tokyo, Japan",
  "Sydney, Australia",
  "Toronto, Canada",
  "Paris, France",
  "Singapore",
  "Dubai, UAE",
  "São Paulo, Brazil",
];

export default function CreateShipment({ onCreated, onClose }) {
  const [form, setForm] = useState({
    medicine_name: MEDICINES[0],
    name: "",
    origin: CITIES[0],
    destination: CITIES[1],
    min_temp: -20,
    max_temp: 8,
    reading_count: 10,
    simulate_violation: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const shipmentName =
      form.name.trim() ||
      `Shipment ${new Date().toLocaleDateString()} – ${form.medicine_name}`;

    try {
      const result = await createShipment({ ...form, name: shipmentName });
      onCreated(result);
    } catch (err) {
      setError(
        err?.response?.data?.error || err.message || "Failed to create shipment"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">New Shipment</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Simulate a cold chain transport
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Medicine name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Medicine / Drug
            </label>
            <select
              name="medicine_name"
              value={form.medicine_name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            >
              {MEDICINES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Shipment name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Shipment Name{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. INS-2024-001"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          {/* Route */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Origin
              </label>
              <select
                name="origin"
                value={form.origin}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Destination
              </label>
              <select
                name="destination"
                value={form.destination}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Temperature range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Temperature Range (°C)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Min Temp</label>
                <input
                  type="number"
                  name="min_temp"
                  value={form.min_temp}
                  onChange={handleChange}
                  step="0.5"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max Temp</label>
                <input
                  type="number"
                  name="max_temp"
                  value={form.max_temp}
                  onChange={handleChange}
                  step="0.5"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Readings count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Number of Readings:{" "}
              <span className="text-brand-600 font-semibold">
                {form.reading_count}
              </span>
              <span className="text-gray-400 font-normal ml-1">(circuit uses 10)</span>
            </label>
            <input
              type="range"
              name="reading_count"
              min="10"
              max="10"
              step="1"
              value={form.reading_count}
              onChange={handleChange}
              className="w-full accent-brand-600"
            />
          </div>

          {/* Simulate violation */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              name="simulate_violation"
              checked={form.simulate_violation}
              onChange={handleChange}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                Simulate Temperature Violation
              </span>
              <p className="text-xs text-gray-500 mt-0.5">
                Injects an out-of-range reading so the ZK proof fails
              </p>
            </div>
          </label>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Creating…
                </>
              ) : (
                "Create Shipment"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
