import Link from "next/link";
import styles from "./Commission.module.css";

export default function CommissionPage() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <Link className={styles.backLink} href="/">
          ← Reports
        </Link>
        <h1>佣金登記 · Master Commission</h1>
        <p>This report page is next. The sales report is ready now.</p>
        <Link className={styles.cta} href="/sales">
          Go to sales report
        </Link>
      </div>
    </main>
  );
}
