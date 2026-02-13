import KPISection from './KPISection';
import LineChart from './LineChart';
import BarChart from './BarChart';
import HeatmapChart from './HeatmapChart';
import ScatterPlot from './ScatterPlot';
import styles from './MainVisualizations.module.css';
export default function MainVisualizations() {

  return (
    <div className={styles.mainVisualizations}>
      <div className={styles.kpiSection}><KPISection /></div>
      <div className={styles.grid2}>
        <div className={styles.card}><LineChart /></div>
        <div className={styles.card}><BarChart /></div>
      </div>
      <div className={styles.grid2}>
        <div className={styles.card}><HeatmapChart /></div>
        <div className={styles.card}><ScatterPlot /></div>
      </div>
      <div className={styles.buttonRow}>
        <button className={styles.exportButton}>Export PNG</button>
        <button className={styles.exportButton}>Export PDF</button>
      </div>
    </div>
  );
}
