"use client";

import { useState } from "react";
import styles from "./Charts.module.css";

function niceNumber(value, round) {
  const exponent = Math.floor(Math.log10(value));
  const fraction = value / 10 ** exponent;
  let niceFraction = 1;

  if (round) {
    if (fraction < 1.5) {
      niceFraction = 1;
    } else if (fraction < 3) {
      niceFraction = 2;
    } else if (fraction < 7) {
      niceFraction = 5;
    } else {
      niceFraction = 10;
    }
  } else if (fraction <= 1) {
    niceFraction = 1;
  } else if (fraction <= 2) {
    niceFraction = 2;
  } else if (fraction <= 5) {
    niceFraction = 5;
  } else {
    niceFraction = 10;
  }

  return niceFraction * 10 ** exponent;
}

function buildNiceScale(maxValue, targetTickCount = 5) {
  if (!Number.isFinite(maxValue) || maxValue <= 0) {
    return { max: 0, ticks: [0], step: 0 };
  }

  const roughStep = niceNumber(
    maxValue / Math.max(targetTickCount - 1, 1),
    true
  );
  let niceMax = Math.ceil(maxValue / roughStep) * roughStep;
  if (niceMax <= maxValue) {
    niceMax += roughStep;
  }
  const tickCount = Math.ceil(niceMax / roughStep) + 1;
  const ticks = Array.from({ length: tickCount }, (_, index) => index * roughStep);

  return { max: niceMax, ticks, step: roughStep };
}

function buildSeriesPoints({
  labels,
  series,
  width,
  height,
  leftPadding,
  rightPadding,
  topPadding,
  bottomPadding,
  maxValue,
}) {
  const span = width - leftPadding - rightPadding;
  const step = labels.length > 1 ? span / (labels.length - 1) : 0;
  const resolvedMax = maxValue || 0;
  const pointsBySeries = {};

  series.forEach((item) => {
    pointsBySeries[item.key] = labels.map((label, index) => {
      const value = Number(item.values?.[index]) || 0;
      const ratio = resolvedMax > 0 ? value / resolvedMax : 0;
      const x = leftPadding + index * step;
      const y =
        height - bottomPadding - ratio * (height - topPadding - bottomPadding);
      return { x, y, value, label };
    });
  });

  return { pointsBySeries };
}

export default function LineChart({
  labels,
  series,
  width = 720,
  height = 260,
  padding = 32,
  maxValue,
  showDots = true,
  showYAxis = true,
  formatAxisValue,
  formatTooltipValue,
  emptyLabel = "No data yet.",
  ariaLabel,
}) {
  const [hoverState, setHoverState] = useState(null);

  if (!labels || labels.length === 0 || series.length === 0) {
    return <div className={styles.chartEmpty}>{emptyLabel}</div>;
  }

  const axisFormatter =
    formatAxisValue ||
    ((value) =>
      Number(value || 0)
        .toLocaleString("en-US", {
          notation: "compact",
          compactDisplay: "short",
          maximumFractionDigits: 1,
        })
        .replace(/([A-Z]+)/g, (token) => token.toLowerCase()));

  const tooltipFormatter =
    formatTooltipValue ||
    ((value) =>
      Number(value || 0).toLocaleString("en-HK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }));

  const values = series.flatMap((item) => item.values || []);
  const rawMax = Number.isFinite(maxValue)
    ? maxValue
    : Math.max(...values.map((value) => Number(value) || 0), 0);
  const niceScale = showYAxis ? buildNiceScale(rawMax, 5) : null;
  const resolvedMax = showYAxis ? niceScale.max : rawMax;
  const maxAxisLabelLength = showYAxis
    ? Math.max(...(niceScale?.ticks || [0]).map((value) => axisFormatter(value).length), 1)
    : 0;
  const axisLabelGutter = showYAxis
    ? Math.min(40, Math.max(18, maxAxisLabelLength * 6 + 6))
    : 0;
  const leftPadding = padding + axisLabelGutter;
  const rightPadding = padding;
  const topPadding = padding;
  const bottomPadding = padding;

  const { pointsBySeries } = buildSeriesPoints({
    labels,
    series,
    width,
    height,
    leftPadding,
    rightPadding,
    topPadding,
    bottomPadding,
    maxValue: resolvedMax,
  });

  const gridLines = showYAxis
    ? (niceScale?.ticks || [0]).map((value) => {
        const ratio = resolvedMax > 0 ? value / resolvedMax : 0;
        const y =
          height - bottomPadding - ratio * (height - topPadding - bottomPadding);
        return { y, value };
      })
    : [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
        y: height - bottomPadding - ratio * (height - topPadding - bottomPadding),
        value: ratio * resolvedMax,
      }));

  const clampedTooltipX =
    hoverState && Number.isFinite(hoverState.x)
      ? Math.min(
          Math.max(hoverState.x, leftPadding + 42),
          width - rightPadding - 42
        )
      : 0;

  function getSvgX(event) {
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) {
      return leftPadding;
    }
    const rect = svg.getBoundingClientRect();
    if (!rect.width) {
      return leftPadding;
    }
    return ((event.clientX - rect.left) / rect.width) * width;
  }

  function updateHoverFromSeries(event, seriesItem, points, seriesLabel) {
    const svgX = getSvgX(event);
    if (!Number.isFinite(svgX)) {
      return;
    }

    const span = width - leftPadding - rightPadding;
    const rawIndex =
      labels.length > 1 && span > 0
        ? Math.round(((svgX - leftPadding) / span) * (labels.length - 1))
        : 0;
    const index = Math.min(Math.max(rawIndex, 0), labels.length - 1);
    const point = points[index];
    if (!point) {
      return;
    }

    setHoverState({
      x: point.x,
      y: point.y,
      label: point.label,
      seriesLabel,
      value: point.value,
      color: seriesItem.color || "var(--accent-strong)",
    });
  }

  return resolvedMax > 0 ? (
    <div className={styles.lineChartWrap}>
      <svg
        className={styles.chartSvg}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
        onMouseLeave={() => setHoverState(null)}
      >
        <title>{ariaLabel}</title>
        {gridLines.map((line, index) => (
          <g key={`grid-${index}`}>
            <line
              className={styles.chartGrid}
              x1={leftPadding}
              x2={width - rightPadding}
              y1={line.y}
              y2={line.y}
            />
            {showYAxis ? (
              <text
                className={styles.chartAxisLabel}
                x={leftPadding - 8}
                y={line.y + 4}
                textAnchor="end"
              >
                {axisFormatter(line.value)}
              </text>
            ) : null}
          </g>
        ))}
        {series.map((item) => {
          const points = pointsBySeries[item.key] || [];
          const seriesLabel = item.label || item.key || "Series";
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
              >
                <title>{seriesLabel}</title>
              </polyline>
              <polyline
                className={styles.lineHoverPath}
                fill="none"
                points={points.map((point) => `${point.x},${point.y}`).join(" ")}
                onMouseEnter={(event) =>
                  updateHoverFromSeries(event, item, points, seriesLabel)
                }
                onMouseMove={(event) =>
                  updateHoverFromSeries(event, item, points, seriesLabel)
                }
              />
              {showDots
                ? points.map((point) => (
                    <g key={`${item.key}-${point.label}`}>
                      <circle
                        className={styles.chartDot}
                        style={{ fill: item.color || "var(--accent-strong)" }}
                        cx={point.x}
                        cy={point.y}
                        r="4"
                      />
                      <circle
                        className={styles.lineHoverTarget}
                        cx={point.x}
                        cy={point.y}
                        r="11"
                        onMouseEnter={(event) =>
                          updateHoverFromSeries(event, item, points, seriesLabel)
                        }
                        onMouseMove={(event) =>
                          updateHoverFromSeries(event, item, points, seriesLabel)
                        }
                      />
                    </g>
                  ))
                : null}
            </g>
          );
        })}
      </svg>
      {hoverState ? (
        <div
          className={styles.lineTooltip}
          style={{
            left: `${(clampedTooltipX / width) * 100}%`,
            top: `${((hoverState.y - 14) / height) * 100}%`,
          }}
        >
          <strong>{`${hoverState.seriesLabel} · ${hoverState.label}`}</strong>
          <span>{tooltipFormatter(hoverState.value)}</span>
        </div>
      ) : null}
      <div
        className={styles.chartLabels}
        style={{
          paddingLeft: `${leftPadding}px`,
          paddingRight: `${rightPadding}px`,
        }}
      >
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  ) : (
    <div className={styles.chartEmpty}>{emptyLabel}</div>
  );
}
