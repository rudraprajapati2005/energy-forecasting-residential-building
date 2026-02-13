import dynamic from 'next/dynamic';
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

import styles from './HeatmapChart.module.css';
export default function HeatmapChart() {
  return (
    <div className={styles.heatmapChart}>
      <h4 className={styles.title}>Energy Consumption Heatmap</h4>
      <Plot
        data={[
          {
            z: [[]],
            x: [],
            y: [],
            type: 'heatmap',
            colorscale: 'YlGnBu',
          },
        ]}
        layout={{
          autosize: true,
          height: 250,
          margin: { t: 30, r: 10, l: 40, b: 40 },
          xaxis: { title: 'Hour/Day' },
          yaxis: { title: 'Date' },
        }}
        useResizeHandler
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
