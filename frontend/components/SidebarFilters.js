import styles from './SidebarFilters.module.css';
export default function SidebarFilters() {
  return (
    <div className={styles.sidebarFilters}>
      <div>
        <label className={styles.label}>Building ID</label>
        <input type="text" placeholder="Search or select..." className={styles.input} />
      </div>
      <div>
        <label className={styles.label}>Meter Type</label>
        <select className={styles.select}>
          <option>Electricity</option>
          <option>Chilled Water</option>
          <option>Steam</option>
          <option>Hot Water</option>
        </select>
      </div>
      <div>
        <label className={styles.label}>Date Range</label>
        <select className={styles.select}>
          <option>Hourly</option>
          <option>Daily</option>
          <option>Monthly</option>
        </select>
      </div>
      <button className={styles.button}>Apply Filters</button>
    </div>
  );
}
