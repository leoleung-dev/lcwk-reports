"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./Admin.module.css";

export default function HandlersAdmin() {
  const [handlers, setHandlers] = useState([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    loadHandlers();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("");
    setSaving(true);

    try {
      const response = await fetch("/api/handlers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to add handler.");
      }
      setHandlers((prev) => [...prev, data.handler]);
      setName("");
      setStatus("Handler added.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link className={styles.backLink} href="/commission">
            ← Back to commission
          </Link>
          <h1>Handler List</h1>
          <p>Add handlers for staff to select in the commission report.</p>
        </div>
        <button className={styles.refresh} onClick={loadHandlers}>
          Refresh list
        </button>
      </header>

      <section className={styles.panel}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            Handler name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="New handler"
              required
            />
          </label>
          <button className={styles.primaryButton} disabled={saving}>
            {saving ? "Saving..." : "Add handler"}
          </button>
        </form>
        {status ? <p className={styles.status}>{status}</p> : null}
      </section>

      <section className={styles.list}>
        <h2>Active handlers</h2>
        <div className={styles.listGrid}>
          {handlers.length === 0 ? (
            <p className={styles.empty}>No handlers yet.</p>
          ) : (
            handlers.map((handler) => (
              <div key={handler.id} className={styles.serviceCard}>
                <span>{handler.name}</span>
                <span className={styles.tag}>Active</span>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
