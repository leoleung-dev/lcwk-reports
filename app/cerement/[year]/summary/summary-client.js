"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

export default function CerementSummaryClient({ year: yearProp }) {
  const nowYear = new Date().getFullYear();
  const year = isValidYear(yearProp) ? yearProp : String(nowYear);
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

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

  const entriesByMonth = useMemo(() => {
    const map = {};
    entries.forEach((entry) => {
      if (entry.entryMonth) {
        map[entry.entryMonth] = entry;
      }
    });
    return map;
  }, [entries]);

  const monthRows = useMemo(() => {
    return monthTabs.map((tab) => {
      const key = `${year}-${tab.value}`;
      const entry = entriesByMonth[key];
      const amounts = amountColumns.reduce((acc, column) => {
        acc[column.key] = entry ? Number(entry[column.key] || 0) : 0;
        return acc;
      }, {});
      const total = Object.values(amounts).reduce((sum, value) => sum + value, 0);
      return {
        key,
        label: `${tab.label} ${year}`,
        hasEntry: Boolean(entry),
        total,
        ...amounts,
      };
    });
  }, [entriesByMonth, year]);

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
        <div className={styles.yearNav}>
          <Link className={styles.yearLink} href={`/cerement/${Number(year) - 1}/summary`}>
            ← {Number(year) - 1}
          </Link>
          <span className={styles.yearBadge}>{year}</span>
          <Link className={styles.yearLink} href={`/cerement/${Number(year) + 1}/summary`}>
            {Number(year) + 1} →
          </Link>
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
                  <td key={column.key}>{formatMoney(annualTotals[column.key])}</td>
                ))}
                <td className={styles.totalCell}>
                  {formatMoney(annualTotals.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </main>
  );
}
