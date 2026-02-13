import styles from './KPISection.module.css';
export default function KPISection() {
  return (
    <div className={styles.kpiGrid}>
      <div className={styles.kpiCard}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div className={styles.kpiTitle}>Predicted Savings</div>
          <div className={styles.kpiBadge}>--%</div>
        </div>
        <div className={styles.kpiDesc}>Compared to baseline consumption</div>
      </div>
      <div className={styles.kpiCard}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div className={styles.kpiTitle}>Total Energy</div>
          <div className={styles.kpiValue}>-- kWh</div>
        </div>
        <div className={styles.kpiDesc}>Period: selected range</div>
      </div>
      <div className={styles.kpiCard}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div className={styles.kpiTitle}>Forecast Error</div>
          <div className={styles.kpiValue}>--</div>
        </div>
        <div className={styles.kpiDesc}>MAPE / RMSE</div>
      </div>
      <div className={styles.kpiCard}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div className={styles.kpiTitle}>Weather Impact</div>
          <div className={styles.kpiValue}>--</div>
        </div>
        <div className={styles.kpiDesc}>Sensitivity score</div>
      </div>
    </div>
  );
}
