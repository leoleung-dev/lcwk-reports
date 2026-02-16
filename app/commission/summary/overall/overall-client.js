"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BarChart from "@/app/components/charts/BarChart";
import LineChart from "@/app/components/charts/LineChart";
import PieChart from "@/app/components/charts/PieChart";
import styles from "./Overall.module.css";

const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const yearPalette = [
  "#a35b2a",
  "#d4a373",
  "#7a3f1e",
  "#b07d62",
  "#9c6644",
  "#cb997e",
  "#6f4e37",
  "#ce8a52",
  "#8a5a44",
  "#b5651d",
];

const piePalette = [
  "#a35b2a",
  "#ce8a52",
  "#7a3f1e",
  "#d4a373",
  "#6f4e37",
  "#b5651d",
  "#9c6644",
  "#cb997e",
  "#8a5a44",
  "#b07d62",
  "#6b4226",
  "#d7b08b",
];

const spotlightHandler = "梁家強";

const moneyFormatter = new Intl.NumberFormat("en-HK", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactMoneyFormatter = new Intl.NumberFormat("en-HK", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatMoney(value) {
  const amount = Number(value || 0);
  return `$${moneyFormatter.format(amount)}`;
}

function formatCompactMoney(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) {
    return "$0";
  }
  return `$${compactMoneyFormatter.format(amount)}`;
}

function formatPercent(value) {
  const percent = Number(value);
  if (!Number.isFinite(percent)) {
    return "0%";
  }
  const scaled = percent * 100;
  return `${scaled.toFixed(1).replace(/\.0$/, "")}%`;
}

function formatMonthLabel(value) {
  const monthText = String(value || "");
  const monthNumber = Number(monthText.slice(-2));
  if (!monthNumber || monthNumber < 1 || monthNumber > 12) {
    return "-";
  }
  return monthLabels[monthNumber - 1];
}

function getMetricKey(metric) {
  return metric === "commission" ? "total_commission" : "total";
}

function parseYearsQueryParam(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return [];
  }
  const seen = new Set();
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => /^\d{4}$/.test(item))
    .filter((item) => {
      if (seen.has(item)) {
        return false;
      }
      seen.add(item);
      return true;
    });
}

function arraysEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) {
      return false;
    }
  }
  return true;
}

function buildMonthTotals(summary, metricKey) {
  const totalsByMonth = {};
  (summary?.months || []).forEach((month) => {
    totalsByMonth[month] = 0;
  });
  (summary?.rows || []).forEach((row) => {
    const value = Number(row?.[metricKey] || 0);
    totalsByMonth[row.month] = (totalsByMonth[row.month] || 0) + value;
  });
  return totalsByMonth;
}

function buildHandlerTotals(summary, metricKey) {
  const totalsByHandler = {};
  (summary?.rows || []).forEach((row) => {
    const value = Number(row?.[metricKey] || 0);
    totalsByHandler[row.handler] =
      (totalsByHandler[row.handler] || 0) + value;
  });
  return totalsByHandler;
}


function buildHandlerBreakdown(totalsByHandler, spotlightName = "") {
  const rows = Object.entries(totalsByHandler)
    .map(([handler, total]) => ({ handler, total }))
    .sort((a, b) => b.total - a.total);
  const spotlight = spotlightName
    ? rows.find((row) => row.handler === spotlightName) || null
    : null;
  const remainderRows = spotlight
    ? rows.filter((row) => row.handler !== spotlightName)
    : rows;
  return { spotlight, rows: remainderRows };
}

function buildPieData(handlerRows) {
  const data = handlerRows
    .map((row, index) => ({
      label: row.handler,
      value: row.total,
      color: piePalette[index % piePalette.length],
    }))
    .filter((item) => item.value > 0);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) {
    return { data: [], total: 0, style: {} };
  }

  let start = 0;
  const segments = data.map((item) => {
    const ratio = item.value / total;
    const end = start + ratio * 360;
    const segment = { ...item, start, end };
    start = end;
    return segment;
  });

  return {
    data,
    total,
    style: {
      background: `conic-gradient(${segments
        .map(
          (segment) =>
            `${segment.color} ${segment.start.toFixed(2)}deg ${segment.end.toFixed(
              2
            )}deg`
        )
        .join(", ")})`,
    },
  };
}

export default function CommissionSummaryOverallClient() {
  const [years, setYears] = useState([]);
  const [summariesByYear, setSummariesByYear] = useState({});
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [versusMetric, setVersusMetric] = useState("sales");
  const [selectedYears, setSelectedYears] = useState([]);
  const [metricByYear, setMetricByYear] = useState({});

  useEffect(() => {
    async function loadYears() {
      setLoading(true);
      setStatus("");
      try {
        const response = await fetch("/api/commission/years");
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

    async function loadSummaries() {
      setLoading(true);
      setStatus("");
      try {
        const results = await Promise.all(
          years.map(async (year) => {
            const response = await fetch(`/api/commission/summary?year=${year}`);
            const data = await response.json();
            if (!response.ok) {
              throw new Error(data?.error || "Unable to load commission summary.");
            }
            return [year, data];
          })
        );
        if (!cancelled) {
          setSummariesByYear(Object.fromEntries(results));
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

    loadSummaries();

    return () => {
      cancelled = true;
    };
  }, [years]);

  const orderedYears = useMemo(() => {
    return [...years].sort((a, b) => b.localeCompare(a));
  }, [years]);

  const selectedYearsOrdered = useMemo(() => {
    return [...selectedYears]
      .filter((year) => years.includes(year))
      .sort((a, b) => a.localeCompare(b));
  }, [selectedYears, years]);

  useEffect(() => {
    if (orderedYears.length === 0) {
      setSelectedYears([]);
      return;
    }

    setSelectedYears((prev) => {
      const fromQuery =
        typeof window === "undefined"
          ? []
          : parseYearsQueryParam(
              new URLSearchParams(window.location.search).get("year")
            ).filter((year) => orderedYears.includes(year));

      if (fromQuery.length > 0) {
        return arraysEqual(prev, fromQuery) ? prev : fromQuery;
      }

      const valid = prev.filter((year) => orderedYears.includes(year));
      if (valid.length > 0) {
        return valid;
      }

      return orderedYears.slice(0, 2);
    });
  }, [orderedYears]);

  useEffect(() => {
    if (typeof window === "undefined" || orderedYears.length === 0) {
      return;
    }

    const normalized = selectedYears.filter((year) => orderedYears.includes(year));
    const url = new URL(window.location.href);
    if (normalized.length > 0) {
      url.searchParams.set("year", normalized.join(","));
    } else {
      url.searchParams.delete("year");
    }

    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextUrl !== currentUrl) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [selectedYears, orderedYears]);

  useEffect(() => {
    if (years.length === 0) {
      return;
    }
    setMetricByYear((prev) => {
      const next = { ...prev };
      years.forEach((year) => {
        if (!next[year]) {
          next[year] = "sales";
        }
      });
      return next;
    });
  }, [years]);

  function toggleYear(year) {
    setSelectedYears((prev) => {
      if (prev.includes(year)) {
        return prev.filter((value) => value !== year);
      }
      return [...prev, year];
    });
  }

  const versusData = useMemo(() => {
    const metricKey = getMetricKey(versusMetric);
    if (selectedYearsOrdered.length === 0) {
      return {
        rows: [],
        maxTotal: 0,
        spotlight: null,
        spotlightMax: 0,
        totalsByYear: {},
        selectedYears: [],
      };
    }

    const totalsByYear = {};
    const totalsByHandlerYear = {};
    selectedYearsOrdered.forEach((year) => {
      totalsByYear[year] = 0;
      const summary = summariesByYear[year];
      (summary?.rows || []).forEach((row) => {
        const value = Number(row?.[metricKey] || 0);
        totalsByYear[year] += value;
        if (!totalsByHandlerYear[row.handler]) {
          totalsByHandlerYear[row.handler] = {};
        }
        totalsByHandlerYear[row.handler][year] =
          (totalsByHandlerYear[row.handler][year] || 0) + value;
      });
    });

    const handlers = Object.keys(totalsByHandlerYear);
    const rows = handlers
      .map((handler) => {
        const totals = {};
        selectedYearsOrdered.forEach((year) => {
          totals[year] = totalsByHandlerYear[handler]?.[year] || 0;
        });
        const max = Math.max(
          ...selectedYearsOrdered.map((year) => totals[year] || 0),
          0
        );
        return { handler, totals, max };
      })
      .sort((a, b) => b.max - a.max);
    const spotlight = rows.find((row) => row.handler === spotlightHandler) || null;
    const comparisonRows = rows.filter(
      (row) => row.handler !== spotlightHandler
    );
    const maxTotal = Math.max(...comparisonRows.map((row) => row.max), 0);
    const spotlightMax = spotlight
      ? Math.max(
          ...selectedYearsOrdered.map(
            (year) => spotlight.totals?.[year] || 0
          ),
          0
        )
      : 0;

    return {
      rows: comparisonRows,
      maxTotal,
      spotlight,
      spotlightMax,
      totalsByYear,
      selectedYears: selectedYearsOrdered,
    };
  }, [summariesByYear, versusMetric, selectedYearsOrdered]);

  const metricLabel = versusMetric === "commission" ? "Commission" : "Sales";
  const versusMetricLabel =
    versusMetric === "commission" ? "佣金" : "銷售額";
  const hasVersusRows = versusData.rows.length > 0;
  const hasSpotlight = Boolean(versusData.spotlight);
  const combinedVersusRows = hasSpotlight
    ? [versusData.spotlight, ...versusData.rows]
    : versusData.rows;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link className={styles.backLink} href="/commission">
            ← Back to commission
          </Link>
          <h1>梁津煥記(禮儀顧問) 佣金登記 跨年總結</h1>
          <p>Compare agent performance across years and review annual trends.</p>
        </div>
      </header>

      {loading ? <div className={styles.status}>Loading...</div> : null}
      {status ? <div className={styles.statusError}>{status}</div> : null}
      {!loading && years.length === 0 ? (
        <div className={styles.empty}>No commission data yet.</div>
      ) : null}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>梁津煥記(禮儀顧問) 佣金登記 跨年對比</h2>
            <p>Compare agent totals across selected years.</p>
          </div>
          <div className={styles.sectionControls}>
            <div className={styles.control}>
              Years
              <div className={styles.yearChecklist}>
                {orderedYears.map((year) => (
                  <label key={year} className={styles.yearOption}>
                    <input
                      type="checkbox"
                      checked={selectedYears.includes(year)}
                      onChange={() => toggleYear(year)}
                    />
                    <span>{year}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className={styles.metricToggle}>
              <button
                type="button"
                className={`${styles.metricButton} ${
                  versusMetric === "sales" ? styles.metricActive : ""
                }`}
                onClick={() => setVersusMetric("sales")}
              >
                Sales
              </button>
              <button
                type="button"
                className={`${styles.metricButton} ${
                  versusMetric === "commission" ? styles.metricActive : ""
                }`}
                onClick={() => setVersusMetric("commission")}
              >
                Commission
              </button>
            </div>
          </div>
        </div>

        <div className={styles.versusCard}>
          {!hasVersusRows && !hasSpotlight ? (
            <div className={styles.emptyPanel}>Select years to compare.</div>
          ) : (
            <>
              <div className={styles.chartTitle}>
                <span className={styles.chartTitleMetric}>
                  {`梁津煥記(禮儀顧問) 佣金登記 ${versusMetricLabel}`}
                </span>
                <span className={styles.chartTitleYears}>
                  {versusData.selectedYears.map((year, index) => (
                    <span key={`title-${year}`}>
                      {index > 0 ? (
                        <span className={styles.chartTitleSep}>vs</span>
                      ) : null}
                      <span
                        className={styles.chartTitleYear}
                        style={{
                          "--year-color": yearPalette[index % yearPalette.length],
                        }}
                      >
                        {year}
                      </span>
                    </span>
                  ))}
                </span>
              </div>
              <BarChart
                groups={combinedVersusRows.map((row) => ({
                  key: row.handler,
                  label: row.handler,
                  maxValue:
                    row.handler === spotlightHandler
                      ? versusData.spotlightMax
                      : versusData.maxTotal,
                  bars: versusData.selectedYears.map((year, index) => ({
                    key: `${row.handler}-${year}`,
                    label: year,
                    value: row.totals?.[year] || 0,
                    color: yearPalette[index % yearPalette.length],
                    tooltipLabel: year,
                  })),
                }))}
                groupClassName={(group) =>
                  group.key === spotlightHandler ? styles.barGroupSpotlight : ""
                }
                formatValue={formatMoney}
                formatValueLabel={formatCompactMoney}
                chartHeight={240}
                ariaLabel={`${metricLabel} comparison by agent`}
              />
              <div className={styles.versusLegend}>
                {versusData.selectedYears.map((year, index) => (
                  <div key={year} className={styles.legendItem}>
                    <span
                      className={styles.legendSwatch}
                      style={{
                        background: yearPalette[index % yearPalette.length],
                      }}
                    />
                    <span>
                      {year} · {formatMoney(versusData.totalsByYear?.[year] || 0)}
                    </span>
                  </div>
                ))}
                <span className={styles.legendMeta}>{metricLabel} totals</span>
              </div>
              <p className={styles.legendNote}>
                {hasSpotlight
                  ? "梁家強 has been separated from the comparison and remaining agents share the same scale."
                  : "Remaining agents share the same scale."}
              </p>
            </>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>梁津煥記(禮儀顧問) 佣金登記 每年概覽</h2>
            <p>Monthly trends plus agent totals and share for each year.</p>
          </div>
        </div>

        <div className={styles.yearGrid}>
          {orderedYears.map((year) => {
            const summary = summariesByYear[year];
            const yearMetric = metricByYear[year] || "sales";
            const metricKey = getMetricKey(yearMetric);
            const totalsByMonth = buildMonthTotals(summary, metricKey);
            const months = summary?.months || [];
            const lineLabels = months.map((month) => formatMonthLabel(month));
            const lineValues = months.map((month) => totalsByMonth[month] || 0);
            const lineMax = Math.max(...lineValues, 0);
            const handlerTotals = buildHandlerTotals(summary, metricKey);
            const handlerBreakdown = buildHandlerBreakdown(
              handlerTotals,
              spotlightHandler
            );
            const barRows = handlerBreakdown.rows;
            const barMax = Math.max(...barRows.map((row) => row.total), 0);
            const spotlightRow = handlerBreakdown.spotlight;
            const spotlightMax = spotlightRow ? spotlightRow.total : 0;
            const combinedBarRows = spotlightRow
              ? [spotlightRow, ...barRows]
              : barRows;
            const barColumns = combinedBarRows.length || 1;
            const pieRows = combinedBarRows;
            const pieData = buildPieData(pieRows);
            const yearTotal = Object.values(totalsByMonth).reduce(
              (sum, value) => sum + value,
              0
            );
            const yearMetricLabel =
              yearMetric === "commission" ? "Commission" : "Sales";
            const yearMetricLabelCn =
              yearMetric === "commission" ? "佣金" : "銷售額";

            return (
              <article key={year} className={styles.yearCard}>
                <div className={styles.yearHeader}>
                  <div>
                    <h3>{year}</h3>
                    <span className={styles.yearTotal}>
                      {formatMoney(yearTotal)}
                    </span>
                  </div>
                  <div className={styles.yearControls}>
                    <div className={styles.metricToggle}>
                      <button
                        type="button"
                        className={`${styles.metricButton} ${
                          yearMetric === "sales" ? styles.metricActive : ""
                        }`}
                        onClick={() =>
                          setMetricByYear((prev) => ({
                            ...prev,
                            [year]: "sales",
                          }))
                        }
                      >
                        Sales
                      </button>
                      <button
                        type="button"
                        className={`${styles.metricButton} ${
                          yearMetric === "commission" ? styles.metricActive : ""
                        }`}
                        onClick={() =>
                          setMetricByYear((prev) => ({
                            ...prev,
                            [year]: "commission",
                          }))
                        }
                      >
                        Commission
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.overviewLayout}>
                  <div className={styles.overviewLeft}>
                    <div className={styles.chartCard}>
                      <div className={styles.chartHeader}>
                        <h4>{`${year}年 每月${yearMetricLabelCn}`}</h4>
                        <span>
                          {lineMax > 0
                            ? `Peak ${formatMoney(lineMax)}`
                            : "No totals"}
                        </span>
                      </div>
                      <LineChart
                        labels={lineLabels}
                        series={[
                          {
                            key: `${year}-line`,
                            values: lineValues,
                          },
                        ]}
                        width={640}
                        height={220}
                        padding={28}
                        maxValue={lineMax}
                        ariaLabel={`${year} ${yearMetricLabel} monthly trend`}
                      />
                    </div>

                    <div className={styles.chartCard}>
                      <div className={styles.chartHeader}>
                        <h4>{`${year}年 經手者${yearMetricLabelCn}`}</h4>
                        <span>{combinedBarRows.length} agents</span>
                      </div>
                      {barRows.length === 0 ? (
                        <div className={styles.chartEmpty}>No agent totals.</div>
                      ) : (
                        <BarChart
                          groups={combinedBarRows.map((row, index) => ({
                            key: row.handler,
                            label: row.handler,
                            maxValue:
                              row.handler === spotlightHandler
                                ? spotlightMax
                                : barMax,
                            bars: [
                              {
                                key: `${row.handler}-total`,
                                value: row.total,
                                color: piePalette[index % piePalette.length],
                                tooltipLabel: row.handler,
                              },
                            ],
                          }))}
                          groupClassName={(group) =>
                            group.key === spotlightHandler
                              ? styles.barGroupSpotlight
                              : ""
                          }
                          maxValue={barMax}
                          columns={barColumns}
                          formatValue={formatMoney}
                          formatValueLabel={formatCompactMoney}
                          chartHeight={220}
                          ariaLabel={`${year} ${yearMetricLabel} by agent`}
                        />
                      )}
                    </div>
                  </div>

                  <div className={styles.pieCard}>
                    <div className={styles.chartHeader}>
                      <h4>{`${year}年 經手者${yearMetricLabelCn}`}</h4>
                      <span>
                        {pieData.total > 0
                          ? formatMoney(pieData.total)
                          : "No data"}
                      </span>
                    </div>
                    <PieChart
                      data={pieData.data.map((item) => ({
                        label: item.label,
                        value: item.value,
                        color: item.color,
                      }))}
                      formatValue={formatMoney}
                      formatPercent={formatPercent}
                      emptyLabel="No entries."
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
