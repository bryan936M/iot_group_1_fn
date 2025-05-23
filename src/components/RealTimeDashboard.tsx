// RealTimeDashboard.tsx
import React, { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import type { ChartConfiguration } from "chart.js";
import "chartjs-adapter-date-fns";

import io from "socket.io-client";
import type { Socket } from "socket.io-client";

// Register all Chart.js components
Chart.register(...registerables);

interface Metric {
  key: string;
  color: string;
}

// interface Data {
//   id: number;
//   elapsed_time: number;
//   velocity: number;
//   density: number;
//   viscosity: number;
//   tds: number;
//   mass: number;
//   date: string;
// }

const METRICS: Metric[] = [
  { key: "Elapsed Time", color: "#EF4444" },
  { key: "Velocity", color: "#3B82F6" },
  { key: "Density", color: "#10B981" },
  { key: "Viscosity", color: "#F59E0B" },
  { key: "TDS", color: "#8B5CF6" },
  { key: "Mass", color: "#6366F1" },
];

type UpdateDataPayload = {
  data: Array<[number, ...number[], number]>;
  predictions: number[]; // Array of predicted viscosity values
  // tuple: [ignored?, metric1, metric2, ..., timestamp]
};

export default function RealTimeDashboard(): React.ReactElement {
  const [status, setStatus] = useState<
    "Connecting..." | "Connected" | "Disconnected"
  >("Connecting...");
  const [predictions, setPredictions] = useState<number[]>([]);
  const [actualData, setActualData] = useState<
    Array<[number, ...number[], number]>
  >([]);
  const chartRefs = useRef<Array<HTMLCanvasElement | null>>(
    METRICS.map(() => null)
  );
  const charts = useRef<Chart[]>([]);
  const socketRef = useRef<typeof Socket | null>(null);

  useEffect(() => {
    // Clean up any existing charts first
    charts.current.forEach((chart) => {
      if (chart) {
        chart.destroy();
      }
    });
    charts.current = [];

    // Initialize charts
    charts.current = chartRefs.current.map((canvas, i) => {
      if (!canvas) {
        throw new Error("Canvas ref not set");
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("2D context not available");
      }

      const config: ChartConfiguration<"line"> = {
        type: "line",
        data: {
          labels: [] as unknown as string[],
          datasets: [
            {
              label: METRICS[i].key,
              data: [] as number[],
              borderColor: METRICS[i].color,
              tension: 0.4,
              fill: false,
              pointRadius: 0,
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              mode: "index",
              intersect: false,
            },
          },
          scales: {
            x: {
              type: "time",
              time: {
                tooltipFormat: "HH:mm:ss",
                displayFormats: { second: "HH:mm:ss" },
              },
              grid: {
                display: false,
              },
            },
            y: {
              beginAtZero: true,
              grid: {
                color: "#E5E7EB",
              },
            },
          },
          interaction: {
            mode: "nearest",
            axis: "x",
            intersect: false,
          },
        },
      };

      return new Chart(ctx, config);
    });

    // Set up socket connection
    const socket = io("http://127.0.0.1:5000", {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("Connected");
    });

    socket.on("disconnect", () => {
      setStatus("Disconnected");
    });

    socket.on("update_data", (payload: UpdateDataPayload) => {
      const rows = payload.data.slice().reverse();
      const preds = payload.predictions.slice().reverse();

      setActualData(rows);
      setPredictions(preds);

      console.log(rows);
      console.log(preds);

      // Clear old data
      charts.current.forEach((c) => {
        c.data.labels = [];
        c.data.datasets[0].data = [];
      });

      // Populate new data
      rows.forEach((row) => {
        const timestamp = row[row.length - 1]; // last element
        charts.current.forEach((c, idx) => {
          c.data.labels!.push(timestamp as unknown as string);
          c.data.datasets[0].data.push(row[idx + 1]);
        });
      });

      // Update charts
      charts.current.forEach((c) => c.update());
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      charts.current.forEach((c) => c.destroy());
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">
            Real-Time Data
          </h3>
          <div
            className={`text-sm font-medium ${
              status === "Connected" ? "text-green-600" : "text-red-500"
            }`}
          >
            {status}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {METRICS.map((m, i) => (
            <div key={m.key} className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-medium mb-4 text-center text-gray-900">
                {m.key}
              </h2>
              <div className="h-48">
                <canvas
                  ref={(el: HTMLCanvasElement | null) => {
                    chartRefs.current[i] = el;
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Predictions Table */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Predictions vs Actual Values
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Timestamp
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Predicted Viscosity
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actual Milk Quality
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Predicted Milk Quality
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {actualData.map((row, rowIndex) => {
                  const timestamp = new Date(
                    row[row.length - 1]
                  ).toLocaleTimeString();
                  const predictedViscosity = predictions[rowIndex];
                  const actualViscosity = Number(row[4]); // Viscosity is the 5th metric (index 3)
                  const difference =
                    predictedViscosity !== undefined
                      ? Math.abs(actualViscosity - predictedViscosity)
                      : null;

                  return (
                    <tr
                      key={rowIndex}
                      className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      {/* Timestamp */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {timestamp}
                      </td>
                      {/* Actual Viscosity */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col">
                          <span>
                            Actual Viscosity: {actualViscosity.toFixed(2)}
                          </span>
                          {predictedViscosity !== undefined && (
                            <>
                              <span className="text-gray-400">
                                Predicted Viscosity:{" "}
                                {predictedViscosity.toFixed(2)}
                              </span>
                              <span
                                className={`text-xs ${
                                  difference && difference > 1
                                    ? "text-red-500"
                                    : "text-green-500"
                                }`}
                              >
                                Difference: {difference?.toFixed(2)}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      {/* Actual Milk Quality */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {actualViscosity &&
                        actualViscosity > 1.5 &&
                        actualViscosity < 2.0
                          ? "Good Milk"
                          : "Bad Milk"}
                      </td>
                      {/* Predicted Milk Quality */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {predictedViscosity &&
                        predictedViscosity > 1.5 &&
                        predictedViscosity < 2.0
                          ? "Good Milk"
                          : "Bad Milk"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
