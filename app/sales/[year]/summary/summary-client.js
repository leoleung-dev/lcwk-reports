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

const monthTabs = [
  { label: "All Year", value: "all" },
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

const moneyFormatter = new Intl.NumberFormat("en-HK", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatMoney(value) {
  const amount = Number(value || 0);
  return `$${moneyFormatter.format(amount)}`;
}

function formatPercent(value) {
  const percent = Number(value);
  if (!Number.isFinite(percent)) {
    return "0%";
  }
  const scaled = percent * 100;
  return `${scaled.toFixed(1).replace(/\.0$/, "")}%`;
}

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

export default function SummaryClient({ year: yearProp }) {
  const nowYear = new Date().getFullYear();
  const year = isValidYear(yearProp) ? yearProp : String(nowYear);
  const [months, setMonths] = useState([]);
  const [entries, setEntries] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const selectedLabel = selectedMonth === "all" ? "All Year" : selectedMonth;

  const maxTotal = useMemo(() => {
    return months.reduce((max, item) => Math.max(max, item.total || 0), 0);
  }, [months]);

  const serviceBreakdown = useMemo(() => {
    const totals = entries.reduce((acc, entry) => {
      const key = entry.service;
      acc[key] = (acc[key] || 0) + Number(entry.cost_hkd || 0);
      return acc;
    }, {});
    return Object.entries(totals)
      .map(([name, total]) => ({
        name,
        total,
      }))
      .sort((a, b) => b.total - a.total);
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

  function handleExportSelection() {
    if (!selectedMonth || selectedMonth === "all") {
      window.location.href = `/api/sales/export?year=${year}`;
      return;
    }
    window.location.href = `/api/sales/export?month=${selectedMonth}`;
  }

  function handleExportYear() {
    window.location.href = `/api/sales/export?year=${year}`;
  }

  useEffect(() => {
    setSelectedMonth("all");
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
        const response =
          selectedMonth === "all"
            ? await fetch(`/api/sales?year=${year}`)
            : await fetch(`/api/sales?month=${selectedMonth}`);
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
    if (selectedMonth === "all") {
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
        <div className={styles.headerActions}>
          <div className={styles.yearNav}>
            <Link className={styles.yearLink} href={`/sales/${Number(year) - 1}/summary`}>
              ← {Number(year) - 1}
            </Link>
            <div className={styles.yearBadge}>{year}</div>
            <Link className={styles.yearLink} href={`/sales/${Number(year) + 1}/summary`}>
              {Number(year) + 1} →
            </Link>
          </div>
          <button
            type="button"
            className={styles.exportButton}
            onClick={handleExportYear}
          >
            Export year
          </button>
        </div>
      </header>

      {loading ? <div className={styles.loading}>Loading…</div> : null}
      {status ? <p className={styles.status}>{status}</p> : null}

      <section className={styles.monthTabs}>
        {monthTabs.map((tab) => {
          const value =
            tab.value === "all" ? "all" : `${year}-${tab.value}`;
          const isActive = selectedMonth === value;
          return (
            <button
              key={tab.value}
              type="button"
              className={`${styles.monthTab} ${
                isActive ? styles.monthTabActive : ""
              }`}
              onClick={() => setSelectedMonth(value)}
            >
              {tab.label}
            </button>
          );
        })}
      </section>

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
                  title={`${item.month}: ${formatMoney(item.total)}`}
                  aria-label={`${item.month} total ${formatMoney(item.total)}`}
                >
                  <span className={styles.barFill} style={{ height: `${height}%` }} />
                  <span className={styles.barLabel}>{monthLabels[index]}</span>
                  <span className={styles.barTooltip}>
                    {formatMoney(item.total)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.pieCard}>
          <div className={styles.barHeader}>
            <h2>Service mix ({selectedLabel})</h2>
            <span>{formatMoney(pieTotal)}</span>
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
                      <span>
                        {formatMoney(item.total)} (
                        {formatPercent(item.total / (pieTotal || 1))})
                      </span>
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
          <h2>Entries for {selectedLabel}</h2>
          <div className={styles.tableMeta}>
            <span>{entries.length} entries</span>
            <button
              type="button"
              className={styles.exportButton}
              onClick={handleExportSelection}
            >
              {selectedMonth === "all" ? "Export year" : "Export month"}
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
                      {formatMoney(Number(entry.cost_hkd || 0))}
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
