import SidebarFilters from './SidebarFilters';
import MainVisualizations from './MainVisualizations';
import dynamic from 'next/dynamic';
import styles from './DashboardLayout.module.css';
const FlexibleMapSearch = dynamic(() => import('./FlexibleMapSearch'), { ssr: false });

export default function  DashboardLayout() {
  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            <div className={styles.logoBox}>🏠</div>
            <div>
              <h1 className={styles.title}>Energy Forecasting</h1>
              <p className={styles.subtitle}>Residential Building Insights</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <div>
              <input placeholder="Search buildings, meters..." className={styles.searchInput} />
            </div>
            <div className={styles.avatar}>👤</div>
          </div>
        </div>
      </header>

      <div className={styles.flexMain}>
        <div className={styles.innerFlex}>
          {/* Left Sidebar: 20% */}
          <aside className={styles.sidebar}>
            <SidebarFilters />
            {/* Add features, buttons, links below */}
            <button className={styles.sidebarButton}>Feature 1</button>
            <button className={`${styles.sidebarButton} ${styles.sidebarButtonAlt}`}>Feature 2</button>
            <a href="/dashboard" className={styles.sidebarLink}>Go to Dashboard</a>
            <a href="/" className={styles.sidebarLink}>Home</a>
          </aside>

          {/* Right Main: 80% */}
          <main className={styles.mainContent}>
            {/* Map visualization */}
            <div className={styles.mapBox}>
              <FlexibleMapSearch />
            </div>
            {/* Other visualizations */}
            <MainVisualizations />
          </main>
        </div>
      </div>
    </div>
  );
}
