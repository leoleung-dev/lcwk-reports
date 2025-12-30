"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BsArrowDownUp,
  BsSortAlphaDown,
  BsSortAlphaDownAlt,
  BsSortDown,
  BsSortDownAlt,
  BsPencilSquare,
  BsFillTrash3Fill,
} from "react-icons/bs";
import styles from "./Commission.module.css";

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

const moneyFormatter = new Intl.NumberFormat("en-HK", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatMoney(value) {
  const amount = Number(value || 0);
  return `$${moneyFormatter.format(amount)}`;
}

function formatCreator(value) {
  const text = String(value || "").trim();
  if (!text || text.toLowerCase() === "unknown") {
    return "Unknown";
  }
  const atIndex = text.indexOf("@");
  if (atIndex === -1) {
    return text;
  }
  const localPart = text.slice(0, atIndex);
  const marker = ".lcwk";
  let namePart = "";
  if (localPart.endsWith(marker)) {
    namePart = localPart.slice(0, -marker.length);
  } else if (localPart.includes(marker)) {
    namePart = localPart.split(marker)[0];
  } else {
    return text;
  }
  const normalized = namePart.trim().toLowerCase();
  if (!normalized) {
    return text;
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
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

const monthNames = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

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

function parseCurrency(value) {
  const text = String(value || "").replace(/[\s$,]/g, "");
  if (!text) {
    return 0;
  }
  const num = Number(text);
  return Number.isFinite(num) ? num : NaN;
}

function parseRate(value, total, totalCommission) {
  const text = String(value || "").trim();
  if (text) {
    const cleaned = text.replace(/[%\s]/g, "");
    const num = Number(cleaned);
    if (!Number.isFinite(num)) {
      return NaN;
    }
    if (text.includes("%") || num > 1) {
      return num / 100;
    }
    return num;
  }
  if (total > 0 && totalCommission >= 0) {
    return totalCommission / total;
  }
  if (total === 0 && totalCommission === 0) {
    return 0;
  }
  return NaN;
}

function parsePercent(value) {
  const text = String(value || "").trim();
  if (!text) {
    return 0;
  }
  const cleaned = text.replace(/[%\s]/g, "");
  const num = Number(cleaned);
  if (!Number.isFinite(num)) {
    return NaN;
  }
  return num / 100;
}

function formatPercent(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return "0%";
  }
  const percent = (num * 100).toFixed(2);
  const trimmed = percent.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
  return `${trimmed}%`;
}

export default function CommissionClient({ year: yearProp }) {
  const searchParams = useSearchParams();
  const isAdminView = searchParams?.get("admin") === "true";
  const nowYear = new Date().getFullYear();
  const year = isValidYear(yearProp) ? yearProp : String(nowYear);
  const initialMonth = getInitialMonth(year);
  const bulkEnabled = process.env.NEXT_PUBLIC_COMMISSION_BULK_ENTRY === "true";
  const chineseYearLabel = getSexagenaryYearLabel(year);

  const [month, setMonth] = useState(initialMonth);
  const [clientName, setClientName] = useState("");
  const [handlerName, setHandlerName] = useState("");
  const [itemShroud, setItemShroud] = useState("");
  const [itemQuilt, setItemQuilt] = useState("");
  const [itemOther, setItemOther] = useState("");
  const [commissionRate, setCommissionRate] = useState("30%");
  const [handlers, setHandlers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [handlerMenuOpen, setHandlerMenuOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editMonth, setEditMonth] = useState("");
  const [editClientName, setEditClientName] = useState("");
  const [editHandlerName, setEditHandlerName] = useState("");
  const [editItemShroud, setEditItemShroud] = useState("");
  const [editItemQuilt, setEditItemQuilt] = useState("");
  const [editItemOther, setEditItemOther] = useState("");
  const [editCommissionRate, setEditCommissionRate] = useState("30%");
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const [editStatus, setEditStatus] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "asc",
  });
  const tableColSpan = isAdminView ? 11 : 9;

  const handlerInputRef = useRef(null);
  const handlerMenuRef = useRef(null);
  const editHandlerInputRef = useRef(null);
  const editMenuRef = useRef(null);

  const filteredHandlers = useMemo(() => {
    const query = handlerName.trim().toLowerCase();
    if (!query) {
      return handlers;
    }
    return handlers.filter((handler) =>
      handler.name.toLowerCase().includes(query)
    );
  }, [handlerName, handlers]);

  const filteredEditHandlers = useMemo(() => {
    const query = editHandlerName.trim().toLowerCase();
    if (!query) {
      return handlers;
    }
    return handlers.filter((handler) =>
      handler.name.toLowerCase().includes(query)
    );
  }, [editHandlerName, handlers]);

  const totals = useMemo(() => {
    const shroud = Number(itemShroud || 0);
    const quilt = Number(itemQuilt || 0);
    const other = Number(itemOther || 0);
    const total = shroud + quilt + other;
    const rate = parsePercent(commissionRate);
    const totalCommission = Number.isFinite(rate) ? total * rate : 0;
    return { total, totalCommission };
  }, [itemShroud, itemQuilt, itemOther, commissionRate]);

  const editTotals = useMemo(() => {
    const shroud = Number(editItemShroud || 0);
    const quilt = Number(editItemQuilt || 0);
    const other = Number(editItemOther || 0);
    const total = shroud + quilt + other;
    const rate = parsePercent(editCommissionRate);
    const totalCommission = Number.isFinite(rate) ? total * rate : 0;
    return { total, totalCommission };
  }, [editItemShroud, editItemQuilt, editItemOther, editCommissionRate]);

  const sortedEntries = useMemo(() => {
    if (!isAdminView) {
      return entries;
    }

    const { key, direction } = sortConfig;
    const multiplier = direction === "asc" ? 1 : -1;
    const safeString = (value) => String(value || "").toLowerCase();

    return [...entries].sort((a, b) => {
      if (key === "created_by") {
        return (
          safeString(a.created_by).localeCompare(safeString(b.created_by)) *
          multiplier
        );
      }

      if (key === "created_at") {
        const left = new Date(a.created_at).getTime();
        const right = new Date(b.created_at).getTime();
        return (left - right) * multiplier;
      }

      return 0;
    });
  }, [entries, isAdminView, sortConfig]);

  function updateSort(key, direction) {
    setSortConfig({ key, direction });
  }

  function handleSortClick(key) {
    if (sortConfig.key === key) {
      updateSort(key, sortConfig.direction === "asc" ? "desc" : "asc");
      return;
    }
    updateSort(key, "asc");
  }

  function getSortIcon(key, type) {
    if (sortConfig.key !== key) {
      return BsArrowDownUp;
    }
    if (type === "alpha") {
      return sortConfig.direction === "asc"
        ? BsSortAlphaDown
        : BsSortAlphaDownAlt;
    }
    return sortConfig.direction === "asc" ? BsSortDownAlt : BsSortDown;
  }

  useEffect(() => {
    async function loadHandlers() {
      try {
        const response = await fetch("/api/handlers");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Unable to load handlers.");
        }
        setHandlers(data.handlers || []);
      } catch (error) {
        setStatus("Unable to load handlers.");
      }
    }

    loadHandlers();
  }, []);

  useEffect(() => {
    function handleClick(event) {
      if (
        handlerMenuRef.current &&
        !handlerMenuRef.current.contains(event.target)
      ) {
        setHandlerMenuOpen(false);
      }

      if (editMenuRef.current && !editMenuRef.current.contains(event.target)) {
        setEditMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function loadEntries(targetMonth) {
    setEntriesLoading(true);
    try {
      const response = await fetch(`/api/commission?month=${targetMonth}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to load commission entries.");
      }
      setEntries(data.entries || []);
    } catch (error) {
      setStatus("Unable to load commission entries.");
    } finally {
      setEntriesLoading(false);
    }
  }

  useEffect(() => {
    if (month) {
      loadEntries(month);
    }
  }, [month]);

  async function ensureHandlerId(name) {
    const trimmedHandler = String(name || "").trim();
    if (!trimmedHandler) {
      throw new Error("Handler is required.");
    }
    const match = handlers.find(
      (handler) => handler.name.toLowerCase() === trimmedHandler.toLowerCase()
    );
    if (match) {
      return match.id;
    }

    const response = await fetch("/api/handlers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmedHandler }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to add handler.");
    }
    setHandlers((prev) => [...prev, data.handler]);
    return data.handler.id;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("");
    setLoading(true);

    try {
      const rate = parsePercent(commissionRate);
      if (!Number.isFinite(rate)) {
        throw new Error("佣 must be a valid percentage.");
      }
      const handlerId = await ensureHandlerId(handlerName);
      const response = await fetch("/api/commission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          clientName,
          handlerId,
          itemShroud: Number(itemShroud || 0),
          itemQuilt: Number(itemQuilt || 0),
          itemOther: Number(itemOther || 0),
          commissionRate: rate,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save entry.");
      }

      setClientName("");
      setHandlerName("");
      setItemShroud("");
      setItemQuilt("");
      setItemOther("");
      setStatus("Entry saved.");
      await loadEntries(month);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateEntry({
    id,
    month: entryMonth,
    clientName: updatedClient,
    handlerName: updatedHandler,
    itemShroud: updatedShroud,
    itemQuilt: updatedQuilt,
    itemOther: updatedOther,
    commissionRate: updatedRate,
  }) {
    const handlerId = await ensureHandlerId(updatedHandler);
    const response = await fetch("/api/commission", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        month: entryMonth,
        clientName: updatedClient,
        handlerId,
        itemShroud: Number(updatedShroud || 0),
        itemQuilt: Number(updatedQuilt || 0),
        itemOther: Number(updatedOther || 0),
        commissionRate: updatedRate,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to update entry.");
    }
    return data.entry;
  }

  function openEdit(entry) {
    setEditingEntry(entry);
    setEditMonth(
      entry.entry_month
        ? `20${entry.entry_month.slice(0, 2)}-${entry.entry_month.slice(2)}`
        : month
    );
    setEditClientName(entry.client_name);
    setEditHandlerName(entry.handler);
    setEditItemShroud(String(entry.item_shroud || ""));
    setEditItemQuilt(String(entry.item_quilt || ""));
    setEditItemOther(String(entry.item_other || ""));
    setEditCommissionRate(formatPercent(entry.commission_rate));
    setEditStatus("");
    setEditMenuOpen(false);
  }

  async function handleEditSave() {
    if (!editingEntry) {
      return;
    }
    setEditStatus("");
    setEditLoading(true);

    try {
      const rate = parsePercent(editCommissionRate);
      if (!Number.isFinite(rate)) {
        throw new Error("佣 must be a valid percentage.");
      }
      const updated = await updateEntry({
        id: editingEntry.id,
        month: editMonth,
        clientName: editClientName,
        handlerName: editHandlerName,
        itemShroud: editItemShroud,
        itemQuilt: editItemQuilt,
        itemOther: editItemOther,
        commissionRate: rate,
      });

      setEditingEntry(updated);
      setEditStatus("Saved.");
      if (editMonth !== month) {
        setMonth(editMonth);
      } else {
        await loadEntries(month);
      }
    } catch (error) {
      setEditStatus(error.message);
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDeleteEntry() {
    if (!editingEntry) {
      return;
    }
    const confirmed = window.confirm("Delete this entry?");
    if (!confirmed) {
      return;
    }

    setEditLoading(true);
    setEditStatus("");

    try {
      const response = await fetch("/api/commission", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingEntry.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete entry.");
      }
      setEditingEntry(null);
      await loadEntries(month);
    } catch (error) {
      setEditStatus(error.message);
    } finally {
      setEditLoading(false);
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
        if (columns.length < 4) {
          errors.push(`Row ${index + 1}: not enough columns.`);
          return;
        }

        let cursor = 0;
        const firstValue = columns[0]?.toLowerCase();
        if (monthNames.includes(firstValue)) {
          cursor += 1;
        }

        const client = columns[cursor];
        const handler = columns[cursor + 1];
        const tail = columns.slice(cursor + 2);

        if (!client || !handler) {
          errors.push(`Row ${index + 1}: client and handler are required.`);
          return;
        }

        if (tail.length < 3) {
          errors.push(`Row ${index + 1}: missing amounts or rate.`);
          return;
        }

        const rateText = tail[tail.length - 2];
        const totalCommissionText = tail[tail.length - 1];
        const amountColumns = tail.slice(0, Math.max(tail.length - 2, 0));
        const amounts = amountColumns
          .map((value) => parseCurrency(value))
          .filter((value) => Number.isFinite(value));

        let shroud = 0;
        let quilt = 0;
        let other = 0;

        if (amounts.length >= 4) {
          [shroud, quilt, other] = amounts;
        } else if (amounts.length === 3) {
          const sumTwo = amounts[0] + amounts[1];
          if (Math.abs(amounts[2] - sumTwo) <= 0.01) {
            [shroud, quilt] = amounts;
            other = 0;
          } else {
            [shroud, quilt, other] = amounts;
          }
        } else if (amounts.length === 2) {
          [shroud, quilt] = amounts;
        } else if (amounts.length === 1) {
          [shroud] = amounts;
        }

        const total = shroud + quilt + other;
        const totalCommission = parseCurrency(totalCommissionText);
        const rate = parseRate(rateText, total, totalCommission);

        if (!Number.isFinite(rate)) {
          errors.push(`Row ${index + 1}: invalid commission rate.`);
          return;
        }

        parsedRows.push({
          clientName: String(client).trim(),
          handlerName: String(handler).trim(),
          itemShroud: shroud,
          itemQuilt: quilt,
          itemOther: other,
          commissionRate: rate,
        });
      });

      if (errors.length > 0) {
        setBulkStatus(errors.slice(0, 3).join(" "));
        return;
      }

      let successCount = 0;
      let failureCount = 0;

      for (const row of parsedRows) {
        try {
          const handlerId = await ensureHandlerId(row.handlerName);
          const response = await fetch("/api/commission", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              month,
              clientName: row.clientName,
              handlerId,
              itemShroud: row.itemShroud,
              itemQuilt: row.itemQuilt,
              itemOther: row.itemOther,
              commissionRate: row.commissionRate,
            }),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || "Failed to save entry.");
          }
          successCount += 1;
        } catch (error) {
          failureCount += 1;
        }
      }

      await loadEntries(month);
      setBulkStatus(
        `Imported ${successCount} entries.${failureCount ? ` ${failureCount} failed.` : ""}`
      );
    } catch (error) {
      setBulkStatus(error?.message || "Import failed.");
    } finally {
      setBulkLoading(false);
    }
  }

  const totalEntriesAmount = useMemo(() => {
    return entries.reduce((sum, entry) => sum + Number(entry.total || 0), 0);
  }, [entries]);

  function handleExport() {
    if (!month) {
      return;
    }
    window.location.href = `/api/commission/export?month=${month}`;
  }

  return (
    <main className={styles.page}>
      {entriesLoading ? (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} aria-hidden />
          <span>Loading entries...</span>
        </div>
      ) : null}

      <header className={styles.header}>
        <div>
          <Link className={styles.backLink} href="/">
            ← Reports
          </Link>
          <h1>佣金登記 Master Commission</h1>
          <p>Track monthly commission entries and totals.</p>
        </div>
        <div className={styles.yearNav}>
          <Link className={styles.yearLink} href={`/commission/${Number(year) - 1}`}>
            ← {Number(year) - 1}
          </Link>
          <div className={styles.yearBadge}>{year}</div>
          <Link className={styles.yearLink} href={`/commission/${Number(year) + 1}`}>
            {Number(year) + 1} →
          </Link>
        </div>
      </header>

      <div className={styles.yearLabelRow}>
        <div className={styles.yearLabel}>{chineseYearLabel}</div>
        <Link className={styles.summaryLink} href={`/commission/${year}/summary`}>
          View annual summary
        </Link>
      </div>

      <section className={styles.monthTabs}>
        {monthTabs.map((tab) => {
          const value = `${year}-${tab.value}`;
          const isActive = month === value;
          return (
            <button
              key={value}
              type="button"
              className={`${styles.monthTab} ${
                isActive ? styles.monthTabActive : ""
              }`}
              onClick={() => setMonth(value)}
            >
              {tab.label}
            </button>
          );
        })}
      </section>

      <section className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Entries</span>
          <strong>{entries.length}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Monthly Total</span>
          <strong>{formatMoney(totalEntriesAmount)}</strong>
        </div>
        <button className={styles.exportButton} onClick={handleExport}>
          Export Excel
        </button>
      </section>

      {bulkEnabled ? (
        <section className={styles.bulkPanel}>
          <div>
            <h3>Paste list</h3>
            <p>
              Paste rows with Client, Handler, items, total, rate, commission.
              The selected month is applied to all rows.
            </p>
          </div>
          <textarea
            className={styles.bulkText}
            rows={6}
            placeholder="陸鄭嬙	梁家強		$138,000.00	$12,800.00	$150,800.00	30%	$45,240.00"
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

      <div className={styles.splitLayout}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>New commission entry</h2>
          </div>
          <form className={styles.form} onSubmit={handleSubmit}>
            <label>
              Client
              <input
                type="text"
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
                placeholder="Client name"
                required
              />
            </label>
            <label>
              經手者
              <div className={styles.handlerPicker} ref={handlerMenuRef}>
                <div className={styles.handlerInputRow}>
                  <input
                    ref={handlerInputRef}
                    type="text"
                    value={handlerName}
                    onChange={(event) => {
                      setHandlerName(event.target.value);
                      setHandlerMenuOpen(true);
                    }}
                    onFocus={() => setHandlerMenuOpen(true)}
                    placeholder="Start typing or select"
                    required
                  />
                  {handlerName ? (
                    <button
                      type="button"
                      className={styles.handlerClear}
                      onClick={() => {
                        setHandlerName("");
                        handlerInputRef.current?.focus();
                      }}
                      aria-label="Clear handler"
                    >
                      ×
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={styles.handlerToggle}
                    onClick={() => setHandlerMenuOpen((prev) => !prev)}
                    aria-label="Toggle handlers list"
                  >
                    ▾
                  </button>
                </div>
                {handlerMenuOpen ? (
                  <div className={styles.handlerMenu}>
                    {filteredHandlers.length === 0 ? (
                      <div className={styles.handlerEmpty}>
                        No matching handlers.
                      </div>
                    ) : (
                      filteredHandlers.map((handler) => (
                        <button
                          key={handler.id}
                          type="button"
                          className={styles.handlerOption}
                          onClick={() => {
                            setHandlerName(handler.name);
                            setHandlerMenuOpen(false);
                          }}
                        >
                          {handler.name}
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
            </label>
            <label>
              壽衣 (HKD)
              <input
                type="number"
                min="0"
                step="0.01"
                value={itemShroud}
                onChange={(event) => setItemShroud(event.target.value)}
                placeholder="0.00"
              />
            </label>
            <label>
              壽被 (HKD)
              <input
                type="number"
                min="0"
                step="0.01"
                value={itemQuilt}
                onChange={(event) => setItemQuilt(event.target.value)}
                placeholder="0.00"
              />
            </label>
            <label>
              其他 (HKD)
              <input
                type="number"
                min="0"
                step="0.01"
                value={itemOther}
                onChange={(event) => setItemOther(event.target.value)}
                placeholder="0.00"
              />
            </label>
            <label>
              佣 (percentage)
              <input
                type="text"
                inputMode="decimal"
                value={commissionRate}
                onChange={(event) => setCommissionRate(event.target.value)}
                placeholder="30%"
                required
              />
            </label>
            <div className={styles.summaryField}>
              <span>總計</span>
              <div className={styles.valuePill}>{formatMoney(totals.total)}</div>
            </div>
            <div className={styles.summaryField}>
              <span>Total Commission</span>
              <div className={styles.valuePill}>
                {formatMoney(totals.totalCommission)}
              </div>
            </div>
            <div className={styles.formActions}>
              <button className={styles.primaryButton} disabled={loading}>
                {loading ? "Saving..." : "Save entry"}
              </button>
            </div>
          </form>
          {status ? <p className={styles.status}>{status}</p> : null}
        </section>

        <section className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <h2>Entries for {month}</h2>
            <span>{entries.length} entries</span>
          </div>
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Handler</th>
                  <th>壽衣</th>
                  <th>壽被</th>
                  <th>其他</th>
                  <th>總計</th>
                  <th>佣</th>
                  <th>Total Commission</th>
                  {isAdminView ? (
                    <>
                      <th>
                        <div className={styles.thContent}>
                          <span>Created by</span>
                          <button
                            type="button"
                            className={`${styles.sortButton} ${
                              sortConfig.key === "created_by"
                                ? styles.sortActive
                                : ""
                            }`}
                            onClick={() => handleSortClick("created_by")}
                            aria-label="Sort created by"
                          >
                            {(() => {
                              const Icon = getSortIcon("created_by", "alpha");
                              return <Icon aria-hidden />;
                            })()}
                          </button>
                        </div>
                      </th>
                      <th>
                        <div className={styles.thContent}>
                          <span>Created on</span>
                          <button
                            type="button"
                            className={`${styles.sortButton} ${
                              sortConfig.key === "created_at"
                                ? styles.sortActive
                                : ""
                            }`}
                            onClick={() => handleSortClick("created_at")}
                            aria-label="Sort created on"
                          >
                            {(() => {
                              const Icon = getSortIcon("created_at", "numeric");
                              return <Icon aria-hidden />;
                            })()}
                          </button>
                        </div>
                      </th>
                    </>
                  ) : null}
                  <th>Edit</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={tableColSpan} className={styles.empty}>
                      No entries yet for this month.
                    </td>
                  </tr>
                ) : (
                  sortedEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.client_name}</td>
                      <td>{entry.handler}</td>
                      <td>{formatMoney(Number(entry.item_shroud))}</td>
                      <td>{formatMoney(Number(entry.item_quilt))}</td>
                      <td>{formatMoney(Number(entry.item_other))}</td>
                      <td>{formatMoney(Number(entry.total))}</td>
                      <td>{`${(Number(entry.commission_rate) * 100).toFixed(0)}%`}</td>
                      <td>{formatMoney(Number(entry.total_commission))}</td>
                      {isAdminView ? (
                        <>
                          <td>{formatCreator(entry.created_by)}</td>
                          <td>{formatDateTime(entry.created_at)}</td>
                        </>
                      ) : null}
                      <td>
                        <button
                          type="button"
                          className={styles.editButton}
                          onClick={() => openEdit(entry)}
                          aria-label="Edit entry"
                        >
                          <BsPencilSquare aria-hidden />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className={styles.mobileList}>
            {entries.length === 0 ? (
              <div className={styles.empty}>No entries yet for this month.</div>
            ) : (
              sortedEntries.map((entry) => (
                <div key={entry.id} className={styles.entryCard}>
                  <div className={styles.cardRow}>
                    <div className={styles.cardCell}>
                      <span className={styles.cardLabel}>Client</span>
                      <span>{entry.client_name}</span>
                    </div>
                    <div className={styles.cardCell}>
                      <span className={styles.cardLabel}>Handler</span>
                      <span>{entry.handler}</span>
                    </div>
                    <div className={styles.cardCell}>
                      <span className={styles.cardLabel}>總計</span>
                      <span>{formatMoney(Number(entry.total))}</span>
                    </div>
                  </div>
                  <div className={styles.cardRow}>
                    <div className={styles.cardCell}>
                      <span className={styles.cardLabel}>壽衣</span>
                      <span>{formatMoney(Number(entry.item_shroud))}</span>
                    </div>
                    <div className={styles.cardCell}>
                      <span className={styles.cardLabel}>壽被</span>
                      <span>{formatMoney(Number(entry.item_quilt))}</span>
                    </div>
                    <div className={styles.cardCell}>
                      <span className={styles.cardLabel}>其他</span>
                      <span>{formatMoney(Number(entry.item_other))}</span>
                    </div>
                  </div>
                  <div className={styles.cardRow}>
                    <div className={styles.cardCell}>
                      <span className={styles.cardLabel}>佣</span>
                      <span>{`${(Number(entry.commission_rate) * 100).toFixed(0)}%`}</span>
                    </div>
                    <div className={styles.cardCell}>
                      <span className={styles.cardLabel}>Commission</span>
                      <span>{formatMoney(Number(entry.total_commission))}</span>
                    </div>
                    {isAdminView ? (
                      <>
                        <div className={styles.cardCell}>
                          <span className={styles.cardLabel}>Created by</span>
                          <span>{formatCreator(entry.created_by)}</span>
                        </div>
                        <div className={styles.cardCell}>
                          <span className={styles.cardLabel}>Created on</span>
                          <span>{formatDateTime(entry.created_at)}</span>
                        </div>
                      </>
                    ) : null}
                    <div className={styles.cardCell}>
                      <span className={styles.cardLabel}>Edit</span>
                      <button
                        type="button"
                        className={styles.editButton}
                        onClick={() => openEdit(entry)}
                        aria-label="Edit entry"
                      >
                        <BsPencilSquare aria-hidden />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {editingEntry ? (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Edit entry</h3>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setEditingEntry(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <label>
                Month
                <input
                  type="month"
                  value={editMonth}
                  onChange={(event) => setEditMonth(event.target.value)}
                />
              </label>
              <label>
                Client
                <input
                  type="text"
                  value={editClientName}
                  onChange={(event) => setEditClientName(event.target.value)}
                />
              </label>
              <label>
                經手者
                <div className={styles.handlerPicker} ref={editMenuRef}>
                  <div className={styles.handlerInputRow}>
                    <input
                      ref={editHandlerInputRef}
                      type="text"
                      value={editHandlerName}
                      onChange={(event) => {
                        setEditHandlerName(event.target.value);
                        setEditMenuOpen(true);
                      }}
                      onFocus={() => setEditMenuOpen(true)}
                      placeholder="Start typing or select"
                    />
                    {editHandlerName ? (
                      <button
                        type="button"
                        className={styles.handlerClear}
                        onClick={() => {
                          setEditHandlerName("");
                          editHandlerInputRef.current?.focus();
                        }}
                        aria-label="Clear handler"
                      >
                        ×
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={styles.handlerToggle}
                      onClick={() => setEditMenuOpen((prev) => !prev)}
                      aria-label="Toggle handlers list"
                    >
                      ▾
                    </button>
                  </div>
                  {editMenuOpen ? (
                    <div className={styles.handlerMenu}>
                      {filteredEditHandlers.length === 0 ? (
                        <div className={styles.handlerEmpty}>
                          No matching handlers.
                        </div>
                      ) : (
                        filteredEditHandlers.map((handler) => (
                          <button
                            key={handler.id}
                            type="button"
                            className={styles.handlerOption}
                            onClick={() => {
                              setEditHandlerName(handler.name);
                              setEditMenuOpen(false);
                            }}
                          >
                            {handler.name}
                          </button>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>
              </label>
              <label>
                壽衣 (HKD)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editItemShroud}
                  onChange={(event) => setEditItemShroud(event.target.value)}
                />
              </label>
              <label>
                壽被 (HKD)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editItemQuilt}
                  onChange={(event) => setEditItemQuilt(event.target.value)}
                />
              </label>
              <label>
                其他 (HKD)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editItemOther}
                  onChange={(event) => setEditItemOther(event.target.value)}
                />
              </label>
              <label>
                佣 (percentage)
                <input
                  type="text"
                  inputMode="decimal"
                  value={editCommissionRate}
                  onChange={(event) => setEditCommissionRate(event.target.value)}
                />
              </label>
              <div className={styles.summaryField}>
                <span>總計</span>
                <div className={styles.valuePill}>
                  {formatMoney(editTotals.total)}
                </div>
              </div>
              <div className={styles.summaryField}>
                <span>Total Commission</span>
                <div className={styles.valuePill}>
                  {formatMoney(editTotals.totalCommission)}
                </div>
              </div>
            </div>
            {editStatus ? <p className={styles.status}>{editStatus}</p> : null}
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleEditSave}
                disabled={editLoading}
              >
                {editLoading ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setEditingEntry(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.dangerButton}
                onClick={handleDeleteEntry}
                disabled={editLoading}
              >
                <BsFillTrash3Fill aria-hidden />
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
