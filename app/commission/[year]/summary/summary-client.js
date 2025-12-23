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

function isValidYear(value) {
  return /^\d{4}$/.test(value || "");
}

function formatMoney(value) {
  if (value === null || value === undefined) {
    return "-";
  }
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

export default function SummaryClient({ year: yearProp }) {
  const nowYear = new Date().getFullYear();
  const year = isValidYear(yearProp) ? yearProp : String(nowYear);
  const [months, setMonths] = useState([]);
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [pieMonth, setPieMonth] = useState("all");
  const [metric, setMetric] = useState("sales");

  const selectedMonthLabel = useMemo(() => {
    if (pieMonth === "all") {
      return "All year";
    }
    return pieMonth;
  }, [pieMonth]);

  const activeMonth = pieMonth === "all" ? null : pieMonth;
  const metricKey = metric === "commission" ? "total_commission" : "total";
  const metricLabel = metric === "commission" ? "Commission" : "Sales";

  const handlers = useMemo(() => {
    const list = Array.from(new Set(rows.map((row) => row.handler)));
    return list.sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const dataMaps = useMemo(() => {
    const totalsByHandlerMonth = {};
    const countsByHandlerMonth = {};
    const totalsByMonth = {};
    const countsByMonth = {};
    const totalsByHandler = {};
    const countsByHandler = {};

    months.forEach((month) => {
      totalsByMonth[month] = 0;
      countsByMonth[month] = 0;
    });

    rows.forEach((row) => {
      const value = row[metricKey] || 0;
      if (!totalsByHandlerMonth[row.handler]) {
        totalsByHandlerMonth[row.handler] = {};
        countsByHandlerMonth[row.handler] = {};
        totalsByHandler[row.handler] = 0;
        countsByHandler[row.handler] = 0;
      }
      totalsByHandlerMonth[row.handler][row.month] = value;
      countsByHandlerMonth[row.handler][row.month] = row.count;
      totalsByHandler[row.handler] += value;
      countsByHandler[row.handler] += row.count;
      totalsByMonth[row.month] = (totalsByMonth[row.month] || 0) + value;
      countsByMonth[row.month] = (countsByMonth[row.month] || 0) + row.count;
    });

    const overallTotal = Object.values(totalsByMonth).reduce(
      (sum, value) => sum + value,
      0
    );

    return {
      totalsByHandlerMonth,
      countsByHandlerMonth,
      totalsByMonth,
      countsByMonth,
      totalsByHandler,
      countsByHandler,
      overallTotal,
    };
  }, [months, rows, metricKey]);

  const maxTotal = useMemo(() => {
    return Math.max(
      ...months.map((month) => dataMaps.totalsByMonth[month] || 0),
      0
    );
  }, [months, dataMaps]);

  const pieData = useMemo(() => {
    const entries = handlers.map((handler) => {
      const total =
        pieMonth === "all"
          ? dataMaps.totalsByHandler[handler] || 0
          : dataMaps.totalsByHandlerMonth[handler]?.[pieMonth] || 0;
      return { handler, total };
    });
    return entries
      .filter((entry) => entry.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [handlers, pieMonth, dataMaps]);

  const pieTotal = useMemo(() => {
    return pieData.reduce((sum, item) => sum + item.total, 0);
  }, [pieData]);

  const pieStyle = useMemo(() => {
    if (pieTotal === 0) {
      return {};
    }
    let start = 0;
    const segments = pieData.map((item, index) => {
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
  }, [pieData, pieTotal]);

  function handleExportYear() {
    window.location.href = `/api/commission/export?year=${year}`;
  }

  useEffect(() => {
    async function loadSummary() {
      setLoading(true);
      setStatus("");
      try {
        const response = await fetch(`/api/commission/summary?year=${year}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Unable to load summary.");
        }
        setMonths(data.months || []);
        setRows(data.rows || []);
      } catch (error) {
        setStatus(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, [year]);

  useEffect(() => {
    setPieMonth("all");
    setMetric("sales");
  }, [year]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link className={styles.backLink} href={`/commission/${year}`}>
            ← Back to commission
          </Link>
          <h1>{year} Commission Summary</h1>
          <p>Commission totals and case counts across all handlers.</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.yearNav}>
            <Link className={styles.yearLink} href={`/commission/${Number(year) - 1}/summary`}>
              ← {Number(year) - 1}
            </Link>
            <div className={styles.yearBadge}>{year}</div>
            <Link className={styles.yearLink} href={`/commission/${Number(year) + 1}/summary`}>
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

      <div className={styles.metricToggle}>
        <button
          type="button"
          className={`${styles.metricButton} ${
            metric === "sales" ? styles.metricActive : ""
          }`}
          onClick={() => setMetric("sales")}
        >
          Sales (總計)
        </button>
        <button
          type="button"
          className={`${styles.metricButton} ${
            metric === "commission" ? styles.metricActive : ""
          }`}
          onClick={() => setMetric("commission")}
        >
          Commission (Total Commission)
        </button>
      </div>

      <section className={styles.monthTabs}>
        {monthTabs.map((tab) => {
          const value =
            tab.value === "all" ? "all" : `${year}-${tab.value}`;
          const isActive = pieMonth === value;
          return (
            <button
              key={tab.value}
              type="button"
              className={`${styles.monthTab} ${
                isActive ? styles.monthTabActive : ""
              }`}
              onClick={() => setPieMonth(value)}
            >
              {tab.label}
            </button>
          );
        })}
      </section>

      <section className={styles.chartsSection}>
        <div className={styles.barCard}>
          <div className={styles.barHeader}>
            <h2>{year} {metricLabel} Summary by Month</h2>
            <span>Click a month to focus tables</span>
          </div>
          <div className={styles.barChart}>
            {months.map((month, index) => {
              const total = dataMaps.totalsByMonth[month] || 0;
              const height = maxTotal ? Math.max((total / maxTotal) * 100, 4) : 4;
              const isActive = activeMonth === month;
              return (
                <button
                  key={month}
                  type="button"
                  className={`${styles.barItem} ${
                    isActive ? styles.barActive : ""
                  }`}
                  onClick={() => {
                    setPieMonth(month);
                  }}
                  title={`${month}: ${formatMoney(total)}`}
                >
                  <span className={styles.barFill} style={{ height: `${height}%` }} />
                  <span className={styles.barLabel}>{monthLabels[index]}</span>
                  <span className={styles.barTooltip}>{formatMoney(total)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.pieCard}>
          <div className={styles.pieHeader}>
            <h3>
              Agent Mix ({metricLabel} · {selectedMonthLabel})
            </h3>
            <label className={styles.pieFilter}>
              View month
              <select
                value={pieMonth}
                onChange={(event) => setPieMonth(event.target.value)}
              >
                <option value="all">All year</option>
                {months.map((month, index) => (
                  <option key={month} value={month}>
                    {monthLabels[index]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className={styles.pieLayout}>
            <div className={styles.pieChart} style={pieStyle}>
              {pieTotal === 0 ? <span>No data</span> : null}
            </div>
            <div className={styles.legend}>
              {pieData.length === 0 ? (
                <p>No entries.</p>
              ) : (
                pieData.map((item, index) => (
                  <div key={item.handler} className={styles.legendItem}>
                    <span
                      className={styles.legendSwatch}
                      style={{ background: palette[index % palette.length] }}
                    />
                    <div>
                      <strong>{item.handler}</strong>
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

      <section className={styles.tableSummarySection}>
        <div className={styles.tableStack}>
          <div className={styles.tableCard}>
            <h2>{year} {metricLabel} (By Month, Per Agent)</h2>
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Agent</th>
                    {monthLabels.map((label, index) => (
                      <th
                        key={label}
                        className={
                          months[index] === activeMonth ? styles.activeMonth : ""
                        }
                      >
                        {label}
                      </th>
                    ))}
                    <th>Grand Total</th>
                  </tr>
                </thead>
                <tbody>
                  {handlers.length === 0 ? (
                    <tr>
                      <td colSpan="14" className={styles.empty}>
                        No entries yet.
                      </td>
                    </tr>
                  ) : (
                    handlers.map((handler) => {
                      const rowTotal = months.reduce(
                        (sum, month) =>
                          sum +
                          (dataMaps.totalsByHandlerMonth[handler]?.[month] || 0),
                        0
                      );
                      return (
                        <tr key={handler}>
                          <td>{handler}</td>
                          {months.map((month) => (
                            <td
                              key={month}
                              className={`${styles.amount} ${
                                month === activeMonth ? styles.activeMonth : ""
                              }`}
                            >
                              {formatMoney(
                                dataMaps.totalsByHandlerMonth[handler]?.[month] ||
                                  0
                              )}
                            </td>
                          ))}
                          <td className={styles.amount}>
                            {formatMoney(rowTotal)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                  {handlers.length > 0 ? (
                    <tr className={styles.grandRow}>
                      <td>Grand Total</td>
                      {months.map((month) => (
                        <td
                          key={month}
                          className={`${styles.amount} ${
                            month === activeMonth ? styles.activeMonth : ""
                          }`}
                        >
                          {formatMoney(dataMaps.totalsByMonth[month] || 0)}
                        </td>
                      ))}
                      <td className={styles.amount}>
                        {formatMoney(dataMaps.overallTotal)}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.tableCard}>
            <h2>{year} Case Number (By Month, Per Agent)</h2>
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Agent</th>
                    {monthLabels.map((label, index) => (
                      <th
                        key={label}
                        className={
                          months[index] === activeMonth ? styles.activeMonth : ""
                        }
                      >
                        {label}
                      </th>
                    ))}
                    <th>Grand Total</th>
                  </tr>
                </thead>
                <tbody>
                  {handlers.length === 0 ? (
                    <tr>
                      <td colSpan="14" className={styles.empty}>
                        No entries yet.
                      </td>
                    </tr>
                  ) : (
                    handlers.map((handler) => {
                      const rowTotal = months.reduce(
                        (sum, month) =>
                          sum +
                          (dataMaps.countsByHandlerMonth[handler]?.[month] || 0),
                        0
                      );
                      return (
                        <tr key={handler}>
                          <td>{handler}</td>
                          {months.map((month) => (
                            <td
                              key={month}
                              className={`${styles.amount} ${
                                month === activeMonth ? styles.activeMonth : ""
                              }`}
                            >
                              {dataMaps.countsByHandlerMonth[handler]?.[month] ||
                                "-"}
                            </td>
                          ))}
                          <td className={styles.amount}>{rowTotal || "-"}</td>
                        </tr>
                      );
                    })
                  )}
                  {handlers.length > 0 ? (
                    <tr className={styles.grandRow}>
                      <td>Grand Total</td>
                      {months.map((month) => (
                        <td
                          key={month}
                          className={`${styles.amount} ${
                            month === activeMonth ? styles.activeMonth : ""
                          }`}
                        >
                          {dataMaps.countsByMonth[month] || "-"}
                        </td>
                      ))}
                      <td className={styles.amount}>
                        {Object.values(dataMaps.countsByMonth).reduce(
                          (sum, value) => sum + value,
                          0
                        )}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <h3>{year} {metricLabel} Summary (Month)</h3>
            <table>
              <tbody>
                {months.map((month, index) => (
                  <tr
                    key={month}
                    className={month === activeMonth ? styles.activeMonth : ""}
                  >
                    <td>{monthLabels[index]}</td>
                    <td className={styles.amount}>
                      {formatMoney(dataMaps.totalsByMonth[month] || 0)}
                    </td>
                  </tr>
                ))}
                <tr className={styles.grandRow}>
                  <td>Grand Total</td>
                  <td className={styles.amount}>
                    {formatMoney(dataMaps.overallTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className={styles.summaryCard}>
            <h3>{year} {metricLabel} Summary (Agent)</h3>
            <table>
              <tbody>
                {handlers.map((handler) => (
                  <tr key={handler}>
                    <td>{handler}</td>
                    <td className={styles.amount}>
                      {formatMoney(dataMaps.totalsByHandler[handler] || 0)}
                    </td>
                  </tr>
                ))}
                <tr className={styles.grandRow}>
                  <td>Grand Total</td>
                  <td className={styles.amount}>
                    {formatMoney(dataMaps.overallTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
