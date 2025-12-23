"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./Admin.module.css";

export default function ServicesAdmin() {
  const [services, setServices] = useState([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadServices() {
    try {
      const response = await fetch("/api/services");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to load services.");
      }
      setServices(data.services || []);
    } catch (error) {
      setStatus("Unable to load services.");
    }
  }

  useEffect(() => {
    loadServices();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("");
    setSaving(true);

    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to add service.");
      }
      setServices((prev) => [...prev, data.service]);
      setName("");
      setStatus("Service added.");
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
          <Link className={styles.backLink} href="/sales">
            ← Back to sales
          </Link>
          <h1>Service Catalog</h1>
          <p>Add new services for staff to select in the sales report.</p>
        </div>
        <button className={styles.refresh} onClick={loadServices}>
          Refresh list
        </button>
      </header>

      <section className={styles.panel}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            Service name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="New service"
              required
            />
          </label>
          <button className={styles.primaryButton} disabled={saving}>
            {saving ? "Saving..." : "Add service"}
          </button>
        </form>
        {status ? <p className={styles.status}>{status}</p> : null}
      </section>

      <section className={styles.list}>
        <h2>Active services</h2>
        <div className={styles.listGrid}>
          {services.length === 0 ? (
            <p className={styles.empty}>No services yet.</p>
          ) : (
            services.map((service) => (
              <div key={service.id} className={styles.serviceCard}>
                <span>{service.name}</span>
                <span className={styles.tag}>Active</span>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
