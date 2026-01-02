"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BsGear } from "react-icons/bs";
import styles from "./Summary.module.css";

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

const comparePalette = [
  "#2f5d62",
  "#567d7a",
  "#5f6f52",
  "#3f4e4f",
  "#6b705c",
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

function isValidYear(value) {
  return /^\d{4}$/.test(value || "");
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return `$${moneyFormatter.format(amount)}`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
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
      label: `${tab.label} ${yearValue}`,
      hasEntry: Boolean(entry),
      total,
      ...amounts,
    };
  });
}

export default function CerementSummaryClient({ year: yearProp }) {
  const nowYear = new Date().getFullYear();
  const year = isValidYear(yearProp) ? yearProp : String(nowYear);
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [pieHover, setPieHover] = useState(null);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [showLineChart, setShowLineChart] = useState(true);
  const [showBarChart, setShowBarChart] = useState(true);
  const [showPieChart, setShowPieChart] = useState(true);
  const [compareMetric, setCompareMetric] = useState("total");
  const [compareYears, setCompareYears] = useState([]);
  const [compareEntriesByYear, setCompareEntriesByYear] = useState({});
  const [compareLoadingByYear, setCompareLoadingByYear] = useState({});
  const [compareErrorsByYear, setCompareErrorsByYear] = useState({});

  const chartSeries = useMemo(() => {
    const compareValueKey = compareMetric === "total" ? "total" : compareMetric;
    const baseSeries = [
      {
        key: `year-${year}`,
        valueKey: compareValueKey,
        label: year,
        color: "#8a3f1b",
        emphasis: true,
        dashed: false,
        year,
      },
    ];

    const compareSeries = compareYears.map((compareYear, index) => ({
      key: `compare-${compareYear}`,
      valueKey: compareValueKey,
      label: compareYear,
      color: comparePalette[index % comparePalette.length],
      emphasis: false,
      dashed: true,
      year: compareYear,
    }));

    return [...baseSeries, ...compareSeries];
  }, [compareMetric, compareYears, year]);

  const compareMetricLabel = useMemo(() => {
    if (compareMetric === "total") {
      return "Total";
    }
    return (
      amountColumns.find((column) => column.key === compareMetric)?.label ||
      "Total"
    );
  }, [compareMetric]);

  const compareTitle = useMemo(() => {
    const compareSorted = [...compareYears].sort(
      (a, b) => Number(b) - Number(a)
    );
    const titleYears = [year, ...compareSorted.filter((value) => value !== year)];
    return `${compareMetricLabel}: ${titleYears.join(" vs ")}`;
  }, [compareMetricLabel, compareYears, year]);

  useEffect(() => {
    async function loadSummary() {
      setLoading(true);
      setStatus("");
      try {
        const response = await fetch(`/api/cerement?year=${year}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || "Unable to load cerement summary.");
        }
        setEntries(data.entries || []);
      } catch (error) {
        setStatus(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, [year]);

  useEffect(() => {
    setCompareYears([]);
    setCompareEntriesByYear({});
    setCompareLoadingByYear({});
    setCompareErrorsByYear({});
    setHoveredIndex(null);
    setCompareMetric("total");
    setShowLineChart(true);
    setShowBarChart(true);
    setShowPieChart(true);
  }, [year]);

  async function loadCompareYear(yearValue) {
    setCompareLoadingByYear((prev) => ({ ...prev, [yearValue]: true }));
    setCompareErrorsByYear((prev) => {
      const next = { ...prev };
      delete next[yearValue];
      return next;
    });

    try {
      const response = await fetch(`/api/cerement?year=${yearValue}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Unable to load cerement summary.");
      }
      setCompareEntriesByYear((prev) => ({
        ...prev,
        [yearValue]: data.entries || [],
      }));
    } catch (error) {
      setCompareErrorsByYear((prev) => ({
        ...prev,
        [yearValue]: error.message || "Unable to load.",
      }));
    } finally {
      setCompareLoadingByYear((prev) => {
        const next = { ...prev };
        delete next[yearValue];
        return next;
      });
    }
  }

  const monthRows = useMemo(() => {
    return buildMonthRows(year, entries);
  }, [entries, year]);

  const barGroups = useMemo(() => {
    if (compareMetric === "total") {
      return monthTabs.map((tab, index) => {
        const row = monthRows[index];
        const values = amountColumns.map((column, columnIndex) => ({
          key: column.key,
          label: column.label,
          value: row ? Number(row[column.key] || 0) : 0,
          color: barPalette[columnIndex % barPalette.length],
        }));
        return { label: tab.label, values };
      });
    }

    const selectedIndex = amountColumns.findIndex(
      (column) => column.key === compareMetric
    );
    const selectedColor =
      selectedIndex >= 0
        ? barPalette[selectedIndex % barPalette.length]
        : barPalette[0];

    return monthTabs.map((tab, index) => {
      const row = monthRows[index];
      const value = row ? Number(row[compareMetric] || 0) : 0;
      return {
        label: tab.label,
        values: [
          {
            key: compareMetric,
            label: compareMetricLabel,
            value,
            color: selectedColor,
          },
        ],
      };
    });
  }, [compareMetric, compareMetricLabel, monthRows]);

  const barMax = useMemo(() => {
    return Math.max(
      ...barGroups.flatMap((group) => group.values.map((item) => item.value)),
      0
    );
  }, [barGroups]);

  const pieData = useMemo(() => {
    return monthTabs
      .map((tab, index) => {
        const row = monthRows[index];
        const value = row
          ? compareMetric === "total"
            ? row.total || 0
            : row[compareMetric] || 0
          : 0;
        return {
          label: tab.label,
          value,
          color: piePalette[index % piePalette.length],
        };
      })
      .filter((item) => item.value > 0);
  }, [compareMetric, monthRows]);

  const pieTotal = useMemo(() => {
    return pieData.reduce((sum, item) => sum + item.value, 0);
  }, [pieData]);

  const pieSegments = useMemo(() => {
    if (pieTotal <= 0) {
      return [];
    }
    let start = 0;
    return pieData.map((item) => {
      const ratio = item.value / pieTotal;
      const end = start + ratio * 360;
      const segment = { ...item, start, end };
      start = end;
      return segment;
    });
  }, [pieData, pieTotal]);

  const pieStyle = useMemo(() => {
    if (pieTotal <= 0) {
      return {};
    }
    let start = 0;
    const segments = pieData.map((item) => {
      const ratio = item.value / pieTotal;
      const end = start + ratio * 360;
      const segment = `${item.color} ${start.toFixed(2)}deg ${end.toFixed(2)}deg`;
      start = end;
      return segment;
    });
    return {
      background: `conic-gradient(${segments.join(", ")})`,
    };
  }, [pieData, pieTotal]);

  useEffect(() => {
    setPieHover(null);
  }, [pieTotal, compareMetric]);

  const monthRowsByYear = useMemo(() => {
    const map = { [year]: monthRows };
    compareYears.forEach((compareYear) => {
      map[compareYear] = buildMonthRows(
        compareYear,
        compareEntriesByYear[compareYear] || []
      );
    });
    return map;
  }, [compareEntriesByYear, compareYears, monthRows, year]);

  const annualTotals = useMemo(() => {
    return monthRows.reduce(
      (acc, row) => {
        amountColumns.forEach((column) => {
          acc[column.key] += row[column.key] || 0;
        });
        acc.total += row.total || 0;
        return acc;
      },
      {
        amountSifangjie: 0,
        amountHkShop: 0,
        amountHkPickup: 0,
        amountBranchSales: 0,
        amountConsultant: 0,
        total: 0,
      }
    );
  }, [monthRows]);

  const monthsWithData = useMemo(() => {
    return monthRows.filter((row) => row.hasEntry).length;
  }, [monthRows]);

  const previousYears = useMemo(() => {
    const yearValue = Number(year);
    if (!Number.isFinite(yearValue)) {
      return [];
    }
    return Array.from({ length: 5 }, (_, index) =>
      String(yearValue - index - 1)
    );
  }, [year]);

  const hasSeries = chartSeries.length > 0;
  const showAnyChart = showLineChart || showBarChart || showPieChart;
  const showLeftCharts = showLineChart || showBarChart;
  const chartRowClassName =
    showPieChart && showLeftCharts
      ? styles.chartRow
      : `${styles.chartRow} ${styles.chartRowSingle}`;

  useEffect(() => {
    if (!hasSeries) {
      setHoveredIndex(null);
    }
  }, [hasSeries]);

  const chartData = useMemo(() => {
    const width = 680;
    const height = 240;
    const padding = 28;
    const allValues = chartSeries.flatMap((series) => {
      const rows = monthRowsByYear[series.year] || [];
      return rows.map((row) =>
        series.valueKey === "total" ? row.total || 0 : row[series.valueKey] || 0
      );
    });
    const maxTotal = Math.max(...allValues, 0);
    const span = width - padding * 2;
    const step = monthTabs.length > 1 ? span / (monthTabs.length - 1) : 0;

    const pointsBySeries = chartSeries.reduce((acc, series) => {
      const rows = monthRowsByYear[series.year] || [];
      acc[series.key] = monthTabs.map((tab, index) => {
        const row = rows[index];
        const value = row
          ? series.valueKey === "total"
            ? row.total || 0
            : row[series.valueKey] || 0
          : 0;
        const ratio = maxTotal > 0 ? value / maxTotal : 0;
        const x = padding + index * step;
        const y = height - padding - ratio * (height - padding * 2);
        return { x, y, value, label: tab.label };
      });
      return acc;
    }, {});

    return { width, height, padding, step, pointsBySeries, maxTotal };
  }, [chartSeries, monthRowsByYear]);

  const gridLines = useMemo(() => {
    const steps = [0, 0.25, 0.5, 0.75, 1];
    return steps.map((ratio) => {
      const y =
        chartData.height -
        chartData.padding -
        ratio * (chartData.height - chartData.padding * 2);
      return { ratio, y };
    });
  }, [chartData]);

  const hoverPoint = useMemo(() => {
    if (hoveredIndex === null) {
      return null;
    }
    const anchorSeries =
      chartSeries.find(
        (series) => series.year === year && series.valueKey === "total"
      ) || chartSeries[0];
    const basePoints = anchorSeries
      ? chartData.pointsBySeries[anchorSeries.key]
      : null;
    if (!basePoints || !basePoints[hoveredIndex]) {
      return null;
    }
    const row = monthRows[hoveredIndex];
    if (!row) {
      return null;
    }
    return {
      x: basePoints[hoveredIndex].x,
      label: row.label,
      values: chartSeries.map((series) => {
        const rows = monthRowsByYear[series.year] || [];
        const targetRow = rows[hoveredIndex];
        const hasEntry = targetRow?.hasEntry;
        const value = hasEntry
          ? series.valueKey === "total"
            ? targetRow.total || 0
            : targetRow[series.valueKey] || 0
          : null;
        return {
          key: series.key,
          label: series.label,
          color: series.color,
          value,
        };
      }),
    };
  }, [chartData, chartSeries, hoveredIndex, monthRows, monthRowsByYear, year]);

  function handleChartMove(event) {
    if (!hasSeries) {
      setHoveredIndex(null);
      return;
    }
    if (!chartData.step) {
      setHoveredIndex(0);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const clientX = event.touches?.[0]?.clientX ?? event.clientX;
    const ratio = (clientX - rect.left) / rect.width;
    const x = ratio * chartData.width;
    const index = Math.round((x - chartData.padding) / chartData.step);
    setHoveredIndex(clamp(index, 0, monthTabs.length - 1));
  }

  function handlePieMove(event) {
    if (pieTotal <= 0 || pieSegments.length === 0) {
      setPieHover(null);
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
      setPieHover(null);
      return;
    }

    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const normalized = (angle + 450) % 360;
    const index = pieSegments.findIndex(
      (segment) => normalized >= segment.start && normalized < segment.end
    );
    if (index === -1) {
      setPieHover(null);
      return;
    }
    setPieHover({
      index,
      x: clientX - rect.left,
      y: clientY - rect.top,
    });
  }

  function handleCompareToggle(yearValue) {
    const isActive = compareYears.includes(yearValue);
    setCompareYears((prev) => {
      if (prev.includes(yearValue)) {
        return prev.filter((value) => value !== yearValue);
      }
      return [...prev, yearValue];
    });

    if (isActive) {
      return;
    }
    if (compareEntriesByYear[yearValue] || compareLoadingByYear[yearValue]) {
      return;
    }
    loadCompareYear(yearValue);
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link className={styles.backLink} href={`/cerement/${year}`}>
            ← Back to monthly entry
          </Link>
          <h1>壽衣紀錄 · Annual Summary</h1>
          <p>Review yearly cerement totals across each location.</p>
        </div>
        <div className={styles.headerActions}>
          <Link className={styles.overallLink} href="/cerement/summary/overall">
            Overall
          </Link>
          <div className={styles.yearNav}>
            <Link
              className={styles.yearLink}
              href={`/cerement/summary/${Number(year) - 1}`}
            >
              ← {Number(year) - 1}
            </Link>
            <span className={styles.yearBadge}>{year}</span>
            <Link
              className={styles.yearLink}
              href={`/cerement/summary/${Number(year) + 1}`}
            >
              {Number(year) + 1} →
            </Link>
          </div>
        </div>
      </header>

      <section className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Months saved</span>
          <strong>{monthsWithData}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Annual total</span>
          <strong>{formatMoney(annualTotals.total)}</strong>
        </div>
      </section>

      <div className={styles.chartTopActions}>
        <button
          type="button"
          className={styles.chartToggle}
          onClick={() => setControlsOpen((prev) => !prev)}
          aria-expanded={controlsOpen}
          aria-controls="cerement-chart-controls"
        >
          <BsGear aria-hidden />
          Chart options
        </button>
      </div>

      <div className={styles.summaryLayout}>
        <div className={styles.summaryMain}>
          <div className={chartRowClassName}>
            <div className={styles.chartStack}>
              {!showAnyChart ? (
                <div className={styles.chartEmpty}>
                  Select a chart type in Chart options.
                </div>
              ) : null}

              {showLineChart ? (
                <section className={styles.chartCard}>
                  <div className={styles.chartHeader}>
                    <div>
                      <h2>{compareTitle}</h2>
                      <p>Selected metric by month across chosen years.</p>
                    </div>
                    <div className={styles.chartHeaderActions}>
                      <span className={styles.chartNote}>
                        {chartData.maxTotal > 0
                          ? `Peak ${formatMoney(chartData.maxTotal)}`
                          : "No totals yet"}
                      </span>
                    </div>
                  </div>
                  <div className={styles.chartLegend}>
                    {chartSeries.map((series) => (
                      <span key={series.key} className={styles.legendItem}>
                        <span
                          className={styles.legendSwatch}
                          style={{ background: series.color }}
                        />
                        {series.label}
                      </span>
                    ))}
                  </div>
                  <div className={styles.chartWrap}>
                    {hasSeries ? (
                      <>
                        <svg
                          className={styles.chartSvg}
                          viewBox={`0 0 ${chartData.width} ${chartData.height}`}
                          role="img"
                          aria-label="Monthly total line chart"
                          onMouseMove={handleChartMove}
                          onMouseLeave={() => setHoveredIndex(null)}
                          onTouchMove={handleChartMove}
                          onTouchEnd={() => setHoveredIndex(null)}
                        >
                          <title>Monthly cerement totals</title>
                          {gridLines.map((line) => (
                            <line
                              key={line.ratio}
                              className={styles.chartGrid}
                              x1={chartData.padding}
                              x2={chartData.width - chartData.padding}
                              y1={line.y}
                              y2={line.y}
                            />
                          ))}
                          {hoverPoint ? (
                            <line
                              className={styles.chartHoverLine}
                              x1={hoverPoint.x}
                              x2={hoverPoint.x}
                              y1={chartData.padding}
                              y2={chartData.height - chartData.padding}
                            />
                          ) : null}
                          {chartSeries.map((series) => {
                            const points =
                              chartData.pointsBySeries[series.key] || [];
                            return (
                              <g key={series.key}>
                                <polyline
                                  className={`${styles.chartLine} ${
                                    series.emphasis ? styles.chartLineTotal : ""
                                  } ${series.dashed ? styles.chartLineCompare : ""}`}
                                  style={{ stroke: series.color }}
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  points={points
                                    .map((point) => `${point.x},${point.y}`)
                                    .join(" ")}
                                />
                                {points.map((point, index) => (
                                  <circle
                                    key={`${series.key}-${point.label}`}
                                    className={`${styles.chartDot} ${
                                      hoveredIndex === index
                                        ? styles.chartDotActive
                                        : ""
                                    }`}
                                    style={{ fill: series.color }}
                                    cx={point.x}
                                    cy={point.y}
                                    r={hoveredIndex === index ? 5 : 3}
                                  />
                                ))}
                              </g>
                            );
                          })}
                        </svg>
                        {hoverPoint ? (
                          <div
                            className={styles.chartTooltip}
                            style={{
                              left: `${(hoverPoint.x / chartData.width) * 100}%`,
                            }}
                          >
                            <div className={styles.tooltipTitle}>
                              {hoverPoint.label}
                            </div>
                            {hoverPoint.values.map((item) => (
                              <div key={item.key} className={styles.tooltipRow}>
                                <span
                                  className={styles.tooltipSwatch}
                                  style={{ background: item.color }}
                                />
                                <span>{item.label}</span>
                                <span className={styles.tooltipValue}>
                                  {formatMoney(item.value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                        <div className={styles.chartLabels}>
                          {(chartData.pointsBySeries[chartSeries[0]?.key] || []).map(
                            (point) => (
                              <span key={point.label} className={styles.chartLabel}>
                                {point.label}
                              </span>
                            )
                          )}
                        </div>
                      </>
                    ) : (
                      <div className={styles.chartEmpty}>
                        Select at least one line to display.
                      </div>
                    )}
                  </div>
                </section>
              ) : null}

              {showBarChart ? (
                <section className={styles.barCard}>
                <div className={styles.barHeader}>
                  <div>
                    <h3>{`Monthly bars · ${compareMetricLabel}`}</h3>
                    <p>
                      {compareMetric === "total"
                        ? "Store totals grouped by month."
                        : "Selected store totals by month."}
                    </p>
                  </div>
                  <span>
                    {barMax > 0 ? `Max ${formatMoney(barMax)}` : "No totals"}
                  </span>
                </div>
                {compareMetric === "total" ? (
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
                </section>
              ) : null}
            </div>

            {showPieChart ? (
              <section className={styles.pieCard}>
                <div className={styles.pieHeader}>
                  <div>
                    <h3>{`Monthly mix · ${compareMetricLabel}`}</h3>
                    <p>Share of the selected metric across months.</p>
                  </div>
                </div>
                <div className={styles.pieLayout}>
                <div
                  className={styles.pieChart}
                  style={pieTotal > 0 ? pieStyle : undefined}
                  onMouseMove={handlePieMove}
                  onMouseLeave={() => setPieHover(null)}
                  onTouchMove={handlePieMove}
                  onTouchEnd={() => setPieHover(null)}
                >
                  {pieTotal > 0 ? (
                    <span className={styles.pieCenter}>
                      {formatMoney(pieTotal)}
                    </span>
                  ) : (
                    <span>No data</span>
                  )}
                  {pieHover && pieSegments[pieHover.index] ? (
                    <div
                      className={styles.pieTooltip}
                      style={{ left: pieHover.x, top: pieHover.y }}
                    >
                      <div className={styles.pieTooltipTitle}>
                        {pieSegments[pieHover.index].label}
                      </div>
                      <div className={styles.pieTooltipValue}>
                        {formatMoney(pieSegments[pieHover.index].value)}
                      </div>
                    </div>
                  ) : null}
                </div>
                  <div className={styles.pieLegend}>
                    {pieData.length > 0 ? (
                      pieData.map((item) => {
                        const percent = pieTotal
                          ? ((item.value / pieTotal) * 100).toFixed(1)
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
                      <div className={styles.pieEmpty}>No data to display.</div>
                    )}
                  </div>
                </div>
              </section>
            ) : null}
          </div>

          <section className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <div>
                <h2>Monthly totals</h2>
                <p>Totals per location with a full-year rollup.</p>
              </div>
              {loading ? <span className={styles.status}>Loading...</span> : null}
            </div>

            {status ? <div className={styles.statusError}>{status}</div> : null}

            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th className={styles.monthCell}>Month</th>
                    {amountColumns.map((column) => (
                      <th key={column.key}>{column.label}</th>
                    ))}
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {monthRows.map((row) => (
                    <tr key={row.key}>
                      <td className={styles.monthCell}>{row.label}</td>
                      {amountColumns.map((column) => (
                        <td key={column.key}>
                          {row.hasEntry ? formatMoney(row[column.key]) : "-"}
                        </td>
                      ))}
                      <td className={styles.totalCell}>
                        {row.hasEntry ? formatMoney(row.total) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className={styles.monthCell}>Annual total</td>
                    {amountColumns.map((column) => (
                      <td key={column.key}>
                        {formatMoney(annualTotals[column.key])}
                      </td>
                    ))}
                    <td className={styles.totalCell}>
                      {formatMoney(annualTotals.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </div>
      </div>
      {controlsOpen ? (
        <div
          className={styles.chartOptionsOverlay}
          onClick={() => setControlsOpen(false)}
        >
          <aside
            id="cerement-chart-controls"
            className={styles.chartOptionsModal}
            aria-label="Chart options"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <h3>Chart options</h3>
                <p>Select a metric and the years to compare.</p>
              </div>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setControlsOpen(false)}
                aria-label="Close chart options"
              >
                ×
              </button>
            </div>

            <div className={styles.compareSection}>
              <span className={styles.compareSectionTitle}>Charts</span>
              <div className={styles.chartToggleGroup}>
                <label className={styles.chartToggleItem}>
                  <input
                    type="checkbox"
                    checked={showLineChart}
                    onChange={() => setShowLineChart((prev) => !prev)}
                  />
                  <span>Line</span>
                </label>
                <label className={styles.chartToggleItem}>
                  <input
                    type="checkbox"
                    checked={showBarChart}
                    onChange={() => setShowBarChart((prev) => !prev)}
                  />
                  <span>Bar</span>
                </label>
                <label className={styles.chartToggleItem}>
                  <input
                    type="checkbox"
                    checked={showPieChart}
                    onChange={() => setShowPieChart((prev) => !prev)}
                  />
                  <span>Pie</span>
                </label>
              </div>
            </div>

            <div className={styles.compareSection}>
              <span className={styles.compareSectionTitle}>Metric</span>
              <div className={styles.metricBox}>
                <label className={styles.metricItem}>
                  <input
                    type="radio"
                    name="compareMetric"
                    value="total"
                    checked={compareMetric === "total"}
                    onChange={(event) => setCompareMetric(event.target.value)}
                  />
                  <span>Total</span>
                </label>
                {amountColumns.map((column) => (
                  <label key={column.key} className={styles.metricItem}>
                    <input
                      type="radio"
                      name="compareMetric"
                      value={column.key}
                      checked={compareMetric === column.key}
                      onChange={(event) => setCompareMetric(event.target.value)}
                    />
                    <span>{column.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.compareSection}>
              <span className={styles.compareSectionTitle}>Years</span>
              <p className={styles.compareHint}>
                Toggle previous years to compare with {year}.
              </p>
              <div className={styles.compareList}>
                {previousYears.map((yearValue) => (
                  <label key={yearValue} className={styles.compareItem}>
                    <input
                      type="checkbox"
                      checked={compareYears.includes(yearValue)}
                      onChange={() => handleCompareToggle(yearValue)}
                    />
                    <span>{yearValue}</span>
                    {compareLoadingByYear[yearValue] ? (
                      <span className={styles.compareStatus}>Loading...</span>
                    ) : null}
                    {compareErrorsByYear[yearValue] ? (
                      <span className={styles.compareError}>Failed</span>
                    ) : null}
                  </label>
                ))}
                {previousYears.length === 0 ? (
                  <div className={styles.compareEmpty}>No previous years.</div>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </main>
  );
}
