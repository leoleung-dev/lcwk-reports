import { Suspense } from "react";
import styles from "./Login.module.css";
import LoginClient from "./login-client";

function LoginFallback() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.kicker}>LCWK Reports</p>
        <h1>Sign in to continue</h1>
        <p className={styles.subtitle}>
          Use your approved Google account to access internal reports.
        </p>
        <div className={styles.primaryButton} aria-hidden="true">
          Sign in with Google
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginClient />
    </Suspense>
  );
}
