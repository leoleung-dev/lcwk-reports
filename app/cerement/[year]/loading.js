import styles from "../Cerement.module.css";

export default function Loading() {
  return (
    <div className={styles.loadingScreen}>
      <div className={styles.spinner} aria-hidden />
      <span>Loading cerement report...</span>
    </div>
  );
}
