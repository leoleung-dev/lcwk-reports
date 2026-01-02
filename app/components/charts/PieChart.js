"use client";

import styles from "./Charts.module.css";

function buildSegments(data, total) {
  if (total <= 0) {
    return { segments: [], style: {} };
  }
  let start = 0;
  const segments = data.map((item) => {
    const ratio = item.value / total;
    const end = start + ratio * 360;
    const segment = { ...item, start, end };
    start = end;
    return segment;
  });
  const style = {
    background: `conic-gradient(${segments
      .map(
        (segment) =>
          `${segment.color} ${segment.start.toFixed(2)}deg ${segment.end.toFixed(
            2
          )}deg`
      )
      .join(", ")})`,
  };
  return { segments, style };
}

export default function PieChart({
  data,
  palette,
  formatValue,
  formatPercent,
  emptyLabel = "No data",
}) {
  const resolvedData = (data || []).map((item, index) => ({
    ...item,
    color: item.color || palette?.[index % palette.length],
  }));
  const total = resolvedData.reduce((sum, item) => sum + Number(item.value || 0), 0);
  const { style } = buildSegments(resolvedData, total);
  const valueFormatter =
    formatValue || ((value) => (Number.isFinite(value) ? String(value) : "-"));
  const percentFormatter =
    formatPercent || ((value) => `${(value * 100).toFixed(1)}%`);

  return (
    <div className={styles.pieLayout}>
      <div className={styles.pieChart} style={total > 0 ? style : undefined}>
        {total > 0 ? null : <span>{emptyLabel}</span>}
      </div>
      <div className={styles.legend}>
        {resolvedData.length === 0 ? (
          <p>{emptyLabel}</p>
        ) : (
          resolvedData.map((item) => (
            <div key={item.label} className={styles.legendItem}>
              <span
                className={styles.legendSwatch}
                style={{ background: item.color }}
              />
              <div>
                <strong>{item.label}</strong>
                <span>
                  {valueFormatter(item.value)} (
                  {percentFormatter(item.value / (total || 1))})
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
