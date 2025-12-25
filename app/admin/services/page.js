"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./Admin.module.css";

export default function ServicesAdmin() {
  const [services, setServices] = useState([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState(null);

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

  async function handleRemove(service) {
    if (!service?.id) {
      return;
    }
    const confirmed = window.confirm(`Remove ${service.name}?`);
    if (!confirmed) {
      return;
    }

    setStatus("");
    setRemovingId(service.id);

    try {
      const response = await fetch("/api/services", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: service.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to remove service.");
      }
      setServices((prev) => prev.filter((entry) => entry.id !== service.id));
      setStatus("Service removed.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setRemovingId(null);
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
        {services.length === 0 ? (
          <p className={styles.empty}>No services yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Status</th>
                  <th className={styles.actionsColumn}>Action</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id}>
                    <td>{service.name}</td>
                    <td>
                      <span className={styles.tag}>Active</span>
                    </td>
                    <td className={styles.actionsColumn}>
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => handleRemove(service)}
                        disabled={removingId === service.id}
                      >
                        {removingId === service.id ? "Removing..." : "Remove"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
