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

  const [activeMonth, setActiveMonth] = useState(initialMonth);
  const [values, setValues] = useState(emptyValues);
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

  useEffect(() => {
    setActiveMonth(initialMonth);
  }, [initialMonth]);

  useEffect(() => {
    let cancelled = false;

    async function loadMonth() {
      setLoading(true);
      setError("");
      setNotice("");

      try {
        const response = await fetch(`/api/cerement?month=${activeMonth}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || "Unable to load cerement totals.");
        }

        if (cancelled) {
          return;
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
        if (!cancelled) {
          setError(loadError.message || "Unable to load cerement totals.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (activeMonth) {
      loadMonth();
    }

    return () => {
      cancelled = true;
    };
  }, [activeMonth]);

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
