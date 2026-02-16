"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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

function toYearMetrics(entries) {
  const monthly = monthLabels.map((_, index) =>
    (entries || []).reduce((sum, entry) => {
      const monthKey = String(index + 1).padStart(2, "0");
      return sum + Number(entry?.amounts?.[monthKey] || 0);
    }, 0)
  );

  const total = monthly.reduce((sum, value) => sum + value, 0);
  const agentTotals = {};

  (entries || []).forEach((entry) => {
    const name = String(entry?.staffName || "").trim() || "Unknown";
    const value = monthLabels.reduce((sum, _, index) => {
      const monthKey = String(index + 1).padStart(2, "0");
      return sum + Number(entry?.amounts?.[monthKey] || 0);
    }, 0);
    agentTotals[name] = (agentTotals[name] || 0) + value;
  });

  return { monthly, total, agentTotals };
}

function HkfhSalesOverallContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [years, setYears] = useState([]);
  const [yearData, setYearData] = useState({});
  const [selectedYears, setSelectedYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const selectedYearsFromQuery = useMemo(
    () => parseYearsQueryParam(searchParams?.get("year")),
    [searchParams]
  );

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      setStatus("");
      try {
        const yearsResponse = await fetch("/api/hkfh-sales/years");
        const yearsData = await yearsResponse.json();
        if (!yearsResponse.ok) {
          throw new Error(yearsData?.error || "Unable to load years.");
        }

        const loadedYears = yearsData?.years || [];
        setYears(loadedYears);

        if (loadedYears.length === 0) {
          setYearData({});
          return;
        }

        const yearEntries = await Promise.all(
          loadedYears.map(async (year) => {
            const response = await fetch(`/api/hkfh-sales?year=${year}`);
            const data = await response.json();
            if (!response.ok) {
              throw new Error(
                data?.error || "Unable to load Hong Kong branch sales data."
              );
            }
            return [year, toYearMetrics(data?.entries || [])];
          })
        );
        setYearData(Object.fromEntries(yearEntries));
      } catch (error) {
        setStatus(error.message || "Unable to load overall summary.");
      } finally {
        setLoading(false);
      }
    }

    loadAll();
  }, []);

  const orderedYears = useMemo(
    () => [...years].sort((a, b) => b.localeCompare(a)),
    [years]
  );

  useEffect(() => {
    if (orderedYears.length === 0) {
      setSelectedYears([]);
      return;
    }
    setSelectedYears((prev) => {
      const fromQuery = selectedYearsFromQuery.filter((year) =>
        orderedYears.includes(year)
      );
      if (fromQuery.length > 0) {
        return arraysEqual(prev, fromQuery) ? prev : fromQuery;
      }
      const valid = prev.filter((year) => orderedYears.includes(year));
      if (valid.length > 0) {
        return valid;
      }
      return orderedYears.slice(0, 2);
    });
  }, [orderedYears, selectedYearsFromQuery]);

  useEffect(() => {
    if (!pathname || orderedYears.length === 0) {
      return;
    }

    const normalized = selectedYears.filter((year) => orderedYears.includes(year));
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (normalized.length > 0) {
      params.set("year", normalized.join(","));
    } else {
      params.delete("year");
    }

    const nextQuery = params.toString();
    const currentQuery = searchParams?.toString() || "";
    if (nextQuery === currentQuery) {
      return;
    }
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [selectedYears, orderedYears, pathname, router, searchParams]);

  function toggleYear(year) {
    setSelectedYears((prev) => {
      if (prev.includes(year)) {
        return prev.filter((value) => value !== year);
      }
      return [...prev, year];
    });
  }

  const yearlyRows = useMemo(() => {
    return orderedYears.map((year) => {
      const metrics = yearData[year] || { monthly: monthLabels.map(() => 0), total: 0, agentTotals: {} };
      const topAgent = Object.entries(metrics.agentTotals).sort(
        (a, b) => b[1] - a[1]
      )[0];
      return {
        year,
        total: metrics.total || 0,
        monthly: metrics.monthly || monthLabels.map(() => 0),
        topAgent: topAgent ? topAgent[0] : "-",
        topAgentTotal: topAgent ? topAgent[1] : 0,
      };
    });
  }, [orderedYears, yearData]);

  const yearlyRowsChronological = useMemo(() => {
    return [...yearlyRows].sort((a, b) => a.year.localeCompare(b.year));
  }, [yearlyRows]);

  const yearlyTotalsMax = useMemo(
    () => Math.max(...yearlyRows.map((row) => row.total), 0),
    [yearlyRows]
  );

  const yearlyBars = useMemo(() => {
    return yearlyRowsChronological.map((row, index) => ({
      key: `year-${row.year}`,
      label: row.year,
      bars: [
        {
          key: row.year,
          value: row.total,
          color: yearPalette[index % yearPalette.length],
          tooltipLabel: row.year,
        },
      ],
    }));
  }, [yearlyRowsChronological]);

  const yearlyLineSeries = useMemo(() => {
    return [
      {
        key: "year-total-line",
        label: "Year total",
        values: yearlyRowsChronological.map((row) => row.total),
        color: "#7a3f1e",
      },
    ];
  }, [yearlyRowsChronological]);

  const selectedYearsOrdered = useMemo(
    () => [...selectedYears].sort((a, b) => a.localeCompare(b)),
    [selectedYears]
  );

  const versusLineSeries = useMemo(() => {
    return selectedYearsOrdered.map((year, index) => ({
      key: `versus-${year}`,
      label: year,
      values: yearData[year]?.monthly || monthLabels.map(() => 0),
      color: yearPalette[index % yearPalette.length],
    }));
  }, [selectedYearsOrdered, yearData]);

  const versusMax = useMemo(() => {
    return Math.max(
      ...versusLineSeries.flatMap((series) => series.values || []),
      0
    );
  }, [versusLineSeries]);

  const allYearsAgentPie = useMemo(() => {
    const totals = {};
    yearlyRows.forEach((row) => {
      const agents = yearData[row.year]?.agentTotals || {};
      Object.entries(agents).forEach(([name, value]) => {
        totals[name] = (totals[name] || 0) + Number(value || 0);
      });
    });
    return Object.entries(totals)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [yearData, yearlyRows]);

  const overallGrandTotal = useMemo(
    () => yearlyRows.reduce((sum, row) => sum + row.total, 0),
    [yearlyRows]
  );
  const overallTitlePrefix = "香港分店 營業額";

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link className={styles.backLink} href="/hkfh-sales">
            ← Back to monthly entry
          </Link>
          <h1>{`${overallTitlePrefix} 跨年總結`}</h1>
          <p>Compare yearly totals and monthly trends across available years.</p>
        </div>
      </header>

      {loading ? <div className={styles.status}>Loading...</div> : null}
      {status ? <div className={styles.statusError}>{status}</div> : null}

      {!loading && !status && years.length === 0 ? (
        <div className={styles.empty}>No HK branch sales data yet.</div>
      ) : null}

      {!loading && !status && years.length > 0 ? (
        <>
          <section className={styles.stats}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Years</span>
              <strong>{years.length}</strong>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Overall total</span>
              <strong>{formatMoney(overallGrandTotal)}</strong>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>{`${overallTitlePrefix} 每年總額`}</h2>
            </div>
            <div className={styles.chartGrid}>
              <article className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <h3>每年總額</h3>
                  <span>{formatMoney(overallGrandTotal)}</span>
                </div>
                <BarChart
                  groups={yearlyBars}
                  maxValue={yearlyTotalsMax}
                  columns={Math.max(yearlyBars.length, 1)}
                  formatValue={formatMoney}
                  formatValueLabel={formatCompactMoney}
                  chartHeight={240}
                  ariaLabel="Yearly total bar chart"
                />
              </article>

              <article className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <h3>每年總額趨勢</h3>
                  <span>
                    {yearlyTotalsMax > 0
                      ? `Peak ${formatMoney(yearlyTotalsMax)}`
                      : "No totals"}
                  </span>
                </div>
                <LineChart
                  labels={yearlyRowsChronological.map((row) => row.year)}
                  series={yearlyLineSeries}
                  width={680}
                  height={240}
                  padding={28}
                  maxValue={yearlyTotalsMax}
                  showYAxis
                  formatTooltipValue={formatMoney}
                  ariaLabel="Yearly total trend line"
                  emptyLabel="No yearly totals."
                />
              </article>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>{`${overallTitlePrefix} 跨年對比`}</h2>
                <p>Select years to compare monthly trends.</p>
              </div>
              <div className={styles.yearChecklist}>
                {orderedYears.map((year) => (
                  <label key={`year-opt-${year}`} className={styles.yearOption}>
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
            <article className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3>每月營業額對比</h3>
                <span>
                  {versusMax > 0
                    ? `Peak ${formatMoney(versusMax)}`
                    : "No totals"}
                </span>
              </div>
              <LineChart
                labels={monthLabels}
                series={versusLineSeries}
                width={920}
                height={260}
                padding={30}
                maxValue={versusMax}
                showYAxis
                formatTooltipValue={formatMoney}
                ariaLabel="Monthly trend versus line chart"
                emptyLabel="Select at least one year."
              />
              <div className={styles.legend}>
                {selectedYearsOrdered.map((year, index) => (
                  <span key={`legend-${year}`} className={styles.legendItem}>
                    <span
                      className={styles.legendSwatch}
                      style={{ background: yearPalette[index % yearPalette.length] }}
                    />
                    {year}
                  </span>
                ))}
              </div>
            </article>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>{`${overallTitlePrefix} 經手者總額`}</h2>
            </div>
            <article className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3>跨年經手者營業額</h3>
                <span>{formatMoney(overallGrandTotal)}</span>
              </div>
              <PieChart
                data={allYearsAgentPie}
                palette={piePalette}
                formatValue={formatMoney}
                formatPercent={formatPercent}
                emptyLabel="No totals yet."
              />
            </article>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>{`${overallTitlePrefix} 每年概覽`}</h2>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Total</th>
                    <th>Top 經手人</th>
                    <th>Top 經手人 Total</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyRows.map((row) => (
                    <tr key={`row-${row.year}`}>
                      <td>
                        <Link
                          className={styles.yearLink}
                          href={`/hkfh-sales/summary/${row.year}`}
                        >
                          {row.year}
                        </Link>
                      </td>
                      <td>{formatMoney(row.total)}</td>
                      <td>{row.topAgent}</td>
                      <td>{formatMoney(row.topAgentTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}

export default function HkfhSalesOverallClient() {
  return (
    <Suspense fallback={<main className={styles.page}>Loading...</main>}>
      <HkfhSalesOverallContent />
    </Suspense>
  );
}
