import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.kicker}>LCWK Company Reports</p>
        <h1>Annual reporting, organized and ready to export.</h1>
        <p className={styles.subtitle}>
          Track monthly activity for each report type, then export clean Excel
          files on demand.
        </p>
      </header>

      <section className={styles.cards}>
        <Link className={styles.card} href="/sales">
          <div>
            <h2>營業額 · Annual Sales</h2>
            <p>Enter monthly sales items and export in one click.</p>
          </div>
          <span className={styles.cta}>Open report</span>
        </Link>

        <div className={`${styles.card} ${styles.cardMuted}`}>
          <div>
            <h2>佣金登記 · Master Commission</h2>
            <p>Coming next. We will add this report after sales.</p>
          </div>
          <span className={styles.ctaMuted}>In progress</span>
        </div>
      </section>
    </main>
  );
}
