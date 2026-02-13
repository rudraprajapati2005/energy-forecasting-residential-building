import styles from './MetadataSidebar.module.css';
export default function MetadataSidebar() {
  return (
    <div className={styles.metadataSidebar}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Building Info</h3>
        <ul className={styles.infoList}>
          <li className={styles.infoItem}>Square Feet: <span className={styles.infoValue}>--</span></li>
          <li className={styles.infoItem}>Year Built: <span className={styles.infoValue}>--</span></li>
          <li className={styles.infoItem}>Primary Use: <span className={styles.infoValue}>--</span></li>
          <li className={styles.infoItem}>Floor Count: <span className={styles.infoValue}>--</span></li>
        </ul>
      </div>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Weather Summary</h3>
        <ul className={styles.infoList}>
          <li className={styles.infoItem}>Avg Temp: <span className={styles.infoValue}>--</span></li>
          <li className={styles.infoItem}>Cloud Coverage: <span className={styles.infoValue}>--</span></li>
          <li className={styles.infoItem}>Wind Speed: <span className={styles.infoValue}>--</span></li>
        </ul>
      </div>
    </div>
  );
}
