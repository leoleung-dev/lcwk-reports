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

const moneyFormatter = new Intl.NumberFormat("en-HK", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactMoneyFormatter = new Intl.NumberFormat("en-HK", {
  notation: "compact",
  maximumFractionDigits: 1,
});

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

function formatMoney(value) {
  const amount = Number(value || 0);
  return `$${moneyFormatter.format(amount)}`;
}

function formatCompactMoney(value) {
  const amount = Number(value || 0);
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

function buildMonthTotals(months) {
  const totalsByMonth = {};
  (months || []).forEach((row) => {
    totalsByMonth[row.month] = Number(row.total || 0);
  });
  return totalsByMonth;
}
export default function SalesSummaryOverallClient() {
  const [years, setYears] = useState([]);
  const [summariesByYear, setSummariesByYear] = useState({});
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedYears, setSelectedYears] = useState([]);

  useEffect(() => {
    async function loadYears() {
      setLoading(true);
      setStatus("");
      try {
        const response = await fetch("/api/sales/years");
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
            const response = await fetch(`/api/sales/summary?year=${year}`);
            const data = await response.json();
            if (!response.ok) {
              throw new Error(data?.error || "Unable to load sales summary.");
            }
            return [year, data.months || []];
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

  function toggleYear(year) {
    setSelectedYears((prev) => {
      if (prev.includes(year)) {
        return prev.filter((value) => value !== year);
      }
      return [...prev, year];
    });
  }

  const versusData = useMemo(() => {
    if (selectedYearsOrdered.length === 0) {
      return {
        groups: [],
        maxTotal: 0,
        totalsByYear: {},
        selectedYears: [],
      };
    }

    const totalsByYear = {};
    const totalsByMonthYear = {};
    selectedYearsOrdered.forEach((year) => {
      totalsByYear[year] = 0;
      totalsByMonthYear[year] = Array.from({ length: 12 }, () => 0);
      const months = summariesByYear[year] || [];
      months.forEach((item) => {
        const monthIndex = Number(String(item.month || "").slice(-2)) - 1;
        if (monthIndex < 0 || monthIndex >= 12) {
          return;
        }
        const value = Number(item.total || 0);
        totalsByMonthYear[year][monthIndex] = value;
        totalsByYear[year] += value;
      });
    });

    const maxTotal = Math.max(
      ...selectedYearsOrdered.flatMap((year) => totalsByMonthYear[year]),
      0
    );
    const groups = monthLabels.map((label, index) => ({
      key: `month-${index}`,
      label,
      bars: selectedYearsOrdered.map((year, yearIndex) => ({
        key: `${year}-${label}`,
        label: year,
        value: totalsByMonthYear[year][index] || 0,
        color: yearPalette[yearIndex % yearPalette.length],
        tooltipLabel: year,
      })),
    }));

    return {
      groups,
      maxTotal,
      totalsByYear,
      selectedYears: selectedYearsOrdered,
    };
  }, [summariesByYear, selectedYearsOrdered]);

  const hasVersusRows = versusData.groups.length > 0;
  const hasYearData = orderedYears.length > 0;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link className={styles.backLink} href="/sales">
            ← Back to sales
          </Link>
          <h1>Sales Overall Summary</h1>
          <p>Compare yearly sales performance and review monthly trends.</p>
        </div>
      </header>

      {loading ? <div className={styles.status}>Loading...</div> : null}
      {status ? <div className={styles.statusError}>{status}</div> : null}
      {!loading && years.length === 0 ? (
        <div className={styles.empty}>No sales data yet.</div>
      ) : null}

      {hasYearData ? (
        <>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>Versus</h2>
                <p>Compare monthly sales totals across selected years.</p>
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
              </div>
            </div>

            <div className={styles.versusCard}>
              {!hasVersusRows ? (
                <div className={styles.emptyPanel}>
                  Select years to compare.
                </div>
              ) : (
                <>
                  <div className={styles.chartTitle}>
                    <span className={styles.chartTitleMetric}>Sales:</span>
                    <span className={styles.chartTitleYears}>
                      {versusData.selectedYears.map((year, index) => (
                        <span key={`title-${year}`}>
                          {index > 0 ? (
                            <span className={styles.chartTitleSep}>vs</span>
                          ) : null}
                          <span
                            className={styles.chartTitleYear}
                            style={{
                              "--year-color":
                                yearPalette[index % yearPalette.length],
                            }}
                          >
                            {year}
                          </span>
                        </span>
                      ))}
                    </span>
                  </div>
                  <BarChart
                    groups={versusData.groups}
                    maxValue={versusData.maxTotal}
                    columns={12}
                    formatValue={formatMoney}
                    formatValueLabel={formatCompactMoney}
                    chartHeight={240}
                    ariaLabel="Sales comparison by month"
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
                          {year} · {formatMoney(versusData.totalsByYear[year])}
                        </span>
                      </div>
                    ))}
                    <span className={styles.legendMeta}>Sales totals</span>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>Yearly overview</h2>
                <p>Monthly trends plus totals and share for each year.</p>
              </div>
            </div>

            <div className={styles.yearGrid}>
              {orderedYears.map((year) => {
                const months = summariesByYear[year] || [];
                const totalsByMonth = buildMonthTotals(months);
                const monthTotals = monthLabels.map((_, index) => {
                  const monthKey = `${year}-${String(index + 1).padStart(2, "0")}`;
                  return totalsByMonth[monthKey] || 0;
                });
                const lineMax = Math.max(...monthTotals, 0);
                const yearTotal = monthTotals.reduce(
                  (sum, value) => sum + value,
                  0
                );
                const barGroups = monthLabels.map((label, index) => ({
                  key: `${year}-${label}`,
                  label,
                  bars: [
                    {
                      key: `${year}-${label}-total`,
                      value: monthTotals[index] || 0,
                      color: piePalette[index % piePalette.length],
                      tooltipLabel: label,
                    },
                  ],
                }));
                const barMax = Math.max(...monthTotals, 0);
                const pieData = monthLabels
                  .map((label, index) => ({
                    label,
                    value: monthTotals[index] || 0,
                  }))
                  .filter((item) => item.value > 0);

                return (
                  <article key={year} className={styles.yearCard}>
                    <div className={styles.yearHeader}>
                      <div>
                        <h3>{year}</h3>
                        <span className={styles.yearTotal}>
                          {formatMoney(yearTotal)}
                        </span>
                      </div>
                    </div>

                    <div className={styles.overviewLayout}>
                      <div className={styles.overviewLeft}>
                        <div className={styles.chartCard}>
                          <div className={styles.chartHeader}>
                            <h4>Sales monthly trend</h4>
                            <span>
                              {lineMax > 0
                                ? `Peak ${formatMoney(lineMax)}`
                                : "No totals"}
                            </span>
                          </div>
                          <LineChart
                            labels={monthLabels}
                            series={[
                              {
                                key: `${year}-line`,
                                values: monthTotals,
                              },
                            ]}
                            width={640}
                            height={220}
                            padding={28}
                            maxValue={lineMax}
                            ariaLabel={`${year} sales monthly trend`}
                          />
                        </div>

                        <div className={styles.chartCard}>
                          <div className={styles.chartHeader}>
                            <h4>Sales by month</h4>
                            <span>{monthLabels.length} months</span>
                          </div>
                          <BarChart
                            groups={barGroups}
                            maxValue={barMax}
                            columns={12}
                            formatValue={formatMoney}
                            formatValueLabel={formatCompactMoney}
                            chartHeight={220}
                            ariaLabel={`${year} sales by month`}
                          />
                        </div>
                      </div>

                      <div className={styles.pieCard}>
                        <div className={styles.chartHeader}>
                          <h4>Sales share</h4>
                          <span>
                            {yearTotal > 0
                              ? formatMoney(yearTotal)
                              : "No data"}
                          </span>
                        </div>
                        <PieChart
                          data={pieData}
                          palette={piePalette}
                          formatValue={formatMoney}
                          formatPercent={formatPercent}
                          emptyLabel="No data."
                        />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      ) : !loading && years.length > 0 ? (
        <div className={styles.empty}>No sales data yet.</div>
      ) : null}
    </main>
  );
}
