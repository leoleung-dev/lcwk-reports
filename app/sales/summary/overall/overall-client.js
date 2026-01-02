"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

function formatMoney(value) {
  const amount = Number(value || 0);
  return `$${moneyFormatter.format(amount)}`;
}

function formatMonthLabel(value) {
  const monthText = String(value || "");
  const monthNumber = Number(monthText.slice(-2));
  if (!monthNumber || monthNumber < 1 || monthNumber > 12) {
    return "-";
  }
  return monthLabels[monthNumber - 1];
}

function buildLineData(items) {
  const width = 720;
  const height = 260;
  const padding = 32;
  const values = items.map((item) => item.total);
  const maxTotal = Math.max(...values, 0);
  const span = width - padding * 2;
  const step = items.length > 1 ? span / (items.length - 1) : 0;
  const points = values.map((value, index) => {
    const ratio = maxTotal > 0 ? value / maxTotal : 0;
    const x = padding + index * step;
    const y = height - padding - ratio * (height - padding * 2);
    return { x, y, label: items[index].year, value };
  });
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const y = height - padding - ratio * (height - padding * 2);
    return { ratio, y };
  });

  return { width, height, padding, points, maxTotal, gridLines };
}

export default function SalesSummaryOverallClient() {
  const [years, setYears] = useState([]);
  const [summariesByYear, setSummariesByYear] = useState({});
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

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
    return [...years].sort();
  }, [years]);

  const yearSummaries = useMemo(() => {
    return orderedYears.map((year) => {
      const months = summariesByYear[year] || [];
      const total = months.reduce((sum, item) => sum + Number(item.total || 0), 0);
      const monthsWithData = months.filter((item) => Number(item.total || 0) > 0)
        .length;
      const average = months.length ? total / months.length : 0;
      const bestMonth = months.reduce(
        (best, item) =>
          Number(item.total || 0) > Number(best.total || 0) ? item : best,
        { total: 0, month: "" }
      );
      return {
        year,
        months,
        total,
        average,
        monthsWithData,
        bestMonth,
      };
    });
  }, [orderedYears, summariesByYear]);

  const summariesWithData = yearSummaries.filter((item) => item.total > 0);
  const hasData = summariesWithData.length > 0;
  const totalAllYears = summariesWithData.reduce(
    (sum, item) => sum + item.total,
    0
  );
  const bestYear = summariesWithData.reduce(
    (best, item) => (item.total > (best?.total || 0) ? item : best),
    null
  );
  const averageYear = hasData ? totalAllYears / summariesWithData.length : 0;
  const lineData = useMemo(
    () => buildLineData(summariesWithData),
    [summariesWithData]
  );

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link className={styles.backLink} href="/sales">
            ← Back to sales
          </Link>
          <h1>Sales Overall Summary</h1>
          <p>Annual sales totals and year-over-year trends.</p>
        </div>
      </header>

      {loading ? <div className={styles.status}>Loading...</div> : null}
      {status ? <div className={styles.statusError}>{status}</div> : null}
      {!loading && years.length === 0 ? (
        <div className={styles.empty}>No sales data yet.</div>
      ) : null}

      {hasData ? (
        <>
          <section className={styles.stats}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Years with data</span>
              <strong>{summariesWithData.length}</strong>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Total revenue</span>
              <strong>{formatMoney(totalAllYears)}</strong>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Best year</span>
              <strong>
                {bestYear
                  ? `${bestYear.year} - ${formatMoney(bestYear.total)}`
                  : "-"}
              </strong>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Average per year</span>
              <strong>{formatMoney(averageYear)}</strong>
            </div>
          </section>

          <section className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <h2>Yearly totals trend</h2>
                <p>Track growth across each recorded year.</p>
              </div>
              <span>
                {lineData.maxTotal > 0
                  ? `Peak ${formatMoney(lineData.maxTotal)}`
                  : "No totals"}
              </span>
            </div>
            {lineData.maxTotal > 0 ? (
              <>
                <svg
                  className={styles.chartSvg}
                  viewBox={`0 0 ${lineData.width} ${lineData.height}`}
                  role="img"
                  aria-label="Yearly totals line chart"
                >
                  <title>Yearly sales totals</title>
                  {lineData.gridLines.map((line) => (
                    <line
                      key={line.ratio}
                      className={styles.chartGrid}
                      x1={lineData.padding}
                      x2={lineData.width - lineData.padding}
                      y1={line.y}
                      y2={line.y}
                    />
                  ))}
                  <polyline
                    className={styles.chartLine}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={lineData.points
                      .map((point) => `${point.x},${point.y}`)
                      .join(" ")}
                  />
                  {lineData.points.map((point) => (
                    <circle
                      key={point.label}
                      className={styles.chartDot}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                    />
                  ))}
                </svg>
                <div className={styles.chartLabels}>
                  {lineData.points.map((point) => (
                    <span key={point.label}>{point.label}</span>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.chartEmpty}>No data yet.</div>
            )}
          </section>

          <section className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <h2>Yearly breakdown</h2>
              <span className={styles.tableMeta}>
                {summariesWithData.length} years
              </span>
            </div>
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Year</th>
                    <th className={styles.amount}>Total</th>
                    <th className={styles.amount}>Average / month</th>
                    <th>Best month</th>
                    <th>Months with data</th>
                  </tr>
                </thead>
                <tbody>
                  {summariesWithData.map((item) => (
                    <tr key={item.year}>
                      <td>{item.year}</td>
                      <td className={styles.amount}>
                        {formatMoney(item.total)}
                      </td>
                      <td className={styles.amount}>
                        {formatMoney(item.average)}
                      </td>
                      <td>
                        {item.bestMonth?.total
                          ? `${formatMonthLabel(item.bestMonth.month)} - ${formatMoney(
                              item.bestMonth.total
                            )}`
                          : "-"}
                      </td>
                      <td>{item.monthsWithData}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : !loading && years.length > 0 ? (
        <div className={styles.empty}>No sales data yet.</div>
      ) : null}
    </main>
  );
}
