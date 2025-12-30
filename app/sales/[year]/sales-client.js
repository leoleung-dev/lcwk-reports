"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  BsArrowDownUp,
  BsSortAlphaDown,
  BsSortAlphaDownAlt,
  BsSortDown,
  BsSortDownAlt,
  BsPencilSquare,
  BsFillTrash3Fill,
} from "react-icons/bs";
import styles from "../Sales.module.css";

let cachedServices = null;
const entriesCache = new Map();

const moneyFormatter = new Intl.NumberFormat("en-HK", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatMoney(value) {
  const amount = Number(value || 0);
  return `$${moneyFormatter.format(amount)}`;
}

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

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function getInitialEntryDate(year, month) {
  const today = getToday();
  if (today.startsWith(`${year}-`) && today.startsWith(`${month}-`)) {
    return today;
  }
  return `${month}-01`;
}

function formatDate(value) {
  if (!value) {
    return "";
  }
  const text = String(value);
  return text.includes("T") ? text.split("T")[0] : text;
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

export default function SalesClient({ year: yearProp }) {
  const searchParams = useSearchParams();
  const isAdminView = searchParams?.get("admin") === "true";
  const nowYear = new Date().getFullYear();
  const year = isValidYear(yearProp) ? yearProp : String(nowYear);
  const initialMonth = getInitialMonth(year);
  const bulkEnabled = process.env.NEXT_PUBLIC_SALE_BULK_ENTRY === "true";
  const chineseYearLabel = getSexagenaryYearLabel(year);

  const [month, setMonth] = useState(initialMonth);
  const [entryDate, setEntryDate] = useState(
    getInitialEntryDate(year, initialMonth)
  );
  const [reference, setReference] = useState("...");
  const [clientName, setClientName] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [serviceMenuOpen, setServiceMenuOpen] = useState(false);
  const [costHkd, setCostHkd] = useState("");
  const [services, setServices] = useState([]);
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editClientName, setEditClientName] = useState("");
  const [editServiceName, setEditServiceName] = useState("");
  const [editCostHkd, setEditCostHkd] = useState("");
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const [editStatus, setEditStatus] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "reference",
    direction: "asc",
  });
  const tableColSpan = isAdminView ? 8 : 6;

  const total = useMemo(() => {
    return entries.reduce((sum, entry) => sum + Number(entry.cost_hkd || 0), 0);
  }, [entries]);

  const serviceInputRef = useRef(null);
  const serviceMenuRef = useRef(null);
  const editServiceInputRef = useRef(null);
  const editMenuRef = useRef(null);

  const filteredServices = useMemo(() => {
    const query = serviceName.trim().toLowerCase();
    if (!query) {
      return services;
    }
    return services.filter((service) =>
      service.name.toLowerCase().includes(query)
    );
  }, [serviceName, services]);

  const filteredEditServices = useMemo(() => {
    const query = editServiceName.trim().toLowerCase();
    if (!query) {
      return services;
    }
    return services.filter((service) =>
      service.name.toLowerCase().includes(query)
    );
  }, [editServiceName, services]);

  const sortedEntries = useMemo(() => {
    const { key, direction } = sortConfig;
    const multiplier = direction === "asc" ? 1 : -1;
    const safeString = (value) => String(value || "").toLowerCase();
    const safeNumber = (value) => {
      const num = Number(value);
      return Number.isFinite(num) ? num : 0;
    };

    return [...entries].sort((a, b) => {
      let left = "";
      let right = "";

      if (key === "entry_date") {
        left = new Date(a.entry_date).getTime();
        right = new Date(b.entry_date).getTime();
        return (left - right) * multiplier;
      }

      if (key === "cost_hkd") {
        return (safeNumber(a.cost_hkd) - safeNumber(b.cost_hkd)) * multiplier;
      }

      if (key === "reference") {
        left = safeString(a.reference);
        right = safeString(b.reference);
        return left.localeCompare(right) * multiplier;
      }

      if (key === "client_name") {
        left = safeString(a.client_name);
        right = safeString(b.client_name);
        return left.localeCompare(right) * multiplier;
      }

      if (key === "service") {
        left = safeString(a.service);
        right = safeString(b.service);
        return left.localeCompare(right) * multiplier;
      }

      if (key === "created_by") {
        left = safeString(a.created_by);
        right = safeString(b.created_by);
        return left.localeCompare(right) * multiplier;
      }

      if (key === "created_at") {
        left = new Date(a.created_at).getTime();
        right = new Date(b.created_at).getTime();
        return (left - right) * multiplier;
      }

      return 0;
    });
  }, [entries, sortConfig]);

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

  async function loadServices() {
    if (cachedServices) {
      setServices(cachedServices);
      return;
    }
    try {
      const response = await fetch("/api/services");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to load services.");
      }
      const nextServices = data.services || [];
      setServices(nextServices);
      cachedServices = nextServices;
    } catch (error) {
      setStatus("Unable to load services.");
    }
  }

  async function loadEntries(targetMonth, options = {}) {
    const { forceRefresh = false } = options;
    const cached = entriesCache.get(targetMonth);
    if (cached && !forceRefresh) {
      setEntries(cached);
      setEntriesLoading(false);
      return;
    }

    setEntriesLoading(true);
    try {
      const response = await fetch(`/api/sales?month=${targetMonth}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to load sales entries.");
      }
      const nextEntries = data.entries || [];
      setEntries(nextEntries);
      entriesCache.set(targetMonth, nextEntries);
    } catch (error) {
      setStatus("Unable to load sales entries.");
    } finally {
      setEntriesLoading(false);
    }
  }

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    function handleClick(event) {
      if (
        serviceMenuRef.current &&
        !serviceMenuRef.current.contains(event.target)
      ) {
        setServiceMenuOpen(false);
      }

      if (
        editMenuRef.current &&
        !editMenuRef.current.contains(event.target)
      ) {
        setEditMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (month) {
      loadEntries(month);
    }
  }, [month]);

  async function loadReferenceForDate(dateValue) {
    try {
      const response = await fetch(`/api/sales/reference?date=${dateValue}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to load reference.");
      }
      setReference(data.reference || "...");
    } catch (error) {
      setReference("...");
    }
  }

  useEffect(() => {
    if (entryDate) {
      loadReferenceForDate(entryDate);
    }
  }, [entryDate]);

function normalizeDate(value, fallbackYear) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }
  const chineseMatch = text.match(
    /^(\d{4})?\s*年?\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日?$/
  );
  if (chineseMatch) {
    const yearText = chineseMatch[1] || fallbackYear;
    if (!/^\d{4}$/.test(yearText || "")) {
      return "";
    }
    const month = String(chineseMatch[2]).padStart(2, "0");
    const day = String(chineseMatch[3]).padStart(2, "0");
    return `${yearText}-${month}-${day}`;
  }
  const parts = text.split("/");
  if (parts.length === 3) {
    const [rawMonth, rawDay, rawYear] = parts;
    const month = rawMonth.padStart(2, "0");
    const day = rawDay.padStart(2, "0");
      let year = rawYear;
      if (rawYear.length === 2) {
        year = String(2000 + Number(rawYear));
      }
      if (/^\d{4}$/.test(year)) {
        return `${year}-${month}-${day}`;
      }
    }
    return "";
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

  async function ensureServiceId(name) {
    const trimmedService = String(name || "").trim();
    if (!trimmedService) {
      throw new Error("Service is required.");
    }
    const match = services.find(
      (service) => service.name.toLowerCase() === trimmedService.toLowerCase()
    );
    if (match) {
      return match.id;
    }

    const serviceResponse = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmedService }),
    });
    const serviceData = await serviceResponse.json();
    if (!serviceResponse.ok) {
      if (serviceResponse.status === 409) {
        const refreshed = await fetch("/api/services");
        const refreshedData = await refreshed.json();
        if (refreshed.ok) {
          setServices(refreshedData.services || []);
          cachedServices = refreshedData.services || [];
        }
        const existing = (refreshedData?.services || []).find(
          (service) =>
            service.name.toLowerCase() === trimmedService.toLowerCase()
        );
        if (existing) {
          return existing.id;
        }
      }
      throw new Error(serviceData.error || "Failed to add service.");
    }
    setServices((prev) => {
      const next = [...prev, serviceData.service];
      cachedServices = next;
      return next;
    });
    return serviceData.service.id;
  }

  async function createEntry({ entryDate, clientName, serviceName, costHkd }) {
    const resolvedServiceId = await ensureServiceId(serviceName);
    const response = await fetch("/api/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entryDate,
        clientName,
        serviceId: Number(resolvedServiceId),
        costHkd: Number(costHkd),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to save entry.");
    }
    return data.entry;
  }

  async function updateEntry({ id, entryDate, clientName, serviceName, costHkd }) {
    const resolvedServiceId = await ensureServiceId(serviceName);
    const response = await fetch("/api/sales", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        entryDate,
        clientName,
        serviceId: Number(resolvedServiceId),
        costHkd: Number(costHkd),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to update entry.");
    }
    return data.entry;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("");
    setLoading(true);

    try {
      await createEntry({
        entryDate,
        clientName,
        serviceName,
        costHkd,
      });

      const entryMonth = entryDate.slice(0, 7);
      entriesCache.delete(entryMonth);
      if (month === entryMonth) {
        await loadEntries(month, { forceRefresh: true });
      }
      setClientName("");
      setCostHkd("");
      setStatus("Entry saved.");
      if (month !== entryDate.slice(0, 7)) {
        setMonth(entryDate.slice(0, 7));
      }
      await loadReferenceForDate(entryDate);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  function openEdit(entry) {
    setEditingEntry(entry);
    setEditDate(formatDate(entry.entry_date));
    setEditClientName(entry.client_name);
    setEditServiceName(entry.service);
    setEditCostHkd(String(entry.cost_hkd));
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
    const previousMonth = formatDate(editingEntry.entry_date).slice(0, 7);
    const updated = await updateEntry({
      id: editingEntry.id,
      entryDate: editDate,
      clientName: editClientName,
      serviceName: editServiceName,
      costHkd: editCostHkd,
    });

    const updatedMonth = editDate.slice(0, 7);
    entriesCache.delete(previousMonth);
    entriesCache.delete(updatedMonth);
    if (month !== updatedMonth) {
      setMonth(updatedMonth);
    } else {
      await loadEntries(month, { forceRefresh: true });
    }
      setEditingEntry(updated);
      setEditStatus("Saved.");
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
      const response = await fetch("/api/sales", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingEntry.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete entry.");
      }
      entriesCache.delete(formatDate(editingEntry.entry_date).slice(0, 7));
      setEditingEntry(null);
      await loadEntries(month, { forceRefresh: true });
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
        const columns = parseTsvLine(line);
        let dateText;
        let client;
        let service;
        let costText;

        if (columns.length >= 5) {
          [dateText, , client, service, costText] = columns;
        } else if (columns.length === 4) {
          [dateText, client, service, costText] = columns;
        } else {
          errors.push(`Row ${index + 1}: expected 4 or 5 columns.`);
          return;
        }

        const normalizedDate = normalizeDate(dateText, year);
        if (!normalizedDate) {
          errors.push(`Row ${index + 1}: invalid date "${dateText}".`);
          return;
        }

        const clientNameValue = String(client || "").trim();
        const serviceValue = String(service || "").trim();
        const costValue = Number(String(costText || "").replace(/,/g, ""));

        if (!clientNameValue) {
          errors.push(`Row ${index + 1}: client name is required.`);
          return;
        }
        if (!serviceValue) {
          errors.push(`Row ${index + 1}: service is required.`);
          return;
        }
        if (!Number.isFinite(costValue) || costValue <= 0) {
          errors.push(`Row ${index + 1}: invalid cost "${costText}".`);
          return;
        }

        parsedRows.push({
          entryDate: normalizedDate,
          clientName: clientNameValue,
          serviceName: serviceValue,
          costHkd: costValue,
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
          await createEntry(row);
          successCount += 1;
          monthsTouched.add(row.entryDate.slice(0, 7));
        } catch (error) {
          failureCount += 1;
        }
      }

      monthsTouched.forEach((monthValue) => {
        entriesCache.delete(monthValue);
      });

      if (monthsTouched.size === 1) {
        const [singleMonth] = Array.from(monthsTouched);
        setMonth(singleMonth);
        await loadEntries(singleMonth, { forceRefresh: true });
      } else {
        await loadEntries(month, { forceRefresh: true });
      }

      setBulkStatus(
        `Imported ${successCount} entries.${failureCount ? ` ${failureCount} failed.` : ""}`
      );
    } catch (error) {
      setBulkStatus(error?.message || "Import failed.");
    } finally {
      setBulkLoading(false);
    }
  }

  function handleExport() {
    if (!month) {
      return;
    }
    window.location.href = `/api/sales/export?month=${month}`;
  }

  return (
    <main className={styles.page}>
      {entriesLoading ? (
        <div className={styles.loadingOverlay} aria-live="polite">
          <div className={styles.spinner} aria-hidden />
          <span>Loading entries...</span>
        </div>
      ) : null}
      <header className={styles.header}>
        <div>
          <Link className={styles.backLink} href="/">
            ← Reports
          </Link>
          <h1>營業額 Annual Sales</h1>
          <p>Monthly view with quick entry and export to Excel.</p>
        </div>
        <div className={styles.yearNav}>
          <Link className={styles.yearLink} href={`/sales/${Number(year) - 1}`}>
            ← {Number(year) - 1}
          </Link>
          <div className={styles.yearBadge}>{year}</div>
          <Link className={styles.yearLink} href={`/sales/${Number(year) + 1}`}>
            {Number(year) + 1} →
          </Link>
        </div>
      </header>

      <div className={styles.yearLabelRow}>
        <div className={styles.yearLabel}>{chineseYearLabel}</div>
        <Link className={styles.summaryLink} href={`/sales/${year}/summary`}>
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
              onClick={() => {
                setMonth(value);
                setEntryDate(`${value}-01`);
              }}
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
          <strong>{formatMoney(total)}</strong>
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
              Paste tab-separated rows: Date, Ref (optional), Client name,
              Service, Cost. Dates can be like 10月7日.
            </p>
          </div>
          <textarea
            className={styles.bulkText}
            rows={6}
            placeholder="10月7日	1	鄒汝添府君	加灰喃嘸費用	2800"
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
            <h2>New sales entry</h2>
            <span className={styles.reference}>Ref: {reference}</span>
          </div>
          <form className={styles.form} onSubmit={handleSubmit}>
            <label>
              Date
              <input
                type="date"
                value={entryDate}
                min={`${year}-01-01`}
                max={`${year}-12-31`}
                onChange={(event) => {
                  const nextDate = event.target.value;
                  setEntryDate(nextDate);
                  if (nextDate && nextDate.slice(0, 7) !== month) {
                    setMonth(nextDate.slice(0, 7));
                  }
                }}
                required
              />
            </label>
            <label>
              Client name
              <input
                type="text"
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
                placeholder="Client name"
                required
              />
            </label>
            <label>
              Service
              <div className={styles.servicePicker} ref={serviceMenuRef}>
                <div className={styles.serviceInputRow}>
                  <input
                    ref={serviceInputRef}
                    type="text"
                    value={serviceName}
                    onChange={(event) => {
                      setServiceName(event.target.value);
                      setServiceMenuOpen(true);
                    }}
                    onFocus={() => setServiceMenuOpen(true)}
                    placeholder="Start typing or select"
                    required
                  />
                  {serviceName ? (
                    <button
                      type="button"
                      className={styles.serviceClear}
                      onClick={() => {
                        setServiceName("");
                        serviceInputRef.current?.focus();
                      }}
                      aria-label="Clear service"
                    >
                      ×
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={styles.serviceToggle}
                    onClick={() => setServiceMenuOpen((prev) => !prev)}
                    aria-label="Toggle services list"
                  >
                    ▾
                  </button>
                </div>
                {serviceMenuOpen ? (
                  <div className={styles.serviceMenu}>
                    {filteredServices.length === 0 ? (
                      <div className={styles.serviceEmpty}>
                        No matching services.
                      </div>
                    ) : (
                      filteredServices.map((service) => (
                        <button
                          key={service.id}
                          type="button"
                          className={styles.serviceOption}
                          onClick={() => {
                            setServiceName(service.name);
                            setServiceMenuOpen(false);
                          }}
                        >
                          {service.name}
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
            </label>
            <label>
              Cost (HKD)
              <input
                type="number"
                min="0"
                step="0.01"
                value={costHkd}
                onChange={(event) => setCostHkd(event.target.value)}
                placeholder="0.00"
                required
              />
            </label>
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
            <span className={styles.tableNote}>
              Reference format: 001/{month.slice(2).replace("-", "")}
            </span>
          </div>
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>
                    <div className={styles.thContent}>
                      <span>Date</span>
                      <button
                        type="button"
                        className={`${styles.sortButton} ${
                          sortConfig.key === "entry_date" ? styles.sortActive : ""
                        }`}
                        onClick={() => handleSortClick("entry_date")}
                        aria-label="Sort date"
                      >
                        {(() => {
                          const Icon = getSortIcon("entry_date", "numeric");
                          return <Icon aria-hidden />;
                        })()}
                      </button>
                    </div>
                  </th>
                  <th>
                    <div className={styles.thContent}>
                      <span>Reference</span>
                      <button
                        type="button"
                        className={`${styles.sortButton} ${
                          sortConfig.key === "reference" ? styles.sortActive : ""
                        }`}
                        onClick={() => handleSortClick("reference")}
                        aria-label="Sort reference"
                      >
                        {(() => {
                          const Icon = getSortIcon("reference", "numeric");
                          return <Icon aria-hidden />;
                        })()}
                      </button>
                    </div>
                  </th>
                  <th>
                    <div className={styles.thContent}>
                      <span>Client name</span>
                      <button
                        type="button"
                        className={`${styles.sortButton} ${
                          sortConfig.key === "client_name" ? styles.sortActive : ""
                        }`}
                        onClick={() => handleSortClick("client_name")}
                        aria-label="Sort client name"
                      >
                        {(() => {
                          const Icon = getSortIcon("client_name", "alpha");
                          return <Icon aria-hidden />;
                        })()}
                      </button>
                    </div>
                  </th>
                  <th>
                    <div className={styles.thContent}>
                      <span>Service</span>
                    </div>
                  </th>
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
                  <th className={styles.amount}>
                    <div className={styles.thContent}>
                      <span>Cost</span>
                      <button
                        type="button"
                        className={`${styles.sortButton} ${
                          sortConfig.key === "cost_hkd" ? styles.sortActive : ""
                        }`}
                        onClick={() => handleSortClick("cost_hkd")}
                        aria-label="Sort cost"
                      >
                        {(() => {
                          const Icon = getSortIcon("cost_hkd", "numeric");
                          return <Icon aria-hidden />;
                        })()}
                      </button>
                    </div>
                  </th>
                  <th className={styles.actionsColumn}>Edit</th>
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
                      <td>{formatDate(entry.entry_date)}</td>
                      <td>
                        <span className={styles.referenceChip}>
                          {entry.reference}
                        </span>
                      </td>
                      <td>{entry.client_name}</td>
                      <td>
                        <span className={styles.serviceChip}>
                          {entry.service}
                        </span>
                      </td>
                      {isAdminView ? (
                        <>
                          <td>{formatCreator(entry.created_by)}</td>
                          <td>{formatDateTime(entry.created_at)}</td>
                        </>
                      ) : null}
                      <td className={styles.amount}>
                      {formatMoney(Number(entry.cost_hkd || 0))}
                      </td>
                      <td className={styles.actionsColumn}>
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
                      <span className={styles.cardLabel}>Date</span>
                      <span>{formatDate(entry.entry_date)}</span>
                    </div>
                    <div className={styles.cardCell}>
                      <span className={styles.cardLabel}>Reference</span>
                      <span className={styles.referenceChip}>
                        {entry.reference}
                      </span>
                    </div>
                    <div className={styles.cardCell}>
                      <span className={styles.cardLabel}>Client</span>
                      <span>{entry.client_name}</span>
                    </div>
                  </div>
                  <div className={styles.cardRow}>
                    <div className={styles.cardCell}>
                      <span className={styles.cardLabel}>Service</span>
                      <span className={styles.serviceChip}>
                        {entry.service}
                      </span>
                    </div>
                    <div className={styles.cardCell}>
                      <span className={styles.cardLabel}>Cost</span>
                      <span>{formatMoney(Number(entry.cost_hkd || 0))}</span>
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
                Date
                <input
                  type="date"
                  value={editDate}
                  onChange={(event) => setEditDate(event.target.value)}
                />
              </label>
              <label>
                Client name
                <input
                  type="text"
                  value={editClientName}
                  onChange={(event) => setEditClientName(event.target.value)}
                />
              </label>
              <label>
                Service
                <div className={styles.servicePicker} ref={editMenuRef}>
                  <div className={styles.serviceInputRow}>
                    <input
                      ref={editServiceInputRef}
                      type="text"
                      value={editServiceName}
                      onChange={(event) => {
                        setEditServiceName(event.target.value);
                        setEditMenuOpen(true);
                      }}
                      onFocus={() => setEditMenuOpen(true)}
                      placeholder="Start typing or select"
                    />
                    {editServiceName ? (
                      <button
                        type="button"
                        className={styles.serviceClear}
                        onClick={() => {
                          setEditServiceName("");
                          editServiceInputRef.current?.focus();
                        }}
                        aria-label="Clear service"
                      >
                        ×
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={styles.serviceToggle}
                      onClick={() => setEditMenuOpen((prev) => !prev)}
                      aria-label="Toggle services list"
                    >
                      ▾
                    </button>
                  </div>
                  {editMenuOpen ? (
                    <div className={styles.serviceMenu}>
                      {filteredEditServices.length === 0 ? (
                        <div className={styles.serviceEmpty}>
                          No matching services.
                        </div>
                      ) : (
                        filteredEditServices.map((service) => (
                          <button
                            key={service.id}
                            type="button"
                            className={styles.serviceOption}
                            onClick={() => {
                              setEditServiceName(service.name);
                              setEditMenuOpen(false);
                            }}
                          >
                            {service.name}
                          </button>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>
              </label>
              <label>
                Cost (HKD)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editCostHkd}
                  onChange={(event) => setEditCostHkd(event.target.value)}
                />
              </label>
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
