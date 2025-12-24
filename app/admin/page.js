"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import styles from "./AdminIndex.module.css";

export default function AdminIndex() {
  const { data } = useSession();
  const email = data?.user?.email;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link className={styles.backLink} href="/">
            ← Back to reports
          </Link>
          <h1>Admin hub</h1>
          <p>Manage internal catalogs and access controls.</p>
        </div>
        <div className={styles.auth}>
          <div>
            <p className={styles.label}>Signed in</p>
            <p className={styles.email}>{email || "Unknown account"}</p>
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

      <section className={styles.grid}>
        <Link className={styles.card} href="/admin/services">
          <div>
            <h2>Service Catalog</h2>
            <p>Update the services used in sales entries.</p>
          </div>
          <span className={styles.tag}>Sales</span>
        </Link>
        <Link className={styles.card} href="/admin/handlers">
          <div>
            <h2>Handler List</h2>
            <p>Maintain the commission handler roster.</p>
          </div>
          <span className={styles.tag}>Commission</span>
        </Link>
        <Link className={styles.card} href="/admin/access">
          <div>
            <h2>Access List</h2>
            <p>Whitelist Google accounts allowed to sign in.</p>
          </div>
          <span className={styles.tag}>Security</span>
        </Link>
      </section>
    </main>
  );
}
