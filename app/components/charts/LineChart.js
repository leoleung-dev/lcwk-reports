"use client";

import styles from "./Charts.module.css";

function buildSeriesPoints({ labels, series, width, height, padding, maxValue }) {
  const span = width - padding * 2;
  const step = labels.length > 1 ? span / (labels.length - 1) : 0;
  const resolvedMax = maxValue || 0;
  const pointsBySeries = {};

  series.forEach((item) => {
    pointsBySeries[item.key] = labels.map((label, index) => {
      const value = Number(item.values?.[index]) || 0;
      const ratio = resolvedMax > 0 ? value / resolvedMax : 0;
      const x = padding + index * step;
      const y = height - padding - ratio * (height - padding * 2);
      return { x, y, value, label };
    });
  });

  return { pointsBySeries, step };
}

export default function LineChart({
  labels,
  series,
  width = 720,
  height = 260,
  padding = 32,
  maxValue,
  showDots = true,
  emptyLabel = "No data yet.",
  ariaLabel,
}) {
  if (!labels || labels.length === 0 || series.length === 0) {
    return <div className={styles.chartEmpty}>{emptyLabel}</div>;
  }

  const values = series.flatMap((item) => item.values || []);
  const resolvedMax = Number.isFinite(maxValue)
    ? maxValue
    : Math.max(...values.map((value) => Number(value) || 0), 0);
  const { pointsBySeries } = buildSeriesPoints({
    labels,
    series,
    width,
    height,
    padding,
    maxValue: resolvedMax,
  });
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const y = height - padding - ratio * (height - padding * 2);
    return { ratio, y };
  });

  return resolvedMax > 0 ? (
    <>
      <svg
        className={styles.chartSvg}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
      >
        <title>{ariaLabel}</title>
        {gridLines.map((line) => (
          <line
            key={line.ratio}
            className={styles.chartGrid}
            x1={padding}
            x2={width - padding}
            y1={line.y}
            y2={line.y}
          />
        ))}
        {series.map((item) => {
          const points = pointsBySeries[item.key] || [];
          return (
            <g key={item.key}>
              <polyline
                className={`${styles.chartLine} ${
                  item.dashed ? styles.chartLineDashed : ""
                }`}
                style={{ stroke: item.color || "var(--accent-strong)" }}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points.map((point) => `${point.x},${point.y}`).join(" ")}
              />
              {showDots
                ? points.map((point) => (
                    <circle
                      key={`${item.key}-${point.label}`}
                      className={styles.chartDot}
                      style={{ fill: item.color || "var(--accent-strong)" }}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                    />
                  ))
                : null}
            </g>
          );
        })}
      </svg>
      <div className={styles.chartLabels}>
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </>
  ) : (
    <div className={styles.chartEmpty}>{emptyLabel}</div>
  );
}
