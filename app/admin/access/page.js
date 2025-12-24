"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import styles from "./AdminAccess.module.css";

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

export default function AccessAdmin() {
  const { data } = useSession();
  const signedInEmail = data?.user?.email || "";
  const [emails, setEmails] = useState([]);
  const [emailInput, setEmailInput] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activity, setActivity] = useState([]);
  const [activityStatus, setActivityStatus] = useState("");
  const [activityLoading, setActivityLoading] = useState(false);

  async function loadEmails() {
    setLoading(true);
    setStatus("");
    try {
      const response = await fetch("/api/access");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to load access list.");
      }
      setEmails(data.emails || []);
    } catch (error) {
      setStatus(error.message || "Unable to load access list.");
    } finally {
      setLoading(false);
    }
  }

  async function loadActivity() {
    setActivityLoading(true);
    setActivityStatus("");
    try {
      const response = await fetch("/api/auth-audit?limit=50");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to load activity.");
      }
      setActivity(data.attempts || []);
    } catch (error) {
      setActivityStatus(error.message || "Unable to load activity.");
    } finally {
      setActivityLoading(false);
    }
  }

  useEffect(() => {
    loadEmails();
    loadActivity();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("");
    setSaving(true);

    try {
      const response = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to add email.");
      }
      setEmails((prev) => {
        const existing = prev.find((entry) => entry.email === data.entry.email);
        if (existing) {
          return prev.map((entry) =>
            entry.email === data.entry.email ? data.entry : entry
          );
        }
        return [data.entry, ...prev];
      });
      setEmailInput("");
      setStatus("Email added to the allowlist.");
    } catch (error) {
      setStatus(error.message || "Unable to add email.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(targetEmail) {
    setStatus("");
    try {
      const response = await fetch("/api/access", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to remove email.");
      }
      setEmails((prev) => prev.filter((entry) => entry.email !== targetEmail));
      setStatus("Email removed from the allowlist.");
    } catch (error) {
      setStatus(error.message || "Unable to remove email.");
    }
  }

  const emailCount = emails.length;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link className={styles.backLink} href="/admin">
            ← Back to admin hub
          </Link>
          <h1>Access control</h1>
          <p>Whitelist Google accounts allowed to sign in.</p>
        </div>
        <div className={styles.auth}>
          <div>
            <p className={styles.label}>Signed in</p>
            <p className={styles.email}>{signedInEmail || "Unknown account"}</p>
          </div>
          <button
            className={styles.signOut}
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            Sign out
          </button>
        </div>
      </header>

      <section className={styles.panel}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            Google account email
            <input
              type="email"
              value={emailInput}
              onChange={(event) => setEmailInput(event.target.value)}
              placeholder="name@company.com"
              required
            />
          </label>
          <button className={styles.primaryButton} disabled={saving}>
            {saving ? "Saving..." : "Add to allowlist"}
          </button>
        </form>
        {status ? <p className={styles.status}>{status}</p> : null}
      </section>

      <section className={styles.list}>
        <div className={styles.listHeader}>
          <h2>Allowed accounts</h2>
          <button
            className={styles.refresh}
            type="button"
            onClick={loadEmails}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh list"}
          </button>
        </div>
        {emailCount === 0 ? (
          <p className={styles.empty}>No accounts have been added yet.</p>
        ) : (
          <div className={styles.listGrid}>
            {emails.map((entry) => {
              const metaText =
                entry.source === "env"
                  ? "Managed by environment variables"
                  : `Added ${formatDate(entry.createdAt)}${
                      entry.addedBy ? ` by ${entry.addedBy}` : ""
                    }`;

              return (
                <div key={entry.id || entry.email} className={styles.emailCard}>
                  <div>
                    <p className={styles.emailText}>{entry.email}</p>
                    <p className={styles.meta}>{metaText}</p>
                  </div>
                  <div className={styles.actions}>
                    {entry.source === "env" ? (
                      <span className={styles.tag}>Env</span>
                    ) : (
                      <button
                        className={styles.remove}
                        type="button"
                        onClick={() => handleRemove(entry.email)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className={styles.activity}>
        <div className={styles.listHeader}>
          <h2>Login activity</h2>
          <button
            className={styles.refresh}
            type="button"
            onClick={loadActivity}
            disabled={activityLoading}
          >
            {activityLoading ? "Refreshing..." : "Refresh activity"}
          </button>
        </div>
        {activityStatus ? (
          <p className={styles.status}>{activityStatus}</p>
        ) : null}
        {activity.length === 0 ? (
          <p className={styles.empty}>No login activity yet.</p>
        ) : (
          <div className={styles.activityList}>
            {activity.map((entry) => {
              const statusLabel =
                entry.status === "allowed" ? "Allowed" : "Denied";
              const statusClass =
                entry.status === "allowed"
                  ? styles.statusAllowed
                  : styles.statusDenied;
              const meta = [
                formatDateTime(entry.createdAt),
                entry.provider || "google",
                entry.reason || "",
              ]
                .filter(Boolean)
                .join(" | ");

              return (
                <div key={entry.id} className={styles.activityRow}>
                  <div>
                    <p className={styles.emailText}>
                      {entry.email || "Unknown email"}
                    </p>
                    <p className={styles.meta}>{meta}</p>
                  </div>
                  <span className={statusClass}>{statusLabel}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
