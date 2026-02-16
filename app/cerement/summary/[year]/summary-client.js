"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BsGear } from "react-icons/bs";
import BarChart from "@/app/components/charts/BarChart";
import LineChart from "@/app/components/charts/LineChart";
import PieChart from "@/app/components/charts/PieChart";
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

const comparePalette = [
  "#2f5d62",
  "#567d7a",
  "#5f6f52",
  "#3f4e4f",
  "#6b705c",
];

const barPalette = [
  "#a35b2a",
  "#c27a4a",
  "#9c5c3c",
  "#b76a4f",
  "#7f4b2a",
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
      label: `${tab.label} ${yearValue}`,
      hasEntry: Boolean(entry),
      total,
      ...amounts,
    };
  });
}

export default function CerementSummaryClient({ year: yearProp }) {
  const nowYear = new Date().getFullYear();
  const year = isValidYear(yearProp) ? yearProp : String(nowYear);
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [showLineChart, setShowLineChart] = useState(true);
  const [showBarChart, setShowBarChart] = useState(true);
  const [showPieChart, setShowPieChart] = useState(true);
  const [compareMetric, setCompareMetric] = useState("total");
  const [compareYears, setCompareYears] = useState([]);
  const [compareEntriesByYear, setCompareEntriesByYear] = useState({});
  const [compareLoadingByYear, setCompareLoadingByYear] = useState({});
  const [compareErrorsByYear, setCompareErrorsByYear] = useState({});

  const chartSeries = useMemo(() => {
    const compareValueKey = compareMetric === "total" ? "total" : compareMetric;
    const baseSeries = [
      {
        key: `year-${year}`,
        valueKey: compareValueKey,
        label: year,
        color: "#8a3f1b",
        emphasis: true,
        dashed: false,
        year,
      },
    ];

    const compareSeries = compareYears.map((compareYear, index) => ({
      key: `compare-${compareYear}`,
      valueKey: compareValueKey,
      label: compareYear,
      color: comparePalette[index % comparePalette.length],
      emphasis: false,
      dashed: true,
      year: compareYear,
    }));

    return [...baseSeries, ...compareSeries];
  }, [compareMetric, compareYears, year]);

  const compareMetricLabel = useMemo(() => {
    if (compareMetric === "total") {
      return "Total";
    }
    return (
      amountColumns.find((column) => column.key === compareMetric)?.label ||
      "Total"
    );
  }, [compareMetric]);

  const compareTitle = useMemo(() => {
    if (compareMetric === "total") {
      return `梁津煥記${year}年壽衣紀錄總計`;
    }
    const compareSorted = [...compareYears].sort(
      (a, b) => Number(b) - Number(a)
    );
    const titleYears = [year, ...compareSorted.filter((value) => value !== year)];
    return `${compareMetricLabel}：${titleYears.join(" vs ")}`;
  }, [compareMetric, compareMetricLabel, compareYears, year]);

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

  useEffect(() => {
    setCompareYears([]);
    setCompareEntriesByYear({});
    setCompareLoadingByYear({});
    setCompareErrorsByYear({});
    setCompareMetric("total");
    setShowLineChart(true);
    setShowBarChart(true);
    setShowPieChart(true);
  }, [year]);

  async function loadCompareYear(yearValue) {
    setCompareLoadingByYear((prev) => ({ ...prev, [yearValue]: true }));
    setCompareErrorsByYear((prev) => {
      const next = { ...prev };
      delete next[yearValue];
      return next;
    });

    try {
      const response = await fetch(`/api/cerement?year=${yearValue}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Unable to load cerement summary.");
      }
      setCompareEntriesByYear((prev) => ({
        ...prev,
        [yearValue]: data.entries || [],
      }));
    } catch (error) {
      setCompareErrorsByYear((prev) => ({
        ...prev,
        [yearValue]: error.message || "Unable to load.",
      }));
    } finally {
      setCompareLoadingByYear((prev) => {
        const next = { ...prev };
        delete next[yearValue];
        return next;
      });
    }
  }

  const monthRows = useMemo(() => {
    return buildMonthRows(year, entries);
  }, [entries, year]);

  const barGroups = useMemo(() => {
    if (compareMetric === "total") {
      return monthTabs.map((tab, index) => {
        const row = monthRows[index];
        const bars = amountColumns.map((column, columnIndex) => ({
          key: column.key,
          label: column.label,
          value: row ? Number(row[column.key] || 0) : 0,
          color: barPalette[columnIndex % barPalette.length],
          tooltipLabel: column.label,
        }));
        return { key: tab.value, label: tab.label, bars };
      });
    }

    const selectedIndex = amountColumns.findIndex(
      (column) => column.key === compareMetric
    );
    const selectedColor =
      selectedIndex >= 0
        ? barPalette[selectedIndex % barPalette.length]
        : barPalette[0];

    return monthTabs.map((tab, index) => {
      const row = monthRows[index];
      const value = row ? Number(row[compareMetric] || 0) : 0;
      return {
        key: tab.value,
        label: tab.label,
        bars: [
          {
            key: compareMetric,
            label: compareMetricLabel,
            value,
            color: selectedColor,
            tooltipLabel: compareMetricLabel,
          },
        ],
      };
    });
  }, [compareMetric, compareMetricLabel, monthRows]);

  const barMax = useMemo(() => {
    return Math.max(
      ...barGroups.flatMap((group) => group.bars.map((item) => item.value)),
      0
    );
  }, [barGroups]);

  const pieData = useMemo(() => {
    return monthTabs
      .map((tab, index) => {
        const row = monthRows[index];
        const value = row
          ? compareMetric === "total"
            ? row.total || 0
            : row[compareMetric] || 0
          : 0;
        return { label: tab.label, value };
      })
      .filter((item) => item.value > 0);
  }, [compareMetric, monthRows]);

  const pieTotal = useMemo(() => {
    return pieData.reduce((sum, item) => sum + item.value, 0);
  }, [pieData]);

  const annualStorePieData = useMemo(() => {
    return amountColumns
      .map((column) => ({
        label: column.label,
        value: monthRows.reduce(
          (sum, row) => sum + Number(row[column.key] || 0),
          0
        ),
      }))
      .filter((item) => item.value > 0);
  }, [monthRows]);

  const annualStoreTotal = useMemo(() => {
    return annualStorePieData.reduce((sum, item) => sum + item.value, 0);
  }, [annualStorePieData]);

  const monthRowsByYear = useMemo(() => {
    const map = { [year]: monthRows };
    compareYears.forEach((compareYear) => {
      map[compareYear] = buildMonthRows(
        compareYear,
        compareEntriesByYear[compareYear] || []
      );
    });
    return map;
  }, [compareEntriesByYear, compareYears, monthRows, year]);

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

  const previousYears = useMemo(() => {
    const yearValue = Number(year);
    if (!Number.isFinite(yearValue)) {
      return [];
    }
    return Array.from({ length: 5 }, (_, index) =>
      String(yearValue - index - 1)
    );
  }, [year]);

  const showAnyChart = showLineChart || showBarChart || showPieChart;
  const showLeftCharts = showLineChart || showBarChart;
  const chartRowClassName =
    showPieChart && showLeftCharts
      ? styles.chartRow
      : `${styles.chartRow} ${styles.chartRowSingle}`;

  const lineLabels = monthTabs.map((tab) => tab.label);
  const lineSeries = useMemo(() => {
    return chartSeries.map((series) => {
      const rows = monthRowsByYear[series.year] || [];
      const values = monthTabs.map((tab, index) => {
        const row = rows[index];
        return row
          ? series.valueKey === "total"
            ? row.total || 0
            : row[series.valueKey] || 0
          : 0;
      });
      return {
        key: series.key,
        values,
        color: series.color,
        dashed: series.dashed,
      };
    });
  }, [chartSeries, monthRowsByYear]);
  const lineMax = useMemo(() => {
    return Math.max(...lineSeries.flatMap((series) => series.values), 0);
  }, [lineSeries]);

  function handleCompareToggle(yearValue) {
    const isActive = compareYears.includes(yearValue);
    setCompareYears((prev) => {
      if (prev.includes(yearValue)) {
        return prev.filter((value) => value !== yearValue);
      }
      return [...prev, yearValue];
    });

    if (isActive) {
      return;
    }
    if (compareEntriesByYear[yearValue] || compareLoadingByYear[yearValue]) {
      return;
    }
    loadCompareYear(yearValue);
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link className={styles.backLink} href={`/cerement/${year}`}>
            ← Back to monthly entry
          </Link>
          <h1>{`梁津煥記 壽衣紀錄 ${year}年 年度總結`}</h1>
          <p>Review yearly cerement totals across each location.</p>
        </div>
        <div className={styles.headerActions}>
          <Link className={styles.overallLink} href="/cerement/summary/overall">
            Overall
          </Link>
          <div className={styles.yearNav}>
            <Link
              className={styles.yearLink}
              href={`/cerement/summary/${Number(year) - 1}`}
            >
              ← {Number(year) - 1}
            </Link>
            <span className={styles.yearBadge}>{year}</span>
            <Link
              className={styles.yearLink}
              href={`/cerement/summary/${Number(year) + 1}`}
            >
              {Number(year) + 1} →
            </Link>
          </div>
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

      <div className={styles.chartTopActions}>
        <button
          type="button"
          className={styles.chartToggle}
          onClick={() => setControlsOpen((prev) => !prev)}
          aria-expanded={controlsOpen}
          aria-controls="cerement-chart-controls"
        >
          <BsGear aria-hidden />
          Chart options
        </button>
      </div>

      <div className={styles.summaryLayout}>
        <div className={styles.summaryMain}>
          <div className={chartRowClassName}>
            <div className={styles.chartStack}>
              {!showAnyChart ? (
                <div className={styles.chartEmpty}>
                  Select a chart type in Chart options.
                </div>
              ) : null}

              {showLineChart ? (
                <section className={styles.chartCard}>
                  <div className={styles.chartHeader}>
                    <div>
                      <h2>{compareTitle}</h2>
                      <p>Selected metric by month across chosen years.</p>
                    </div>
                    <div className={styles.chartHeaderActions}>
                      <span className={styles.chartNote}>
                        {lineMax > 0
                          ? `Peak ${formatMoney(lineMax)}`
                          : "No totals yet"}
                      </span>
                    </div>
                  </div>
                  <div className={styles.chartLegend}>
                    {chartSeries.map((series) => (
                      <span key={series.key} className={styles.legendItem}>
                        <span
                          className={styles.legendSwatch}
                          style={{ background: series.color }}
                        />
                        {series.label}
                      </span>
                    ))}
                  </div>
                  <div className={styles.chartWrap}>
                    <LineChart
                      labels={lineLabels}
                      series={lineSeries}
                      width={680}
                      height={240}
                      padding={28}
                      maxValue={lineMax}
                      ariaLabel="Monthly total line chart"
                      emptyLabel="No totals yet."
                    />
                  </div>
                </section>
              ) : null}

              {showBarChart ? (
                <section className={styles.barCard}>
                  <div className={styles.barHeader}>
                    <div>
                      <h3>
                        {compareMetric === "total"
                          ? `梁津煥記${year}年每月壽衣紀錄`
                          : `${year}年每月${compareMetricLabel}`}
                      </h3>
                      <p>
                        {compareMetric === "total"
                          ? "Store totals grouped by month."
                          : "Selected store totals by month."}
                      </p>
                    </div>
                    <span>
                      {barMax > 0 ? `Max ${formatMoney(barMax)}` : "No totals"}
                    </span>
                  </div>
                  {compareMetric === "total" ? (
                    <div className={styles.barLegend}>
                      {amountColumns.map((column, index) => (
                        <span key={column.key} className={styles.legendItem}>
                          <span
                            className={styles.legendSwatch}
                            style={{
                              background: barPalette[index % barPalette.length],
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
                    ariaLabel={`Monthly bars · ${compareMetricLabel}`}
                  />
                </section>
              ) : null}
            </div>

            {showPieChart ? (
              <section className={styles.pieStack}>
                <div className={styles.pieCard}>
                  <div className={styles.pieHeader}>
                    <div>
                      <h3>
                        {compareMetric === "total"
                          ? `梁津煥記${year}年每月壽衣紀錄`
                          : `${year}年每月${compareMetricLabel}`}
                      </h3>
                      <p>Share of the selected metric across months.</p>
                    </div>
                    <span className={styles.chartNote}>
                      {formatMoney(pieTotal)}
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

                <div className={styles.pieCard}>
                  <div className={styles.pieHeader}>
                    <div>
                      <h3>{`梁津煥記${year}年分店壽衣紀錄`}</h3>
                      <p>Share of annual totals across stores.</p>
                    </div>
                    <span className={styles.chartNote}>
                      {formatMoney(annualStoreTotal)}
                    </span>
                  </div>
                  <PieChart
                    data={annualStorePieData}
                    palette={piePalette}
                    formatValue={formatMoney}
                    formatPercent={formatPercent}
                    emptyLabel="No store totals yet."
                  />
                </div>
              </section>
            ) : null}
          </div>

          <section className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <div>
                <h2>{`梁津煥記${year}年分店壽衣紀錄概覽`}</h2>
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
                      <td key={column.key}>
                        {formatMoney(annualTotals[column.key])}
                      </td>
                    ))}
                    <td className={styles.totalCell}>
                      {formatMoney(annualTotals.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </div>
      </div>
      {controlsOpen ? (
        <div
          className={styles.chartOptionsOverlay}
          onClick={() => setControlsOpen(false)}
        >
          <aside
            id="cerement-chart-controls"
            className={styles.chartOptionsModal}
            aria-label="Chart options"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div>
                <h3>圖表設定</h3>
                <p>Select a metric and the years to compare.</p>
              </div>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setControlsOpen(false)}
                aria-label="Close chart options"
              >
                ×
              </button>
            </div>

            <div className={styles.compareSection}>
              <span className={styles.compareSectionTitle}>Charts</span>
              <div className={styles.chartToggleGroup}>
                <label className={styles.chartToggleItem}>
                  <input
                    type="checkbox"
                    checked={showLineChart}
                    onChange={() => setShowLineChart((prev) => !prev)}
                  />
                  <span>Line</span>
                </label>
                <label className={styles.chartToggleItem}>
                  <input
                    type="checkbox"
                    checked={showBarChart}
                    onChange={() => setShowBarChart((prev) => !prev)}
                  />
                  <span>Bar</span>
                </label>
                <label className={styles.chartToggleItem}>
                  <input
                    type="checkbox"
                    checked={showPieChart}
                    onChange={() => setShowPieChart((prev) => !prev)}
                  />
                  <span>Pie</span>
                </label>
              </div>
            </div>

            <div className={styles.compareSection}>
              <span className={styles.compareSectionTitle}>Metric</span>
              <div className={styles.metricBox}>
                <label className={styles.metricItem}>
                  <input
                    type="radio"
                    name="compareMetric"
                    value="total"
                    checked={compareMetric === "total"}
                    onChange={(event) => setCompareMetric(event.target.value)}
                  />
                  <span>Total</span>
                </label>
                {amountColumns.map((column) => (
                  <label key={column.key} className={styles.metricItem}>
                    <input
                      type="radio"
                      name="compareMetric"
                      value={column.key}
                      checked={compareMetric === column.key}
                      onChange={(event) => setCompareMetric(event.target.value)}
                    />
                    <span>{column.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.compareSection}>
              <span className={styles.compareSectionTitle}>Years</span>
              <p className={styles.compareHint}>
                Toggle previous years to compare with {year}.
              </p>
              <div className={styles.compareList}>
                {previousYears.map((yearValue) => (
                  <label key={yearValue} className={styles.compareItem}>
                    <input
                      type="checkbox"
                      checked={compareYears.includes(yearValue)}
                      onChange={() => handleCompareToggle(yearValue)}
                    />
                    <span>{yearValue}</span>
                    {compareLoadingByYear[yearValue] ? (
                      <span className={styles.compareStatus}>Loading...</span>
                    ) : null}
                    {compareErrorsByYear[yearValue] ? (
                      <span className={styles.compareError}>Failed</span>
                    ) : null}
                  </label>
                ))}
                {previousYears.length === 0 ? (
                  <div className={styles.compareEmpty}>No previous years.</div>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </main>
  );
}
