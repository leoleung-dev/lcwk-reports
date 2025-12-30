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

      <div className={styles.reportSections}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>梁津煥記(禮儀顧問)</h2>
          <div className={styles.cards}>
            <Link className={styles.card} href="/sales">
              <div>
                <h3>營業額 · Annual Sales</h3>
                <p>Enter monthly sales items and export in one click.</p>
              </div>
              <span className={styles.cta}>Open report</span>
            </Link>

            <Link className={styles.card} href="/commission">
              <div>
                <h3>佣金登記 · Master Commission</h3>
                <p>Track commission entries and totals by month.</p>
              </div>
              <span className={styles.cta}>Open report</span>
            </Link>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>梁津煥記</h2>
          <div className={styles.cards}>
            <Link className={styles.card} href="/cerement">
              <div>
                <h3>壽衣紀錄 · Cerement</h3>
                <p>Record month-end totals by location.</p>
              </div>
              <span className={styles.cta}>Open report</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
