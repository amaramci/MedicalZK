import React, { useState } from "react";
import { generateProof, verifyProof } from "../api/client.js";

export default function ProofVerifier({ shipmentId, existingProof, onProofGenerated }) {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(existingProof || null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const data = await generateProof(shipmentId);
      setResult(data);
      if (onProofGenerated) onProofGenerated(data);
    } catch (err) {
      const msg =
        err?.response?.data?.error || err.message || "Proof generation failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setVerifying(true);
    setError(null);
    try {
      const data = await verifyProof(shipmentId);
      setResult((prev) => ({ ...prev, ...data }));
      if (onProofGenerated) onProofGenerated(data);
    } catch (err) {
      const msg =
        err?.response?.data?.error || err.message || "Verification failed";
      setError(msg);
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleGenerate}
          disabled={loading || verifying}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              Generating Proof…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              Generate ZK Proof
            </>
          )}
        </button>

        {result?.proof && (
          <button
            onClick={handleVerify}
            disabled={loading || verifying}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {verifying ? (
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
                Verifying…
              </>
            ) : (
              "Re-Verify Proof"
            )}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <svg
            className="w-4 h-4 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Result */}
      {result?.proof && (
        <div className="space-y-3">
          {/* Verification status banner */}
          <div
            className={`flex items-center gap-3 rounded-lg px-4 py-3 ${
              result.verified
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            {result.verified ? (
              <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <div>
              <p className="font-semibold">
                {result.verified
                  ? "Proof Valid – All temperatures within range"
                  : "Proof Invalid – Temperature constraint violated"}
              </p>
              {result.generationTimeMs && (
                <p className="text-sm opacity-80 mt-0.5">
                  Generated in {(result.generationTimeMs / 1000).toFixed(1)}s
                </p>
              )}
            </div>
          </div>

          {/* Public signals */}
          {result.publicSignals && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Public Signals
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1">
                {result.publicSignals.map((sig, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs font-mono">
                    <span className="text-gray-400 w-4 flex-shrink-0">[{i}]</span>
                    <span className="text-gray-700 break-all">{sig}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Public signals: [minTemp×100, maxTemp×100, commitment]
              </p>
            </div>
          )}

          {/* Proof JSON */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Proof (Groth16)
            </p>
            <pre className="bg-gray-900 text-green-400 text-xs rounded-lg p-4 overflow-auto max-h-48 font-mono leading-relaxed">
              {JSON.stringify(result.proof, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
