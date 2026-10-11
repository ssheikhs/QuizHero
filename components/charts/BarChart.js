"use client";

import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

// One measure per chart, so one hue (brand violet, ≥3:1 on white) and no legend — the card title names it.
const BAR = "#6d28d9";
const BAR_HOVER = "#5b21b6";
const GRID = "rgba(15, 23, 42, 0.07)";
const INK = "#475569";

const shorten = (text, max = 28) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/**
 * Single-series bar chart.
 * horizontal: long category names (quiz titles) read better as rows.
 */
export default function BarChart({ labels, values, valueLabel, suffix = "", max, horizontal = false, height = 260, integer = false }) {
  if (!values.length) {
    return <p className="py-10 text-center text-sm opacity-60">No data yet.</p>;
  }

  const valueAxis = {
    beginAtZero: true,
    ...(max ? { max } : {}),
    grid: { color: GRID },
    border: { display: false },
    ticks: { color: INK, ...(integer ? { precision: 0 } : {}), callback: (v) => `${v}${suffix}` },
  };
  const categoryAxis = {
    grid: { display: false },
    border: { color: GRID },
    ticks: { color: INK, autoSkip: false, callback: (_, i) => shorten(labels[i] ?? "") },
  };

  const data = {
    labels,
    datasets: [
      {
        label: valueLabel,
        data: values,
        backgroundColor: BAR,
        hoverBackgroundColor: BAR_HOVER,
        borderRadius: 4,
        borderSkipped: "start", // rounded at the data end, flat on the baseline
        maxBarThickness: 28,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? "y" : "x",
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e1b4b",
        padding: 10,
        callbacks: {
          title: (items) => labels[items[0].dataIndex], // full title in the tooltip
          label: (item) => ` ${valueLabel}: ${item.raw}${suffix}`,
        },
      },
    },
    scales: horizontal ? { x: valueAxis, y: categoryAxis } : { x: categoryAxis, y: valueAxis },
  };

  const autoHeight = horizontal ? Math.max(height, labels.length * 34 + 40) : height;

  return (
    <div style={{ height: autoHeight }} role="img" aria-label={`${valueLabel} bar chart`}>
      <Bar data={data} options={options} />
    </div>
  );
}
