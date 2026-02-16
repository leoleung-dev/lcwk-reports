"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BarChart from "@/app/components/charts/BarChart";
import PieChart from "@/app/components/charts/PieChart";
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

const compactMoneyFormatter = new Intl.NumberFormat("en-HK", {
  notation: "compact",
  maximumFractionDigits: 1,
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

export default function SummaryClient({ year: yearProp }) {
  const nowYear = new Date().getFullYear();
  const year = isValidYear(yearProp) ? yearProp : String(nowYear);
  const [months, setMonths] = useState([]);
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [pieMonth, setPieMonth] = useState("all");
  const [metric, setMetric] = useState("sales");

  const activeMonth = pieMonth === "all" ? null : pieMonth;
  const metricKey = metric === "commission" ? "total_commission" : "total";
  const metricLabel = metric === "commission" ? "Commission" : "Sales";
  const isSalesMetric = metric === "sales";
  const titlePrefix = `梁津煥記(禮儀顧問) ${year}年`;

  const selectedMonthNumber = useMemo(() => {
    if (pieMonth === "all") {
      return null;
    }
    const monthPart = String(pieMonth).split("-")[1];
    const parsed = Number(monthPart);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 12) {
      return null;
    }
    return parsed;
  }, [pieMonth]);

  const monthlySummaryTitle = isSalesMetric
    ? `${titlePrefix} 每月銷售額`
    : `${titlePrefix} 每月佣金`;
  const agentSummaryTitle = isSalesMetric
    ? `${titlePrefix} 經手者銷售額`
    : `${titlePrefix} 經手者佣金`;
  const perAgentMonthlyOverviewTitle = isSalesMetric
    ? `${titlePrefix} 銷售額概覽`
    : `${titlePrefix} 佣金概覽`;
  const caseMonthlyOverviewTitle = `${titlePrefix} 每月案件數概覽`;
  const agentMixTitle = isSalesMetric
    ? selectedMonthNumber
      ? `${titlePrefix}${selectedMonthNumber}月 經手者銷售額`
      : agentSummaryTitle
    : selectedMonthNumber
      ? `${titlePrefix}${selectedMonthNumber}月 經手者佣金`
      : agentSummaryTitle;

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
            ← 返回佣金登記
          </Link>
          <h1>{`梁津煥記(禮儀顧問) 佣金登記 ${year}年 年度總結`}</h1>
          <p>查看年度銷售與佣金分佈，以及每月案件數。</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.headerActionsTop}>
            <Link className={styles.overallLink} href="/commission/summary/overall">
              跨年總結
            </Link>
            <div className={styles.yearNav}>
              <Link
                className={styles.yearLink}
                href={`/commission/summary/${Number(year) - 1}`}
              >
                ← {Number(year) - 1}
              </Link>
              <div className={styles.yearBadge}>{year}</div>
              <Link
                className={styles.yearLink}
                href={`/commission/summary/${Number(year) + 1}`}
              >
                {Number(year) + 1} →
              </Link>
            </div>
          </div>
          <button
            type="button"
            className={styles.exportButton}
            onClick={handleExportYear}
          >
            匯出年度
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
            <h2>{monthlySummaryTitle}</h2>
            <span>Click a month to focus tables</span>
          </div>
          <BarChart
            groups={months.map((month, index) => ({
              key: month,
              label: monthLabels[index],
              bars: [
                {
                  key: `${month}-total`,
                  value: dataMaps.totalsByMonth[month] || 0,
                  tooltipLabel: monthLabels[index],
                },
              ],
            }))}
            maxValue={maxTotal}
            columns={12}
            activeGroupKey={activeMonth || ""}
            onGroupClick={(key) => setPieMonth(key)}
            formatValue={formatMoney}
            formatValueLabel={formatCompactMoney}
            chartHeight={220}
            ariaLabel={`${year} ${metricLabel} by month`}
          />
        </div>

        <div className={styles.pieCard}>
          <div className={styles.pieHeader}>
            <h3>{agentMixTitle}</h3>
          </div>
          <PieChart
            data={pieData.map((item) => ({
              label: item.handler,
              value: item.total,
            }))}
            palette={palette}
            formatValue={formatMoney}
            formatPercent={formatPercent}
            emptyLabel="No entries."
          />
        </div>
      </section>

      <section className={styles.tableSummarySection}>
        <div className={styles.tableStack}>
          <div className={styles.tableCard}>
            <h2>{perAgentMonthlyOverviewTitle}</h2>
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
            <h2>{caseMonthlyOverviewTitle}</h2>
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
            <h3>{monthlySummaryTitle}</h3>
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
            <h3>{agentSummaryTitle}</h3>
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
