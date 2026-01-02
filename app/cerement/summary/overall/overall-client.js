"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./Overall.module.css";

const monthTabs = [
  { label: "Jan", value: "01" },
  { label: "Feb", value: "02" },
  { label: "Mar", value: "03" },
  { label: "Apr", value: "04" },
  { label: "May", value: "05" },
  { label: "Jun", value: "06" },
  { label: "Jul", value: "07" },
  { label: "Aug", value: "08" },
  { label: "Sep", value: "09" },
  { label: "Oct", value: "10" },
  { label: "Nov", value: "11" },
  { label: "Dec", value: "12" },
];

const amountColumns = [
  { key: "amountSifangjie", label: "四方街" },
  { key: "amountHkShop", label: "香港分店" },
  { key: "amountHkPickup", label: "香港取貨" },
  { key: "amountBranchSales", label: "分店沽貨" },
  { key: "amountConsultant", label: "禮儀顧問" },
];

const barPalette = [
  "#a35b2a",
  "#c27a4a",
  "#9c5c3c",
  "#b76a4f",
  "#7f4b2a",
];

const piePalette = [
  "#a35b2a",
  "#c27a4a",
  "#d6a35f",
  "#9c5c3c",
  "#b76a4f",
  "#7f4b2a",
  "#cb997e",
  "#8a5a44",
  "#b07d62",
  "#6f4e37",
  "#d4a373",
  "#9c6644",
];

const moneyFormatter = new Intl.NumberFormat("en-HK", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatMoney(value) {
  const amount = Number(value || 0);
  return `$${moneyFormatter.format(amount)}`;
}

function getMetricValue(row, metric) {
  if (!row) {
    return 0;
  }
  if (metric === "total") {
    return row.total || 0;
  }
  return Number(row[metric] || 0);
}

function buildMonthRows(yearValue, entriesList) {
  const entriesByMonth = {};
  entriesList.forEach((entry) => {
    if (entry.entryMonth) {
      entriesByMonth[entry.entryMonth] = entry;
    }
  });

  return monthTabs.map((tab) => {
    const key = `${yearValue}-${tab.value}`;
    const entry = entriesByMonth[key];
    const amounts = amountColumns.reduce((acc, column) => {
      acc[column.key] = entry ? Number(entry[column.key] || 0) : 0;
      return acc;
    }, {});
    const total = Object.values(amounts).reduce((sum, value) => sum + value, 0);
    return {
      key,
      label: tab.label,
      total,
      ...amounts,
    };
  });
}

function buildLineChartData(monthRows, metric) {
  const width = 640;
  const height = 220;
  const padding = 28;
  const values = monthRows.map((row) => getMetricValue(row, metric));
  const maxTotal = Math.max(...values, 0);
  const span = width - padding * 2;
  const step = monthTabs.length > 1 ? span / (monthTabs.length - 1) : 0;
  const points = values.map((value, index) => {
    const ratio = maxTotal > 0 ? value / maxTotal : 0;
    const x = padding + index * step;
    const y = height - padding - ratio * (height - padding * 2);
    return { x, y, label: monthTabs[index].label, value };
  });
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const y = height - padding - ratio * (height - padding * 2);
    return { ratio, y };
  });

  return { width, height, padding, points, maxTotal, gridLines, step };
}

function buildPieData(monthRows, metric) {
  const data = monthRows
    .map((row, index) => ({
      label: row.label,
      value: getMetricValue(row, metric),
      color: piePalette[index % piePalette.length],
    }))
    .filter((item) => item.value > 0);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) {
    return { data, total, style: {}, segments: [] };
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

  return { data, total, style, segments };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function OverallSummaryClient() {
  const [years, setYears] = useState([]);
  const [entriesByYear, setEntriesByYear] = useState({});
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [metricByYear, setMetricByYear] = useState({});
  const [hoveredIndexByYear, setHoveredIndexByYear] = useState({});
  const [pieHoverByYear, setPieHoverByYear] = useState({});

  useEffect(() => {
    async function loadYears() {
      setLoading(true);
      setStatus("");
      try {
        const response = await fetch("/api/cerement/years");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || "Unable to load years.");
        }
        setYears(data.years || []);
      } catch (error) {
        setStatus(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadYears();
  }, []);

  useEffect(() => {
    if (years.length === 0) {
      return;
    }
    let cancelled = false;

    async function loadEntries() {
      setLoading(true);
      setStatus("");
      try {
        const results = await Promise.all(
          years.map(async (year) => {
            const response = await fetch(`/api/cerement?year=${year}`);
            const data = await response.json();
            if (!response.ok) {
              throw new Error(data?.error || "Unable to load cerement data.");
            }
            return [year, data.entries || []];
          })
        );
        if (!cancelled) {
          setEntriesByYear(Object.fromEntries(results));
        }
      } catch (error) {
        if (!cancelled) {
          setStatus(error.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadEntries();

    return () => {
      cancelled = true;
    };
  }, [years]);

  useEffect(() => {
    if (years.length === 0) {
      return;
    }
    setMetricByYear((prev) => {
      const next = { ...prev };
      years.forEach((yearValue) => {
        if (!next[yearValue]) {
          next[yearValue] = "total";
        }
      });
      return next;
    });
  }, [years]);

  function updateYearMetric(yearValue, metric) {
    setMetricByYear((prev) => ({
      ...prev,
      [yearValue]: metric,
    }));
    setHoveredIndexByYear((prev) => ({ ...prev, [yearValue]: null }));
    setPieHoverByYear((prev) => ({ ...prev, [yearValue]: null }));
  }

  function handleChartMove(yearValue, event, lineData) {
    if (!lineData.points.length) {
      setHoveredIndexByYear((prev) => ({ ...prev, [yearValue]: null }));
      return;
    }
    if (!lineData.step) {
      setHoveredIndexByYear((prev) => ({ ...prev, [yearValue]: 0 }));
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const clientX = event.touches?.[0]?.clientX ?? event.clientX;
    const ratio = (clientX - rect.left) / rect.width;
    const x = ratio * lineData.width;
    const index = Math.round((x - lineData.padding) / lineData.step);
    setHoveredIndexByYear((prev) => ({
      ...prev,
      [yearValue]: clamp(index, 0, monthTabs.length - 1),
    }));
  }

  function handlePieMove(yearValue, event, pieData) {
    if (pieData.total <= 0 || pieData.segments.length === 0) {
      setPieHoverByYear((prev) => ({ ...prev, [yearValue]: null }));
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const clientX = event.touches?.[0]?.clientX ?? event.clientX;
    const clientY = event.touches?.[0]?.clientY ?? event.clientY;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const radius = Math.min(rect.width, rect.height) / 2;
    if (dx * dx + dy * dy > radius * radius) {
      setPieHoverByYear((prev) => ({ ...prev, [yearValue]: null }));
      return;
    }
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const normalized = (angle + 450) % 360;
    const index = pieData.segments.findIndex(
      (segment) => normalized >= segment.start && normalized < segment.end
    );
    if (index === -1) {
      setPieHoverByYear((prev) => ({ ...prev, [yearValue]: null }));
      return;
    }
    setPieHoverByYear((prev) => ({
      ...prev,
      [yearValue]: {
        index,
        x: clientX - rect.left,
        y: clientY - rect.top,
      },
    }));
  }

  const yearSections = useMemo(() => {
    return years.map((yearValue) => {
      const rows = buildMonthRows(yearValue, entriesByYear[yearValue] || []);
      const total = rows.reduce((sum, row) => sum + row.total, 0);
      return { yearValue, rows, total };
    });
  }, [entriesByYear, years]);

  const hasData = yearSections.some((section) => section.total > 0);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link className={styles.backLink} href="/cerement">
            ← Cerement
          </Link>
          <h1>Cerement Overall Summary</h1>
          <p>Line, bar, and pie charts for each year with recorded data.</p>
        </div>
      </header>

      {loading ? <div className={styles.status}>Loading...</div> : null}
      {status ? <div className={styles.statusError}>{status}</div> : null}
      {!loading && years.length === 0 ? (
        <div className={styles.empty}>No cerement data yet.</div>
      ) : null}

      {hasData ? (
        yearSections.map((section) => {
          if (section.total <= 0) {
            return null;
          }
          const metric = metricByYear[section.yearValue] || "total";
          const lineData = buildLineChartData(section.rows, metric);
          const pie = buildPieData(section.rows, metric);
          const hoveredIndex = hoveredIndexByYear[section.yearValue];
          const hoverPoint =
            hoveredIndex === null || hoveredIndex === undefined
              ? null
              : lineData.points[hoveredIndex] || null;
          const pieHover = pieHoverByYear[section.yearValue] || null;
          const barGroups =
            metric === "total"
              ? monthTabs.map((tab, index) => {
                  const row = section.rows[index];
                  const values = amountColumns.map((column, columnIndex) => ({
                    key: column.key,
                    label: column.label,
                    value: row ? Number(row[column.key] || 0) : 0,
                    color: barPalette[columnIndex % barPalette.length],
                  }));
                  return { label: tab.label, values };
                })
              : monthTabs.map((tab, index) => {
                  const row = section.rows[index];
                  const value = getMetricValue(row, metric);
                  const selectedIndex = amountColumns.findIndex(
                    (column) => column.key === metric
                  );
                  const selectedColor =
                    selectedIndex >= 0
                      ? barPalette[selectedIndex % barPalette.length]
                      : barPalette[0];
                  return {
                    label: tab.label,
                    values: [
                      {
                        key: metric,
                        label:
                          amountColumns.find((column) => column.key === metric)
                            ?.label || "Total",
                        value,
                        color: selectedColor,
                      },
                    ],
                  };
                });
          const barMax = Math.max(
            ...barGroups.flatMap((group) =>
              group.values.map((item) => item.value)
            ),
            0
          );
          return (
            <section key={section.yearValue} className={styles.yearSection}>
              <div className={styles.yearHeader}>
                <h2>{section.yearValue}</h2>
                <div className={styles.yearHeaderActions}>
                  <select
                    value={metric}
                    onChange={(event) =>
                      updateYearMetric(section.yearValue, event.target.value)
                    }
                  >
                    <option value="total">Total</option>
                    {amountColumns.map((column) => (
                      <option key={column.key} value={column.key}>
                        {column.label}
                      </option>
                    ))}
                  </select>
                  <span className={styles.yearTotal}>
                    {formatMoney(section.total)}
                  </span>
                </div>
              </div>
              <div className={styles.chartContent}>
                <div className={styles.chartStack}>
                  <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                      <h3>Monthly trend</h3>
                      <span>
                        {lineData.maxTotal > 0
                          ? `Peak ${formatMoney(lineData.maxTotal)}`
                          : "No totals"}
                      </span>
                    </div>
                    {lineData.maxTotal > 0 ? (
                      <div className={styles.chartWrap}>
                        <svg
                          className={styles.chartSvg}
                          viewBox={`0 0 ${lineData.width} ${lineData.height}`}
                          role="img"
                          aria-label={`Monthly trend for ${section.yearValue}`}
                          onMouseMove={(event) =>
                            handleChartMove(section.yearValue, event, lineData)
                          }
                          onMouseLeave={() =>
                            setHoveredIndexByYear((prev) => ({
                              ...prev,
                              [section.yearValue]: null,
                            }))
                          }
                          onTouchMove={(event) =>
                            handleChartMove(section.yearValue, event, lineData)
                          }
                          onTouchEnd={() =>
                            setHoveredIndexByYear((prev) => ({
                              ...prev,
                              [section.yearValue]: null,
                            }))
                          }
                        >
                          <title>{`Monthly totals ${section.yearValue}`}</title>
                          {lineData.gridLines.map((line) => (
                            <line
                              key={line.ratio}
                              className={styles.lineGrid}
                              x1={lineData.padding}
                              x2={lineData.width - lineData.padding}
                              y1={line.y}
                              y2={line.y}
                            />
                          ))}
                          {hoverPoint ? (
                            <line
                              className={styles.chartHoverLine}
                              x1={hoverPoint.x}
                              x2={hoverPoint.x}
                              y1={lineData.padding}
                              y2={lineData.height - lineData.padding}
                            />
                          ) : null}
                          <polyline
                            className={styles.chartLine}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={lineData.points
                              .map((point) => `${point.x},${point.y}`)
                              .join(" ")}
                          />
                          {lineData.points.map((point, index) => (
                            <circle
                              key={point.label}
                              className={`${styles.chartDot} ${
                                hoveredIndex === index
                                  ? styles.chartDotActive
                                  : ""
                              }`}
                              cx={point.x}
                              cy={point.y}
                              r={hoveredIndex === index ? 5 : 3}
                            />
                          ))}
                        </svg>
                        {hoverPoint ? (
                          <div
                            className={styles.chartTooltip}
                            style={{
                              left: `${(hoverPoint.x / lineData.width) * 100}%`,
                            }}
                          >
                            <div className={styles.tooltipTitle}>
                              {hoverPoint.label}
                            </div>
                            <div className={styles.tooltipValue}>
                              {formatMoney(hoverPoint.value)}
                            </div>
                          </div>
                        ) : null}
                        <div className={styles.chartLabels}>
                          {lineData.points.map((point) => (
                            <span key={point.label}>{point.label}</span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className={styles.chartEmpty}>No data yet.</div>
                    )}
                  </div>

                  <div className={styles.barCard}>
                    <div className={styles.barHeader}>
                      <div>
                        <h3>Monthly bars</h3>
                        <p>
                          {metric === "total"
                            ? "Stores grouped by month."
                            : "Selected store totals by month."}
                        </p>
                      </div>
                      <span>
                        {barMax > 0 ? `Max ${formatMoney(barMax)}` : "No totals"}
                      </span>
                    </div>
                    {metric === "total" ? (
                      <div className={styles.barLegend}>
                        {amountColumns.map((column, index) => (
                          <span key={column.key} className={styles.legendItem}>
                            <span
                              className={styles.legendSwatch}
                              style={{
                                background: barPalette[index % barPalette.length],
                              }}
                            />
                            {column.label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div className={styles.barChart}>
                      {barGroups.map((group) => (
                        <div key={group.label} className={styles.barGroup}>
                          <div className={styles.barGroupBars}>
                            {group.values.map((item) => (
                              <div key={item.key} className={styles.barItem}>
                                <span className={styles.barTooltip}>
                                  {item.label}: {formatMoney(item.value)}
                                </span>
                                <div
                                  className={styles.barFill}
                                  style={{
                                    height: barMax
                                      ? `${Math.max(
                                          (item.value / barMax) * 100,
                                          6
                                        )}%`
                                      : "0%",
                                    background: item.color,
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          <span className={styles.barLabel}>{group.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={styles.pieCard}>
                  <div className={styles.pieHeader}>
                    <h3>Monthly mix</h3>
                    <span>{formatMoney(pie.total)}</span>
                  </div>
                  <div className={styles.pieLayout}>
                    <div
                      className={styles.pieChart}
                      style={pie.total > 0 ? pie.style : undefined}
                      onMouseMove={(event) =>
                        handlePieMove(section.yearValue, event, pie)
                      }
                      onMouseLeave={() =>
                        setPieHoverByYear((prev) => ({
                          ...prev,
                          [section.yearValue]: null,
                        }))
                      }
                      onTouchMove={(event) =>
                        handlePieMove(section.yearValue, event, pie)
                      }
                      onTouchEnd={() =>
                        setPieHoverByYear((prev) => ({
                          ...prev,
                          [section.yearValue]: null,
                        }))
                      }
                    >
                      {pie.total > 0 ? (
                        <span className={styles.pieCenter}>
                          {formatMoney(pie.total)}
                        </span>
                      ) : (
                        <span>No data</span>
                      )}
                      {pieHover && pie.segments[pieHover.index] ? (
                        <div
                          className={styles.pieTooltip}
                          style={{ left: pieHover.x, top: pieHover.y }}
                        >
                          <div className={styles.pieTooltipTitle}>
                            {pie.segments[pieHover.index].label}
                          </div>
                          <div className={styles.pieTooltipValue}>
                            {formatMoney(pie.segments[pieHover.index].value)}
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div className={styles.pieLegend}>
                      {pie.data.length > 0 ? (
                        pie.data.map((item) => {
                          const percent = pie.total
                            ? ((item.value / pie.total) * 100).toFixed(1)
                            : "0.0";
                          const percentLabel = percent.replace(/\.0$/, "");
                          return (
                            <div key={item.label} className={styles.pieLegendItem}>
                              <span
                                className={styles.pieSwatch}
                                style={{ background: item.color }}
                              />
                              <div>
                                <strong>{item.label}</strong>
                                <span>
                                  {formatMoney(item.value)} · {percentLabel}%
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className={styles.pieEmpty}>
                          No data to display.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })
      ) : !loading && years.length > 0 ? (
        <div className={styles.empty}>No cerement data yet.</div>
      ) : null}
    </main>
  );
}
