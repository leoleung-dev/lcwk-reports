"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "../Cerement.module.css";

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

const heavenlyStems = [
  "甲",
  "乙",
  "丙",
  "丁",
  "戊",
  "己",
  "庚",
  "辛",
  "壬",
  "癸",
];

const earthlyBranches = [
  "子",
  "丑",
  "寅",
  "卯",
  "辰",
  "巳",
  "午",
  "未",
  "申",
  "酉",
  "戌",
  "亥",
];

const locations = [
  { key: "sifangjie", label: "四方街" },
  { key: "hkShop", label: "香港分店" },
  { key: "hkPickup", label: "香港取貨" },
  { key: "branchSales", label: "分店沽貨" },
  { key: "consultant", label: "禮儀顧問" },
];

const emptyValues = {
  sifangjie: "",
  hkShop: "",
  hkPickup: "",
  branchSales: "",
  consultant: "",
};

const moneyFormatter = new Intl.NumberFormat("en-HK", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatMoney(value) {
  const amount = Number(value || 0);
  return `$${moneyFormatter.format(amount)}`;
}

function isValidYear(value) {
  return /^\d{4}$/.test(value || "");
}

function parseTsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      const nextChar = line[i + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "\t" && !inQuotes) {
      fields.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  fields.push(current);
  return fields;
}

function splitColumns(line) {
  if (line.includes("\t")) {
    return parseTsvLine(line).map((value) => value.trim());
  }
  return line.split(/\s{2,}/).map((value) => value.trim());
}

function parseAmount(value) {
  const text = String(value || "").trim();
  if (!text) {
    return 0;
  }
  const cleaned = text.replace(/[\s$,]/g, "");
  if (!cleaned) {
    return 0;
  }
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : NaN;
}

function normalizeMonthValue(value) {
  const monthNum = Number(value);
  if (!Number.isFinite(monthNum) || monthNum < 1 || monthNum > 12) {
    return null;
  }
  return String(monthNum).padStart(2, "0");
}

function parseMonthFromDate(value, fallbackYear) {
  const text = String(value || "").trim();
  if (!text) {
    return null;
  }

  let match = text.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
  if (match) {
    const [, yearValue, monthValue] = match;
    const normalizedMonth = normalizeMonthValue(monthValue);
    if (!normalizedMonth) {
      return null;
    }
    return `${yearValue}-${normalizedMonth}`;
  }

  match = text.match(/^(\d{4})\/(\d{1,2})(?:\/\d{1,2})?$/);
  if (match) {
    const [, yearValue, monthValue] = match;
    const normalizedMonth = normalizeMonthValue(monthValue);
    if (!normalizedMonth) {
      return null;
    }
    return `${yearValue}-${normalizedMonth}`;
  }

  match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (match) {
    const [, rawMonth, , rawYear] = match;
    const monthValue = normalizeMonthValue(rawMonth);
    if (!monthValue) {
      return null;
    }
    const yearValue =
      rawYear.length === 2 ? String(2000 + Number(rawYear)) : rawYear;
    if (/^\d{4}$/.test(yearValue)) {
      return `${yearValue}-${monthValue}`;
    }
  }

  match = text.match(
    /^(\d{4})?\s*年?\s*(\d{1,2})\s*月(?:\s*(\d{1,2})\s*日?)?$/
  );
  if (match) {
    const yearValue = match[1] || fallbackYear;
    if (!/^\d{4}$/.test(yearValue || "")) {
      return null;
    }
    const monthValue = normalizeMonthValue(match[2]);
    if (!monthValue) {
      return null;
    }
    return `${yearValue}-${monthValue}`;
  }

  return null;
}

function getSexagenaryYearLabel(yearValue) {
  const yearNum = Number(yearValue);
  if (!Number.isFinite(yearNum)) {
    return "";
  }
  const baseYear = 1984;
  const index = ((yearNum - baseYear) % 60 + 60) % 60;
  const stem = heavenlyStems[index % 10];
  const branch = earthlyBranches[index % 12];
  return `歲次${stem}${branch}年 ${yearNum}`;
}

function getCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getInitialMonth(year) {
  const currentMonth = getCurrentMonth();
  if (currentMonth.startsWith(`${year}-`)) {
    return currentMonth;
  }
  return `${year}-01`;
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

function toInputValue(value) {
  if (value === null || value === undefined) {
    return "";
  }
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return "";
  }
  return String(numberValue);
}

export default function CerementClient({ year: yearProp }) {
  const nowYear = new Date().getFullYear();
  const year = isValidYear(yearProp) ? String(yearProp) : String(nowYear);
  const initialMonth = getInitialMonth(year);
  const chineseYearLabel = getSexagenaryYearLabel(year);
  const bulkEnabled = process.env.NEXT_PUBLIC_CEREMENT_BULK_ENTRY === "true";

  const [activeMonth, setActiveMonth] = useState(initialMonth);
  const [values, setValues] = useState(emptyValues);
  const [refreshToken, setRefreshToken] = useState(0);
  const [meta, setMeta] = useState({
    createdAt: null,
    updatedAt: null,
    createdBy: "",
    updatedBy: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    setActiveMonth(initialMonth);
  }, [initialMonth]);

  async function loadMonthData(targetMonth, { silent = false } = {}) {
    if (!targetMonth) {
      return;
    }
    if (!silent) {
      setLoading(true);
    }
    setError("");
    setNotice("");

    try {
      const response = await fetch(`/api/cerement?month=${targetMonth}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Unable to load cerement totals.");
      }

      const entry = data?.entry;
      if (entry) {
        setValues({
          sifangjie: toInputValue(entry.amountSifangjie),
          hkShop: toInputValue(entry.amountHkShop),
          hkPickup: toInputValue(entry.amountHkPickup),
          branchSales: toInputValue(entry.amountBranchSales),
          consultant: toInputValue(entry.amountConsultant),
        });
        setMeta({
          createdAt: entry.createdAt || null,
          updatedAt: entry.updatedAt || null,
          createdBy: entry.createdBy || "",
          updatedBy: entry.updatedBy || "",
        });
      } else {
        setValues(emptyValues);
        setMeta({
          createdAt: null,
          updatedAt: null,
          createdBy: "",
          updatedBy: "",
        });
      }
    } catch (loadError) {
      setError(loadError.message || "Unable to load cerement totals.");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    if (activeMonth) {
      loadMonthData(activeMonth);
    }
  }, [activeMonth, refreshToken]);

  const monthLabel = useMemo(() => {
    if (!activeMonth) {
      return "";
    }
    const [yearValue, monthValue] = activeMonth.split("-");
    const tab = monthTabs.find((item) => item.value === monthValue);
    if (!tab) {
      return activeMonth;
    }
    return `${tab.label} ${yearValue}`;
  }, [activeMonth]);

  const total = useMemo(() => {
    return locations.reduce((sum, location) => {
      const value = Number(values[location.key] || 0);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);
  }, [values]);

  const lastSaved = useMemo(() => {
    const stamp = meta.updatedAt || meta.createdAt;
    if (!stamp) {
      return "";
    }
    return `Last saved ${formatDateTime(stamp)}.`;
  }, [meta]);

  function handleChange(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!activeMonth) {
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    const payload = {
      month: activeMonth,
      sifangjie: Number(values.sifangjie || 0),
      hkShop: Number(values.hkShop || 0),
      hkPickup: Number(values.hkPickup || 0),
      branchSales: Number(values.branchSales || 0),
      consultant: Number(values.consultant || 0),
    };

    try {
      const response = await fetch("/api/cerement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Unable to save cerement totals.");
      }

      const entry = data?.entry;
      if (entry) {
        setValues({
          sifangjie: toInputValue(entry.amountSifangjie),
          hkShop: toInputValue(entry.amountHkShop),
          hkPickup: toInputValue(entry.amountHkPickup),
          branchSales: toInputValue(entry.amountBranchSales),
          consultant: toInputValue(entry.amountConsultant),
        });
        setMeta({
          createdAt: entry.createdAt || null,
          updatedAt: entry.updatedAt || null,
          createdBy: entry.createdBy || "",
          updatedBy: entry.updatedBy || "",
        });
      }

      setNotice("Saved totals for this month.");
    } catch (saveError) {
      setError(saveError.message || "Unable to save cerement totals.");
    } finally {
      setSaving(false);
    }
  }

  async function handleBulkImport() {
    setBulkStatus("");
    setBulkLoading(true);

    try {
      const lines = bulkText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length === 0) {
        setBulkStatus("Paste at least one row.");
        return;
      }

      const parsedRows = [];
      const errors = [];

      lines.forEach((line, index) => {
        const columns = splitColumns(line);
        if (columns.length < locations.length + 1) {
          errors.push(`Row ${index + 1}: expected a date plus 5 amounts.`);
          return;
        }

        const [dateText, ...amountTexts] = columns;
        const monthValue = parseMonthFromDate(dateText, year);
        if (!monthValue) {
          errors.push(`Row ${index + 1}: invalid date "${dateText}".`);
          return;
        }

        const amounts = amountTexts
          .slice(0, locations.length)
          .map((value) => parseAmount(value));

        if (amounts.some((value) => !Number.isFinite(value))) {
          errors.push(`Row ${index + 1}: invalid amount values.`);
          return;
        }

        parsedRows.push({
          month: monthValue,
          amounts,
        });
      });

      if (errors.length > 0) {
        setBulkStatus(errors.slice(0, 3).join(" "));
        return;
      }

      let successCount = 0;
      let failureCount = 0;
      const monthsTouched = new Set();

      for (const row of parsedRows) {
        try {
          const payload = {
            month: row.month,
            sifangjie: row.amounts[0] || 0,
            hkShop: row.amounts[1] || 0,
            hkPickup: row.amounts[2] || 0,
            branchSales: row.amounts[3] || 0,
            consultant: row.amounts[4] || 0,
          };

          const response = await fetch("/api/cerement", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data?.error || "Unable to save cerement totals.");
          }
          successCount += 1;
          monthsTouched.add(row.month);
        } catch (error) {
          failureCount += 1;
        }
      }

      if (monthsTouched.size === 1) {
        const [singleMonth] = Array.from(monthsTouched);
        setActiveMonth(singleMonth);
      } else if (monthsTouched.has(activeMonth)) {
        setRefreshToken((prev) => prev + 1);
      }

      setBulkStatus(
        `Imported ${successCount} rows.${failureCount ? ` ${failureCount} failed.` : ""}`
      );
    } catch (bulkError) {
      setBulkStatus(bulkError?.message || "Import failed.");
    } finally {
      setBulkLoading(false);
    }
  }

  const isBusy = loading || saving;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link className={styles.backLink} href="/">
            ← Back to reports
          </Link>
          <h1>壽衣紀錄 · Cerement</h1>
          <p>
            Reporting is done on the last day of each month. Record the total
            sold across each location.
          </p>
        </div>
        <div className={styles.yearNav}>
          <Link className={styles.yearLink} href={`/cerement/${Number(year) - 1}`}>
            ← {Number(year) - 1}
          </Link>
          <span className={styles.yearBadge}>{year}</span>
          <Link className={styles.yearLink} href={`/cerement/${Number(year) + 1}`}>
            {Number(year) + 1} →
          </Link>
        </div>
      </header>

      <div className={styles.yearLabelRow}>
        <div className={styles.yearLabel}>{chineseYearLabel}</div>
        <Link className={styles.summaryLink} href={`/cerement/summary/${year}`}>
          View annual summary
        </Link>
      </div>

      <div className={styles.monthTabs}>
        {monthTabs.map((month) => {
          const monthValue = `${year}-${month.value}`;
          const isActive = monthValue === activeMonth;
          return (
            <button
              key={month.value}
              type="button"
              className={`${styles.monthTab} ${isActive ? styles.monthTabActive : ""}`}
              onClick={() => setActiveMonth(monthValue)}
            >
              {month.label}
            </button>
          );
        })}
      </div>

      {bulkEnabled ? (
        <section className={styles.bulkPanel}>
          <div>
            <h3>Paste list</h3>
            <p>
              Paste rows with Date and 5 amounts (四方街, 香港分店, 香港取貨,
              分店沽貨, 禮儀顧問). Dates can be like 1月31日.
            </p>
          </div>
          <textarea
            className={styles.bulkText}
            rows={6}
            placeholder="1月31日	9,200.00	17,620.00	31,855.00	82,860.00	85,190.00"
            value={bulkText}
            onChange={(event) => setBulkText(event.target.value)}
          />
          <div className={styles.bulkActions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleBulkImport}
              disabled={bulkLoading}
            >
              {bulkLoading ? "Importing..." : "Import rows"}
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setBulkText("")}
            >
              Clear
            </button>
          </div>
          {bulkStatus ? <p className={styles.status}>{bulkStatus}</p> : null}
        </section>
      ) : null}

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2>{monthLabel}</h2>
            <p className={styles.note}>
              Record totals for 四方街, 香港分店, 香港取貨, 分店沽貨, 禮儀顧問.
            </p>
          </div>
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
            disabled={isBusy}
          >
            {saving ? "Saving..." : "Save totals"}
          </button>
        </div>

        {error ? <div className={styles.statusError}>{error}</div> : null}
        {!error && notice ? (
          <div className={styles.statusSuccess}>{notice}</div>
        ) : null}

        <div className={styles.formGrid}>
          {locations.map((location) => (
            <div key={location.key} className={styles.field}>
              <label htmlFor={`cerement-${location.key}`}>{location.label}</label>
              <input
                id={`cerement-${location.key}`}
                className={styles.input}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={values[location.key]}
                onChange={(event) => handleChange(location.key, event.target.value)}
                disabled={isBusy}
              />
            </div>
          ))}
        </div>

        <div className={styles.totalRow}>
          <span>Total</span>
          <span className={styles.totalValue}>{formatMoney(total)}</span>
        </div>

        {lastSaved ? <div className={styles.metaRow}>{lastSaved}</div> : null}
        {loading ? <div className={styles.status}>Loading month...</div> : null}
      </section>
    </main>
  );
}
