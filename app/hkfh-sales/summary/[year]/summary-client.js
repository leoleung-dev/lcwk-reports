"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BarChart from "@/app/components/charts/BarChart";
import LineChart from "@/app/components/charts/LineChart";
import PieChart from "@/app/components/charts/PieChart";
import styles from "./Summary.module.css";

const monthTabs = [
  { key: "01", label: "Jan" },
  { key: "02", label: "Feb" },
  { key: "03", label: "Mar" },
  { key: "04", label: "Apr" },
  { key: "05", label: "May" },
  { key: "06", label: "Jun" },
  { key: "07", label: "Jul" },
  { key: "08", label: "Aug" },
  { key: "09", label: "Sep" },
  { key: "10", label: "Oct" },
  { key: "11", label: "Nov" },
  { key: "12", label: "Dec" },
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

const monthBarPalette = [
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

function isValidYear(value) {
  return /^\d{4}$/.test(value || "");
}

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

function toMonthArray(amounts) {
  return monthTabs.map((month) => Number(amounts?.[month.key] || 0));
}

function getRowTotal(values) {
  return values.reduce((sum, value) => sum + Number(value || 0), 0);
}

export default function HkfhSalesSummaryClient({ year: yearProp }) {
  const nowYear = new Date().getFullYear();
  const year = isValidYear(yearProp) ? String(yearProp) : String(nowYear);
  const titlePrefix = `香港分店 營業額 ${year}年`;

  const [entries, setEntries] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    async function loadYear() {
      setLoading(true);
      setStatus("");
      try {
        const response = await fetch(`/api/hkfh-sales?year=${year}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            data?.error || "Unable to load Hong Kong branch sales summary."
          );
        }
        setEntries(data?.entries || []);
      } catch (error) {
        setStatus(error.message || "Unable to load Hong Kong branch sales summary.");
      } finally {
        setLoading(false);
      }
    }

    loadYear();
  }, [year]);

  const agentRows = useMemo(() => {
    return (entries || [])
      .map((entry) => {
        const monthly = toMonthArray(entry.amounts);
        return {
          name: entry.staffName || "Unknown",
          monthly,
          total: getRowTotal(monthly),
        };
      })
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  }, [entries]);

  useEffect(() => {
    if (agentRows.length === 0) {
      setSelectedAgent("");
      return;
    }

    setSelectedAgent((prev) =>
      agentRows.some((row) => row.name === prev) ? prev : agentRows[0].name
    );
  }, [agentRows]);

  const monthlyTotals = useMemo(() => {
    return monthTabs.map((_, index) =>
      agentRows.reduce((sum, row) => sum + (row.monthly[index] || 0), 0)
    );
  }, [agentRows]);

  const yearlyTotal = useMemo(() => getRowTotal(monthlyTotals), [monthlyTotals]);

  const pieData = useMemo(() => {
    return agentRows
      .filter((row) => row.total > 0)
      .map((row) => ({ label: row.name, value: row.total }));
  }, [agentRows]);

  const selectedAgentRow = useMemo(() => {
    return agentRows.find((row) => row.name === selectedAgent) || null;
  }, [agentRows, selectedAgent]);

  const selectedAgentBars = useMemo(() => {
    const values = selectedAgentRow?.monthly || monthTabs.map(() => 0);
    return monthTabs.map((month, index) => ({
      key: `agent-${month.key}`,
      label: month.label,
      bars: [
        {
          key: `${selectedAgent || "agent"}-${month.key}`,
          value: values[index] || 0,
          color: monthBarPalette[index % monthBarPalette.length],
          tooltipLabel: selectedAgent || "Agent",
        },
      ],
    }));
  }, [selectedAgent, selectedAgentRow]);

  const totalBars = useMemo(() => {
    return monthTabs.map((month, index) => ({
      key: `total-${month.key}`,
      label: month.label,
      bars: [
        {
          key: `total-${month.key}`,
          value: monthlyTotals[index] || 0,
          color: monthBarPalette[index % monthBarPalette.length],
          tooltipLabel: "Total",
        },
      ],
    }));
  }, [monthlyTotals]);

  const selectedAgentMax = useMemo(
    () => Math.max(...(selectedAgentRow?.monthly || [0]), 0),
    [selectedAgentRow]
  );
  const totalMax = useMemo(() => Math.max(...monthlyTotals, 0), [monthlyTotals]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link className={styles.backLink} href={`/hkfh-sales/${year}`}>
            ← Back to monthly entry
          </Link>
          <h1>{`${titlePrefix} 年度總結`}</h1>
          <p>
            Summary table, 經手人 share, and monthly trend/bar views for {year}.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link className={styles.overallLink} href="/hkfh-sales/summary/overall">
            Overall
          </Link>
          <div className={styles.yearNav}>
            <Link
              className={styles.yearLink}
              href={`/hkfh-sales/summary/${Number(year) - 1}`}
            >
              ← {Number(year) - 1}
            </Link>
            <span className={styles.yearBadge}>{year}</span>
            <Link
              className={styles.yearLink}
              href={`/hkfh-sales/summary/${Number(year) + 1}`}
            >
              {Number(year) + 1} →
            </Link>
          </div>
        </div>
      </header>

      {loading ? <div className={styles.status}>Loading...</div> : null}
      {status ? <div className={styles.statusError}>{status}</div> : null}

      {!loading && !status ? (
        <>
          <section className={styles.stats}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Agents</span>
              <strong>{agentRows.length}</strong>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Annual total</span>
              <strong>{formatMoney(yearlyTotal)}</strong>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>{`${year}年 香港分店營業額概覽`}</h2>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.nameCol}>經手人</th>
                    {monthTabs.map((month) => (
                      <th key={`head-${month.key}`}>{month.label}</th>
                    ))}
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {agentRows.map((row) => (
                    <tr key={row.name}>
                      <td className={styles.nameCol}>{row.name}</td>
                      {row.monthly.map((value, index) => (
                        <td key={`${row.name}-${monthTabs[index].key}`}>
                          {formatMoney(value)}
                        </td>
                      ))}
                      <td className={styles.totalCell}>{formatMoney(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th className={styles.nameCol}>Total</th>
                    {monthlyTotals.map((value, index) => (
                      <th key={`foot-${monthTabs[index].key}`}>
                        {formatMoney(value)}
                      </th>
                    ))}
                    <th>{formatMoney(yearlyTotal)}</th>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          <section className={styles.chartSection}>
            <article className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3>{`${titlePrefix} 經手者營業額`}</h3>
                <span>{formatMoney(yearlyTotal)}</span>
              </div>
              <PieChart
                data={pieData}
                palette={piePalette}
                formatValue={formatMoney}
                formatPercent={formatPercent}
                emptyLabel="No totals yet."
              />
            </article>
          </section>

          <section className={styles.chartGrid}>
            <article className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3>{`${year}年 每月營業額 趨勢`}</h3>
                <span>{totalMax > 0 ? `Peak ${formatMoney(totalMax)}` : "No totals"}</span>
              </div>
              <LineChart
                labels={monthTabs.map((month) => month.label)}
                series={[
                  { key: `total-line-${year}`, label: "Total", values: monthlyTotals },
                ]}
                width={660}
                height={220}
                padding={28}
                maxValue={totalMax}
                showYAxis
                formatTooltipValue={formatMoney}
                ariaLabel="Total monthly trend"
                emptyLabel="No totals yet."
              />
            </article>

            <article className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3>{`${year}年 每月營業額`}</h3>
                <span>{formatMoney(yearlyTotal)}</span>
              </div>
              <BarChart
                groups={totalBars}
                maxValue={totalMax}
                columns={12}
                formatValue={formatMoney}
                formatValueLabel={formatCompactMoney}
                chartHeight={220}
                ariaLabel="Total monthly bar"
              />
            </article>
          </section>

          <section className={styles.chartGrid}>
            <article className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3>{`${year}年 經手者每月營業額趨勢`}</h3>
                <select
                  className={styles.agentSelect}
                  value={selectedAgent}
                  onChange={(event) => setSelectedAgent(event.target.value)}
                >
                  {agentRows.map((row) => (
                    <option key={row.name} value={row.name}>
                      {row.name}
                    </option>
                  ))}
                </select>
              </div>
              <LineChart
                labels={monthTabs.map((month) => month.label)}
                series={[
                  {
                    key: `agent-line-${selectedAgent || "none"}`,
                    label: selectedAgent || "Agent",
                    values: selectedAgentRow?.monthly || monthTabs.map(() => 0),
                    color: "#7a3f1e",
                  },
                ]}
                width={660}
                height={220}
                padding={28}
                maxValue={selectedAgentMax}
                showYAxis
                formatTooltipValue={formatMoney}
                ariaLabel="Selected agent monthly trend"
                emptyLabel="No data for this agent."
              />
            </article>

            <article className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3>{`${year}年 經手者每月營業額`}</h3>
                <span>
                  {selectedAgentRow
                    ? `${selectedAgent} · ${formatMoney(selectedAgentRow.total)}`
                    : "No data"}
                </span>
              </div>
              <BarChart
                groups={selectedAgentBars}
                maxValue={selectedAgentMax}
                columns={12}
                formatValue={formatMoney}
                formatValueLabel={formatCompactMoney}
                chartHeight={220}
                ariaLabel="Selected agent monthly bar"
              />
            </article>
          </section>
        </>
      ) : null}
    </main>
  );
}
