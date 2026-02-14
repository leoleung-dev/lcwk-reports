"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import styles from "./HkfhSales.module.css";

const monthTabs = [
  { key: "01", label: "1月份" },
  { key: "02", label: "2月份" },
  { key: "03", label: "3月份" },
  { key: "04", label: "4月份" },
  { key: "05", label: "5月份" },
  { key: "06", label: "6月份" },
  { key: "07", label: "7月份" },
  { key: "08", label: "8月份" },
  { key: "09", label: "9月份" },
  { key: "10", label: "10月份" },
  { key: "11", label: "11月份" },
  { key: "12", label: "12月份" },
];

const monthKeys = monthTabs.map((month) => month.key);
const AUTO_SAVE_DELAY_MS = 800;

const moneyFormatter = new Intl.NumberFormat("en-HK", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatMoney(value) {
  const amount = Number(value || 0);
  return `$${moneyFormatter.format(amount)}`;
}

function formatDateTime(value) {
  if (!value) {
    return "";
  }
  const text = String(value);
  const [datePart, timePart] = text.split("T");
  if (!timePart) {
    return datePart;
  }
  return `${datePart} ${timePart.split(".")[0]}`;
}

function isValidYear(value) {
  return /^\d{4}$/.test(value || "");
}

function createEmptyMonths() {
  return monthKeys.reduce((acc, month) => {
    acc[month] = "";
    return acc;
  }, {});
}

function createEmptyRow() {
  return {
    staffName: "",
    amounts: createEmptyMonths(),
  };
}

function toInputValue(value) {
  if (value === null || value === undefined) {
    return "";
  }
  const num = Number(value);
  if (!Number.isFinite(num) || num === 0) {
    return "";
  }
  return num.toFixed(2);
}

function mapEntryToRow(entry) {
  const amounts = monthKeys.reduce((acc, month) => {
    acc[month] = toInputValue(entry?.amounts?.[month]);
    return acc;
  }, {});

  return {
    staffName: normalizeStaffName(entry?.staffName || ""),
    amounts,
  };
}

function getRowTotal(row) {
  return monthKeys.reduce((sum, month) => {
    const value = Number(row?.amounts?.[month] || 0);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
}

function normalizeStaffName(value) {
  return String(value || "").replace(/\s+/g, "").trim();
}

function sanitizeAmountInput(value) {
  const cleaned = String(value || "")
    .replace(/[$,\s]/g, "")
    .replace(/[^\d.]/g, "");

  if (!cleaned) {
    return "";
  }

  const [integerPart = "", decimalPart = ""] = cleaned.split(".");
  const safeInteger = integerPart.replace(/\./g, "");
  const safeDecimal = decimalPart.replace(/\./g, "").slice(0, 2);

  if (!safeInteger && !safeDecimal) {
    return "";
  }

  return safeDecimal.length > 0 ? `${safeInteger}.${safeDecimal}` : safeInteger;
}

function normalizeAmountForSave(value) {
  const sanitized = sanitizeAmountInput(value);
  if (!sanitized) {
    return "";
  }
  const num = Number(sanitized);
  if (!Number.isFinite(num) || num < 0) {
    return "";
  }
  return num.toFixed(2);
}

function formatAmountInput(value) {
  const sanitized = sanitizeAmountInput(value);
  if (!sanitized) {
    return "";
  }
  const num = Number(sanitized);
  if (!Number.isFinite(num) || num < 0) {
    return "";
  }
  return moneyFormatter.format(num);
}

export default function HkfhSalesClient({ year: yearProp }) {
  const nowYear = new Date().getFullYear();
  const year = isValidYear(yearProp) ? String(yearProp) : String(nowYear);

  const [rows, setRows] = useState([createEmptyRow()]);
  const [activeAmountCell, setActiveAmountCell] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState("");
  const autoSaveTimerRef = useRef(null);
  const loadedRef = useRef(false);
  const lastSavedSnapshotRef = useRef("");

  useEffect(() => {
    async function loadYearData() {
      setLoading(true);
      setError("");
      setNotice("");
      try {
        const response = await fetch(`/api/hkfh-sales?year=${year}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            data?.error || "Unable to load Hong Kong branch sales entries."
          );
        }

        const entries = Array.isArray(data?.entries) ? data.entries : [];
        const nextRows =
          entries.length > 0
            ? entries.map((entry) => mapEntryToRow(entry))
            : [createEmptyRow()];
        setRows(nextRows);
        lastSavedSnapshotRef.current = JSON.stringify(buildPayloadRows(nextRows));
        loadedRef.current = true;
        setLastSavedAt(data?.updatedAt ? formatDateTime(data.updatedAt) : "");
      } catch (loadError) {
        setError(
          loadError?.message || "Unable to load Hong Kong branch sales entries."
        );
      } finally {
        setLoading(false);
      }
    }

    loadYearData();
  }, [year]);

  const monthlyTotals = useMemo(() => {
    return monthKeys.reduce((acc, month) => {
      acc[month] = rows.reduce((sum, row) => {
        const value = Number(row?.amounts?.[month] || 0);
        return sum + (Number.isFinite(value) ? value : 0);
      }, 0);
      return acc;
    }, {});
  }, [rows]);

  const grandTotal = useMemo(() => {
    return monthKeys.reduce((sum, month) => sum + (monthlyTotals[month] || 0), 0);
  }, [monthlyTotals]);

  function updateStaffName(index, value) {
    const nextName = normalizeStaffName(value);
    setRows((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index ? { ...row, staffName: nextName } : row
      )
    );
  }

  function updateAmount(index, month, value) {
    const nextAmount = sanitizeAmountInput(value);
    setRows((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              amounts: {
                ...row.amounts,
                [month]: nextAmount,
              },
            }
          : row
      )
    );
  }

  function normalizeAmount(index, month) {
    setRows((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              amounts: {
                ...row.amounts,
                [month]: normalizeAmountForSave(row.amounts[month]),
              },
            }
          : row
      )
    );
  }

  function handleAmountFocus(rowIndex, month, event) {
    setActiveAmountCell(`${rowIndex}-${month}`);
    requestAnimationFrame(() => {
      event.target.select();
    });
  }

  function addRow() {
    setRows((prev) => [...prev, createEmptyRow()]);
  }

  function removeRow(index) {
    setRows((prev) => {
      const nextRows = prev.filter((_, rowIndex) => rowIndex !== index);
      return nextRows.length > 0 ? nextRows : [createEmptyRow()];
    });
  }

  function buildPayloadRows() {
    return buildPayloadRowsFromState(rows);
  }

  function buildPayloadRowsFromState(sourceRows) {
    const filteredRows = [];
    const seenNames = new Set();

    for (let index = 0; index < sourceRows.length; index += 1) {
      const row = sourceRows[index];
      const staffName = normalizeStaffName(row.staffName || "");
      const amounts = monthKeys.reduce((acc, month) => {
        acc[month] = Number(row?.amounts?.[month] || 0);
        return acc;
      }, {});
      const rowTotal = monthKeys.reduce((sum, month) => sum + amounts[month], 0);

      if (!staffName && rowTotal === 0) {
        continue;
      }

      if (!staffName) {
        throw new Error(`Row ${index + 1}: staff name is required.`);
      }

      const normalizedName = staffName.toLowerCase();
      if (seenNames.has(normalizedName)) {
        throw new Error(`Row ${index + 1}: duplicate staff name "${staffName}".`);
      }
      seenNames.add(normalizedName);

      for (const month of monthKeys) {
        const value = amounts[month];
        if (!Number.isFinite(value) || value < 0) {
          throw new Error(
            `Row ${index + 1}: month ${month} must be zero or positive.`
          );
        }
      }

      filteredRows.push({
        staffName,
        amounts,
      });
    }

    return filteredRows;
  }

  async function persistRows(sourceRows, { silent = false } = {}) {
    if (!silent) {
      setError("");
      setNotice("");
    }

    const entries = buildPayloadRowsFromState(sourceRows);
    const snapshot = JSON.stringify(entries);

    setSaving(true);
    setAutoSaving(silent);

    try {
      const response = await fetch("/api/hkfh-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, entries }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to save Hong Kong branch sales entries."
        );
      }

      if (!silent) {
        const nextRows = Array.isArray(data?.entries)
          ? data.entries.map((entry) => mapEntryToRow(entry))
          : [];
        setRows(nextRows.length > 0 ? nextRows : [createEmptyRow()]);
      }

      lastSavedSnapshotRef.current = snapshot;
      setLastSavedAt(data?.updatedAt ? formatDateTime(data.updatedAt) : "");
      setNotice(
        silent
          ? "Autosaved Hong Kong branch sales entries."
          : "Saved Hong Kong branch sales entries."
      );
    } catch (saveError) {
      setError(
        saveError?.message || "Unable to save Hong Kong branch sales entries."
      );
    } finally {
      setAutoSaving(false);
      setSaving(false);
    }
  }

  async function handleSave() {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    await persistRows(rows, { silent: false });
  }

  useEffect(() => {
    if (!loadedRef.current || loading) {
      return;
    }

    let entries;
    try {
      entries = buildPayloadRowsFromState(rows);
    } catch (parseError) {
      return;
    }

    const snapshot = JSON.stringify(entries);
    if (snapshot === lastSavedSnapshotRef.current) {
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      persistRows(rows, { silent: true });
    }, AUTO_SAVE_DELAY_MS);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [rows, loading]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link className={styles.backLink} href="/">
            ← Back to reports
          </Link>
          <h1>香港分店營業額</h1>
          <p>Input monthly sales by staff and review yearly totals instantly.</p>
        </div>
        <div className={styles.headerActions}>
          <Link className={styles.summaryLink} href={`/hkfh-sales/summary/${year}`}>
            View annual summary
          </Link>
          <div className={styles.yearNav}>
            <Link
              className={styles.yearLink}
              href={`/hkfh-sales/${Number(year) - 1}`}
            >
              ← {Number(year) - 1}
            </Link>
            <span className={styles.yearBadge}>{year}</span>
            <Link
              className={styles.yearLink}
              href={`/hkfh-sales/${Number(year) + 1}`}
            >
              {Number(year) + 1} →
            </Link>
          </div>
        </div>
      </header>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2>{year} 年度記錄</h2>
            <p className={styles.note}>
              Edits autosave automatically. Use "Add row" for new staff names.
            </p>
          </div>
          <div className={styles.panelActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={addRow}
              disabled={loading || saving}
            >
              Add row
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleSave}
              disabled={loading || saving}
            >
              {saving ? (autoSaving ? "Autosaving..." : "Saving...") : "Save"}
            </button>
          </div>
        </div>

        {error ? <div className={styles.statusError}>{error}</div> : null}
        {!error && notice ? (
          <div className={styles.statusSuccess}>{notice}</div>
        ) : null}
        {loading ? <div className={styles.status}>Loading year data...</div> : null}
        {!loading && autoSaving ? (
          <div className={styles.status}>Autosaving...</div>
        ) : null}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.nameHeader}>經手人</th>
                {monthTabs.map((month) => (
                  <th key={month.key}>{month.label}</th>
                ))}
                <th>小計</th>
                <th className={styles.actionHeader}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => {
                const rowTotal = getRowTotal(row);
                return (
                  <tr key={`row-${rowIndex}`}>
                    <td className={styles.nameCell}>
                      <input
                        className={styles.nameInput}
                        value={row.staffName}
                        onChange={(event) =>
                          updateStaffName(rowIndex, event.target.value)
                        }
                        placeholder="Name"
                        disabled={loading || saving}
                      />
                    </td>
                    {monthKeys.map((month) => (
                      <td key={`${rowIndex}-${month}`}>
                        <div className={styles.amountField}>
                          <span className={styles.amountPrefix}>$</span>
                          <input
                            className={styles.amountInput}
                            type="text"
                            inputMode="decimal"
                            value={
                              activeAmountCell === `${rowIndex}-${month}`
                                ? row.amounts[month]
                                : formatAmountInput(row.amounts[month])
                            }
                            onFocus={(event) =>
                              handleAmountFocus(rowIndex, month, event)
                            }
                            onBlur={() => {
                              normalizeAmount(rowIndex, month);
                              setActiveAmountCell("");
                            }}
                            onChange={(event) =>
                              updateAmount(rowIndex, month, event.target.value)
                            }
                            disabled={loading || saving}
                          />
                        </div>
                      </td>
                    ))}
                    <td className={styles.totalCell}>{formatMoney(rowTotal)}</td>
                    <td className={styles.actionCell}>
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => removeRow(rowIndex)}
                        disabled={loading || saving}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <th className={styles.totalLabel}>合計</th>
                {monthKeys.map((month) => (
                  <th key={`total-${month}`} className={styles.totalCell}>
                    {formatMoney(monthlyTotals[month] || 0)}
                  </th>
                ))}
                <th className={styles.totalCell}>{formatMoney(grandTotal)}</th>
                <th />
              </tr>
            </tfoot>
          </table>
        </div>

        {lastSavedAt ? (
          <p className={styles.metaRow}>Last saved {lastSavedAt}.</p>
        ) : null}
      </section>
    </main>
  );
}
