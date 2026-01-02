"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BarChart from "@/app/components/charts/BarChart";
import LineChart from "@/app/components/charts/LineChart";
import PieChart from "@/app/components/charts/PieChart";
import styles from "./Overall.module.css";

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

const barPalette = [
  "#a35b2a",
  "#c27a4a",
  "#9c5c3c",
  "#b76a4f",
  "#7f4b2a",
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
  "#c27a4a",
  "#d6a35f",
  "#9c5c3c",
  "#b76a4f",
  "#7f4b2a",
  "#cb997e",
  "#8a5a44",
  "#b07d62",
  "#6f4e37",
  "#d4a373",
  "#9c6644",
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

function getMetricValue(row, metric) {
  if (!row) {
    return 0;
  }
  if (metric === "total") {
    return row.total || 0;
  }
  return Number(row[metric] || 0);
}

function buildMonthRows(yearValue, entriesList) {
  const entriesByMonth = {};
  entriesList.forEach((entry) => {
    if (entry.entryMonth) {
      entriesByMonth[entry.entryMonth] = entry;
    }
  });

  return monthTabs.map((tab) => {
    const key = `${yearValue}-${tab.value}`;
    const entry = entriesByMonth[key];
    const amounts = amountColumns.reduce((acc, column) => {
      acc[column.key] = entry ? Number(entry[column.key] || 0) : 0;
      return acc;
    }, {});
    const total = Object.values(amounts).reduce((sum, value) => sum + value, 0);
    return {
      key,
      label: tab.label,
      total,
      ...amounts,
    };
  });
}


export default function OverallSummaryClient() {
  const [years, setYears] = useState([]);
  const [entriesByYear, setEntriesByYear] = useState({});
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedYears, setSelectedYears] = useState([]);
  const [activeMetric, setActiveMetric] = useState("total");

  useEffect(() => {
    async function loadYears() {
      setLoading(true);
      setStatus("");
      try {
        const response = await fetch("/api/cerement/years");
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

    async function loadEntries() {
      setLoading(true);
      setStatus("");
      try {
        const results = await Promise.all(
          years.map(async (year) => {
            const response = await fetch(`/api/cerement?year=${year}`);
            const data = await response.json();
            if (!response.ok) {
              throw new Error(data?.error || "Unable to load cerement data.");
            }
            return [year, data.entries || []];
          })
        );
        if (!cancelled) {
          setEntriesByYear(Object.fromEntries(results));
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

    loadEntries();

    return () => {
      cancelled = true;
    };
  }, [years]);

  useEffect(() => {
    if (years.length === 0) {
      return;
    }
    const sorted = [...years].sort((a, b) => b.localeCompare(a));
    setSelectedYears((prev) => {
      const valid = prev.filter((year) => sorted.includes(year));
      if (valid.length > 0) {
        return valid;
      }
      return sorted.slice(0, 2);
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

  const orderedYears = useMemo(() => {
    return [...years].sort((a, b) => b.localeCompare(a));
  }, [years]);

  const selectedYearsOrdered = useMemo(() => {
    return [...selectedYears]
      .filter((year) => years.includes(year))
      .sort((a, b) => a.localeCompare(b));
  }, [selectedYears, years]);

  const monthRowsByYear = useMemo(() => {
    const map = {};
    years.forEach((yearValue) => {
      map[yearValue] = buildMonthRows(
        yearValue,
        entriesByYear[yearValue] || []
      );
    });
    return map;
  }, [entriesByYear, years]);

  const yearSections = useMemo(() => {
    return orderedYears.map((yearValue) => {
      const rows = monthRowsByYear[yearValue] || [];
      const total = rows.reduce((sum, row) => sum + row.total, 0);
      return { yearValue, rows, total };
    });
  }, [monthRowsByYear, orderedYears]);

  const metricLabel =
    activeMetric === "total"
      ? "Total"
      : amountColumns.find((column) => column.key === activeMetric)?.label ||
        "Total";

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
      const rows = monthRowsByYear[year] || [];
      totalsByMonthYear[year] = rows.map((row) =>
        getMetricValue(row, activeMetric)
      );
      totalsByYear[year] = totalsByMonthYear[year].reduce(
        (sum, value) => sum + value,
        0
      );
    });

    const maxTotal = Math.max(
      ...selectedYearsOrdered.flatMap((year) => totalsByMonthYear[year]),
      0
    );
    const groups = monthTabs.map((tab, index) => ({
      key: `month-${tab.value}`,
      label: tab.label,
      bars: selectedYearsOrdered.map((year, yearIndex) => ({
        key: `${year}-${tab.value}`,
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
  }, [activeMetric, monthRowsByYear, selectedYearsOrdered]);

  const hasVersusRows = versusData.groups.length > 0;
  const hasData = yearSections.some((section) => section.total > 0);
  const lineLabels = monthTabs.map((tab) => tab.label);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link className={styles.backLink} href="/cerement">
            ← Cerement
          </Link>
          <h1>Cerement Overall Summary</h1>
          <p>Compare yearly cerement performance and review monthly trends.</p>
        </div>
      </header>

      {loading ? <div className={styles.status}>Loading...</div> : null}
      {status ? <div className={styles.statusError}>{status}</div> : null}
      {!loading && years.length === 0 ? (
        <div className={styles.empty}>No cerement data yet.</div>
      ) : null}

      {hasData ? (
        <>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>Versus</h2>
                <p>Compare monthly totals across selected years.</p>
              </div>
              <div className={styles.sectionControls}>
                <div className={styles.control}>
                  Chart metric
                  <select
                    value={activeMetric}
                    onChange={(event) => setActiveMetric(event.target.value)}
                  >
                    <option value="total">Total</option>
                    {amountColumns.map((column) => (
                      <option key={column.key} value={column.key}>
                        {column.label}
                      </option>
                    ))}
                  </select>
                </div>
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
                    <span className={styles.chartTitleMetric}>
                      {metricLabel}:
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
                    ariaLabel="Cerement comparison by month"
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
                    <span className={styles.legendMeta}>Totals</span>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>Yearly overview</h2>
                <p>{metricLabel} trends and monthly mix for each year.</p>
              </div>
            </div>

            <div className={styles.yearGrid}>
              {yearSections.map((section) => {
                if (section.total <= 0) {
                  return null;
                }
                const lineValues = section.rows.map((row) =>
                  getMetricValue(row, activeMetric)
                );
                const lineMax = Math.max(...lineValues, 0);
                const yearTotal = lineValues.reduce(
                  (sum, value) => sum + value,
                  0
                );
                const barGroups =
                  activeMetric === "total"
                    ? monthTabs.map((tab, index) => {
                        const row = section.rows[index];
                        const bars = amountColumns.map((column, columnIndex) => ({
                          key: column.key,
                          label: column.label,
                          value: row ? Number(row[column.key] || 0) : 0,
                          color: barPalette[columnIndex % barPalette.length],
                          tooltipLabel: column.label,
                        }));
                        return { key: tab.value, label: tab.label, bars };
                      })
                    : monthTabs.map((tab, index) => {
                        const row = section.rows[index];
                        const value = getMetricValue(row, activeMetric);
                        const selectedIndex = amountColumns.findIndex(
                          (column) => column.key === activeMetric
                        );
                        const selectedColor =
                          selectedIndex >= 0
                            ? barPalette[selectedIndex % barPalette.length]
                            : barPalette[0];
                        return {
                          key: tab.value,
                          label: tab.label,
                          bars: [
                            {
                              key: activeMetric,
                              label: metricLabel,
                              value,
                              color: selectedColor,
                              tooltipLabel: metricLabel,
                            },
                          ],
                        };
                      });
                const barMax = Math.max(
                  ...barGroups.flatMap((group) =>
                    group.bars.map((item) => item.value)
                  ),
                  0
                );
                const pieData = monthTabs
                  .map((tab, index) => ({
                    label: tab.label,
                    value: lineValues[index] || 0,
                  }))
                  .filter((item) => item.value > 0);

                return (
                  <article key={section.yearValue} className={styles.yearCard}>
                    <div className={styles.yearHeader}>
                      <div>
                        <h3>{section.yearValue}</h3>
                        <span className={styles.yearTotal}>
                          {formatMoney(yearTotal)}
                        </span>
                      </div>
                    </div>

                    <div className={styles.overviewLayout}>
                      <div className={styles.overviewLeft}>
                        <div className={styles.chartCard}>
                          <div className={styles.chartHeader}>
                            <h4>{metricLabel} monthly trend</h4>
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
                                key: `${section.yearValue}-trend`,
                                values: lineValues,
                              },
                            ]}
                            width={640}
                            height={220}
                            padding={28}
                            maxValue={lineMax}
                            ariaLabel={`Monthly trend for ${section.yearValue}`}
                            emptyLabel="No data yet."
                          />
                        </div>

                        <div className={styles.chartCard}>
                          <div className={styles.chartHeader}>
                            <h4>{metricLabel} by month</h4>
                            <span>{monthTabs.length} months</span>
                          </div>
                          {activeMetric === "total" ? (
                            <div className={styles.barLegend}>
                              {amountColumns.map((column, index) => (
                                <span key={column.key} className={styles.legendItem}>
                                  <span
                                    className={styles.legendSwatch}
                                    style={{
                                      background:
                                        barPalette[index % barPalette.length],
                                    }}
                                  />
                                  {column.label}
                                </span>
                              ))}
                            </div>
                          ) : null}
                          <BarChart
                            groups={barGroups}
                            maxValue={barMax}
                            columns={12}
                            formatValue={formatMoney}
                            formatValueLabel={formatCompactMoney}
                            chartHeight={220}
                            ariaLabel={`Monthly bars for ${section.yearValue}`}
                          />
                        </div>
                      </div>

                      <div className={styles.pieCard}>
                        <div className={styles.chartHeader}>
                          <h4>{metricLabel} share</h4>
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
                          emptyLabel="No data to display."
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
        <div className={styles.empty}>No cerement data yet.</div>
      ) : null}
    </main>
  );
}
