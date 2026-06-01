import React, { useState } from "react";
import { verifyRawProof } from "../api/client.js";

const EXAMPLE_PLACEHOLDER = `{
  "pi_a": ["...", "...", "1"],
  "pi_b": [["...", "..."], ["...", "..."], ["1", "0"]],
  "pi_c": ["...", "...", "1"],
  "protocol": "groth16",
  "curve": "bn128"
}`;

const EXAMPLE_SIGNALS_PLACEHOLDER = `[
  "2000",
  "800",
  "12345678901234567890"
]`;

export default function VerifyProof() {
  const [proofText, setProofText] = useState("");
  const [signalsText, setSignalsText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleVerify() {
    setError(null);
    setResult(null);

    let proof, publicSignals;

    try {
      proof = JSON.parse(proofText.trim());
    } catch {
      setError("Invalid proof JSON – check the format and try again.");
      return;
    }
    try {
      publicSignals = JSON.parse(signalsText.trim());
    } catch {
      setError("Invalid public signals JSON – should be an array of strings.");
      return;
    }

    setLoading(true);
    try {
      const data = await verifyRawProof(proof, publicSignals);
      setResult(data);
    } catch (err) {
      setError(
        err?.response?.data?.error || err.message || "Verification failed"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setProofText("");
    setSignalsText("");
    setResult(null);
    setError(null);
  }

  return (
    <div className="page-enter max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Independent Proof Verification</h1>
        <p className="text-sm text-gray-500 mt-1">
          Paste any Groth16 proof and public signals to verify them against the
          cold chain verification key.
        </p>
      </div>

      {/* How it works */}
      <div className="bg-brand-50 border border-brand-100 rounded-xl p-5">
        <p className="text-sm font-semibold text-brand-900 mb-2">How to use</p>
        <ol className="text-sm text-brand-700 space-y-1 list-decimal list-inside">
          <li>
            Generate a proof from the{" "}
            <a href="/" className="underline hover:text-brand-900">
              Dashboard
            </a>{" "}
            → Shipment → Generate ZK Proof
          </li>
          <li>Copy the proof JSON and public signals shown there</li>
          <li>Paste them below and click Verify</li>
        </ol>
        <p className="text-xs text-brand-600 mt-2">
          Public signals order: <code className="bg-brand-100 px-1 rounded">[minTemp×100, maxTemp×100, commitment]</code>
        </p>
      </div>

      {/* Inputs */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Proof JSON (pi_a, pi_b, pi_c)
          </label>
          <textarea
            value={proofText}
            onChange={(e) => setProofText(e.target.value)}
            rows={10}
            placeholder={EXAMPLE_PLACEHOLDER}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-y bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Public Signals (JSON array of strings)
          </label>
          <textarea
            value={signalsText}
            onChange={(e) => setSignalsText(e.target.value)}
            rows={5}
            placeholder={EXAMPLE_SIGNALS_PLACEHOLDER}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-y bg-gray-50"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleVerify}
          disabled={loading || !proofText.trim() || !signalsText.trim()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Verifying…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Verify Proof
            </>
          )}
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Result */}
      {result && (
        <div
          className={`flex items-center gap-4 rounded-xl px-5 py-4 ${
            result.verified
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          {result.verified ? (
            <svg className="w-8 h-8 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
          <div>
            <p
              className={`text-lg font-bold ${
                result.verified ? "text-green-800" : "text-red-800"
              }`}
            >
              {result.verified ? "Proof Valid" : "Proof Invalid"}
            </p>
            <p
              className={`text-sm ${
                result.verified ? "text-green-700" : "text-red-700"
              }`}
            >
              {result.verified
                ? "All temperature readings were within the specified range. Cold chain integrity confirmed."
                : "The proof could not be verified. Temperature constraint may have been violated."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
