import dynamic from 'next/dynamic';
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

import styles from './ScatterPlot.module.css';
export default function ScatterPlot() {
  return (
    <div className={styles.scatterPlot}>
      <h4 className={styles.title}>Consumption vs Temperature</h4>
      <Plot
        data={[
          {
            x: [],
            y: [],
            mode: 'markers',
            type: 'scatter',
            marker: { color: '#2563eb' },
            name: 'Consumption',
          },
        ]}
        layout={{
          autosize: true,
          height: 250,
          margin: { t: 30, r: 10, l: 40, b: 40 },
          xaxis: { title: 'Temperature' },
          yaxis: { title: 'Consumption' },
        }}
        useResizeHandler
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
