"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./Summary.module.css";

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

const palette = [
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
];

const currencyFormatter = new Intl.NumberFormat("en-HK", {
  style: "currency",
  currency: "HKD",
});

function isValidYear(value) {
  return /^\d{4}$/.test(value || "");
}

function formatDate(value) {
  if (!value) {
    return "";
  }
  const text = String(value);
  return text.includes("T") ? text.split("T")[0] : text;
}

function getInitialMonth(year) {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const current = `${now.getFullYear()}-${month}`;
  if (current.startsWith(`${year}-`)) {
    return current;
  }
  return `${year}-01`;
}

export default function SummaryClient({ year: yearProp }) {
  const nowYear = new Date().getFullYear();
  const year = isValidYear(yearProp) ? yearProp : String(nowYear);
  const [months, setMonths] = useState([]);
  const [entries, setEntries] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(getInitialMonth(year));
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const maxTotal = useMemo(() => {
    return months.reduce((max, item) => Math.max(max, item.total || 0), 0);
  }, [months]);

  const serviceBreakdown = useMemo(() => {
    const totals = entries.reduce((acc, entry) => {
      const key = entry.service;
      acc[key] = (acc[key] || 0) + Number(entry.cost_hkd || 0);
      return acc;
    }, {});
    return Object.entries(totals).map(([name, total]) => ({
      name,
      total,
    }));
  }, [entries]);

  const pieTotal = useMemo(() => {
    return serviceBreakdown.reduce((sum, item) => sum + item.total, 0);
  }, [serviceBreakdown]);

  const pieStyle = useMemo(() => {
    if (pieTotal === 0) {
      return {};
    }
    let start = 0;
    const segments = serviceBreakdown.map((item, index) => {
      const ratio = item.total / pieTotal;
      const end = start + ratio * 360;
      const color = palette[index % palette.length];
      const segment = `${color} ${start.toFixed(2)}deg ${end.toFixed(2)}deg`;
      start = end;
      return segment;
    });
    return {
      background: `conic-gradient(${segments.join(", ")})`,
    };
  }, [pieTotal, serviceBreakdown]);

  function handleExportMonth() {
    if (!selectedMonth) {
      return;
    }
    window.location.href = `/api/sales/export?month=${selectedMonth}`;
  }

  useEffect(() => {
    setSelectedMonth(getInitialMonth(year));
    setMonths([]);
    setEntries([]);
  }, [year]);

  useEffect(() => {
    async function loadSummary() {
      setLoading(true);
      setStatus("");
      try {
        const response = await fetch(`/api/sales/summary?year=${year}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Unable to load summary.");
        }
        setMonths(data.months || []);
      } catch (error) {
        setStatus(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, [year]);

  useEffect(() => {
    async function loadEntries() {
      if (!selectedMonth) {
        return;
      }
      setLoading(true);
      setStatus("");
      try {
        const response = await fetch(`/api/sales?month=${selectedMonth}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Unable to load month entries.");
        }
        setEntries(data.entries || []);
      } catch (error) {
        setStatus(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadEntries();
  }, [selectedMonth]);

  useEffect(() => {
    if (months.length === 0) {
      return;
    }
    const existing = months.find((item) => item.month === selectedMonth);
    if (!existing) {
      setSelectedMonth(months[0]?.month || "");
    }
  }, [months, selectedMonth]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link className={styles.backLink} href={`/sales/${year}`}>
            ← Back to sales
          </Link>
          <h1>Annual Summary {year}</h1>
          <p>Monthly totals, service breakdown, and detailed entries.</p>
        </div>
        <div className={styles.yearNav}>
          <Link className={styles.yearLink} href={`/sales/${Number(year) - 1}/summary`}>
            ← {Number(year) - 1}
          </Link>
          <div className={styles.yearBadge}>{year}</div>
          <Link className={styles.yearLink} href={`/sales/${Number(year) + 1}/summary`}>
            {Number(year) + 1} →
          </Link>
        </div>
      </header>

      {loading ? <div className={styles.loading}>Loading…</div> : null}
      {status ? <p className={styles.status}>{status}</p> : null}

      <section className={styles.chartSection}>
        <div className={styles.barCard}>
          <div className={styles.barHeader}>
            <h2>Monthly totals</h2>
            <span>Click a month to view details</span>
          </div>
          <div className={styles.barChart}>
            {months.map((item, index) => {
              const height = maxTotal
                ? Math.max((item.total / maxTotal) * 100, 5)
                : 4;
              const isActive = item.month === selectedMonth;
              return (
                <button
                  key={item.month}
                  type="button"
                  className={`${styles.barItem} ${
                    isActive ? styles.barActive : ""
                  }`}
                  onClick={() => setSelectedMonth(item.month)}
                  title={`${item.month}: ${currencyFormatter.format(item.total)}`}
                  aria-label={`${item.month} total ${currencyFormatter.format(
                    item.total
                  )}`}
                >
                  <span className={styles.barFill} style={{ height: `${height}%` }} />
                  <span className={styles.barLabel}>{monthLabels[index]}</span>
                  <span className={styles.barTooltip}>
                    {currencyFormatter.format(item.total)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.pieCard}>
          <div className={styles.barHeader}>
            <h2>Service mix ({selectedMonth})</h2>
            <span>{currencyFormatter.format(pieTotal)}</span>
          </div>
          <div className={styles.pieLayout}>
            <div className={styles.pieChart} style={pieStyle}>
              {pieTotal === 0 ? <span>No data</span> : null}
            </div>
            <div className={styles.legend}>
              {serviceBreakdown.length === 0 ? (
                <p>No services recorded.</p>
              ) : (
                serviceBreakdown.map((item, index) => (
                  <div key={item.name} className={styles.legendItem}>
                    <span
                      className={styles.legendSwatch}
                      style={{ background: palette[index % palette.length] }}
                    />
                    <div>
                      <strong>{item.name}</strong>
                      <span>{currencyFormatter.format(item.total)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <h2>Entries for {selectedMonth}</h2>
          <div className={styles.tableMeta}>
            <span>{entries.length} entries</span>
            <button
              type="button"
              className={styles.exportButton}
              onClick={handleExportMonth}
            >
              Export month
            </button>
          </div>
        </div>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference</th>
                <th>Client name</th>
                <th>Service</th>
                <th className={styles.amount}>Cost</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan="5" className={styles.empty}>
                    No entries for this month.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatDate(entry.entry_date)}</td>
                    <td>{entry.reference}</td>
                    <td>{entry.client_name}</td>
                    <td>{entry.service}</td>
                    <td className={styles.amount}>
                      {currencyFormatter.format(Number(entry.cost_hkd || 0))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
