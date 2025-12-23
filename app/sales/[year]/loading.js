import styles from "../Sales.module.css";

export default function Loading() {
  return (
    <div className={styles.loadingScreen}>
      <div className={styles.spinner} aria-hidden />
      <span>Loading sales report...</span>
    </div>
  );
}
