import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  const year = new Date().getFullYear();

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
            <article className={styles.card}>
              <div>
                <h3>營業額 · Annual Sales</h3>
                <p>Enter monthly sales items and export in one click.</p>
              </div>
              <div className={styles.cardActions}>
                <Link className={styles.cardPrimaryButton} href="/sales">
                  Open report
                </Link>
                <div className={styles.cardSecondaryActions}>
                  <Link className={styles.cardButton} href={`/sales/summary/${year}`}>
                    View annual report
                  </Link>
                  <Link
                    className={styles.cardButtonSecondary}
                    href="/sales/summary/overall"
                  >
                    View overall report
                  </Link>
                </div>
              </div>
            </article>

            <article className={styles.card}>
              <div>
                <h3>佣金登記 · Master Commission</h3>
                <p>Track commission entries and totals by month.</p>
              </div>
              <div className={styles.cardActions}>
                <Link className={styles.cardPrimaryButton} href="/commission">
                  Open report
                </Link>
                <div className={styles.cardSecondaryActions}>
                  <Link
                    className={styles.cardButton}
                    href={`/commission/summary/${year}`}
                  >
                    View annual report
                  </Link>
                  <Link
                    className={styles.cardButtonSecondary}
                    href="/commission/summary/overall"
                  >
                    View overall report
                  </Link>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>梁津煥記</h2>
          <div className={styles.cards}>
            <article className={styles.card}>
              <div>
                <h3>壽衣紀錄 · Cerement</h3>
                <p>Record month-end totals by location.</p>
              </div>
              <div className={styles.cardActions}>
                <Link className={styles.cardPrimaryButton} href="/cerement">
                  Open report
                </Link>
                <div className={styles.cardSecondaryActions}>
                  <Link className={styles.cardButton} href={`/cerement/summary/${year}`}>
                    View annual report
                  </Link>
                  <Link
                    className={styles.cardButtonSecondary}
                    href="/cerement/summary/overall"
                  >
                    View overall report
                  </Link>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>香港分店</h2>
          <div className={styles.cards}>
            <article className={styles.card}>
              <div>
                <h3>香港分店營業額 · HK Branch Sales</h3>
                <p>Track annual monthly sales by staff in one table.</p>
              </div>
              <div className={styles.cardActions}>
                <Link className={styles.cardPrimaryButton} href="/hkfh-sales">
                  Open report
                </Link>
                <div className={styles.cardSecondaryActions}>
                  <Link
                    className={styles.cardButton}
                    href={`/hkfh-sales/summary/${year}`}
                  >
                    View annual report
                  </Link>
                  <Link
                    className={styles.cardButtonSecondary}
                    href="/hkfh-sales/summary/overall"
                  >
                    View overall report
                  </Link>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
