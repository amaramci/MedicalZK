"use strict";

/**
 * Temperature Simulator Service
 *
 * Generates realistic temperature readings for a cold chain shipment.
 * Temperatures are returned scaled by 100 (so 2.5°C → 250) to work
 * with integer arithmetic inside the ZK circuit.
 */

/**
 * Generate N temperature readings for a shipment.
 *
 * @param {number} count         - Number of readings to generate (should match circuit N=10)
 * @param {number} minTemp       - Minimum allowed temperature (°C, unscaled)
 * @param {number} maxTemp       - Maximum allowed temperature (°C, unscaled)
 * @param {boolean} shouldViolate - If true, inject at least one out-of-range reading
 * @returns {{ temperatures: number[], hasViolation: boolean }}
 *          temperatures: integers scaled *100
 */
function generateShipmentTemperatures(count, minTemp, maxTemp, shouldViolate = false) {
  const range = maxTemp - minTemp;
  const midpoint = (minTemp + maxTemp) / 2;

  // Start temperature: slightly above minTemp
  let current = minTemp + range * 0.3 + (Math.random() - 0.5) * range * 0.1;

  const rawReadings = [];
  let hasViolation = false;

  for (let i = 0; i < count; i++) {
    // Slow drift + small noise
    const drift = (Math.random() - 0.48) * range * 0.08;
    current += drift;

    // Gentle reversion toward midpoint so readings don't wander too far
    current += (midpoint - current) * 0.05;

    // Clamp within a "realistic" band
    const lo = minTemp + range * 0.05;
    const hi = maxTemp - range * 0.05;
    current = Math.max(lo, Math.min(hi, current));

    // Optionally inject a violation on one of the last readings
    if (shouldViolate && i === Math.floor(count * 0.7) && !hasViolation) {
      // Push above maxTemp by 5–15% of range
      const overshoot = range * (0.05 + Math.random() * 0.1);
      current = maxTemp + overshoot;
      hasViolation = true;
    }

    // Scale by 100 and round to integer
    rawReadings.push(Math.round(current * 100));
  }

  return { temperatures: rawReadings, hasViolation };
}

/**
 * Convert a scaled integer temperature back to a human-readable float string.
 * e.g. 253 → "2.53"
 */
function formatTemperature(scaledTemp) {
  return (scaledTemp / 100).toFixed(2);
}

module.exports = { generateShipmentTemperatures, formatTemperature };
