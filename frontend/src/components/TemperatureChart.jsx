import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-700 mb-1">Reading {label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}:{" "}
          <span className="font-semibold">{Number(p.value).toFixed(2)}°C</span>
        </p>
      ))}
    </div>
  );
}

export default function TemperatureChart({ readings, minTemp, maxTemp }) {
  if (!readings || readings.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No readings available
      </div>
    );
  }

  const minC = minTemp / 100;
  const maxC = maxTemp / 100;

  const data = readings.map((r, idx) => ({
    index: idx + 1,
    temperature: r.temperature / 100,
    label: `#${idx + 1}`,
  }));

  // Determine y-axis domain with some padding
  const temps = data.map((d) => d.temperature);
  const dataMin = Math.min(...temps, minC);
  const dataMax = Math.max(...temps, maxC);
  const pad = (dataMax - dataMin) * 0.15 || 1;
  const yMin = Math.floor(dataMin - pad);
  const yMax = Math.ceil(dataMax + pad);

  const hasViolation = readings.some(
    (r) => r.temperature < minTemp || r.temperature > maxTemp
  );

  return (
    <div>
      {hasViolation && (
        <div className="mb-3 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          Temperature violation detected – ZK proof will fail
        </div>
      )}

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="index"
            tickFormatter={(v) => `#${v}`}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={{ stroke: "#e5e7eb" }}
          />
          <YAxis
            domain={[yMin, yMax]}
            tickFormatter={(v) => `${v}°C`}
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            axisLine={{ stroke: "#e5e7eb" }}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(val) =>
              val === "temperature"
                ? "Temperature (°C)"
                : val
            }
          />

          {/* Min threshold */}
          <ReferenceLine
            y={minC}
            stroke="#3b82f6"
            strokeDasharray="6 3"
            strokeWidth={1.5}
            label={{
              value: `Min ${minC}°C`,
              position: "insideTopRight",
              fontSize: 10,
              fill: "#3b82f6",
            }}
          />
          {/* Max threshold */}
          <ReferenceLine
            y={maxC}
            stroke="#ef4444"
            strokeDasharray="6 3"
            strokeWidth={1.5}
            label={{
              value: `Max ${maxC}°C`,
              position: "insideBottomRight",
              fontSize: 10,
              fill: "#ef4444",
            }}
          />

          <Line
            type="monotone"
            dataKey="temperature"
            stroke="#2563eb"
            strokeWidth={2}
            dot={(props) => {
              const { cx, cy, payload } = props;
              const temp = payload.temperature;
              const violation = temp < minC || temp > maxC;
              return (
                <circle
                  key={`dot-${payload.index}`}
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={violation ? "#ef4444" : "#2563eb"}
                  stroke="white"
                  strokeWidth={1.5}
                />
              );
            }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
