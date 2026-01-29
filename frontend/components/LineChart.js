import dynamic from 'next/dynamic';
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function LineChart() {
  return (
    <div>
      <h4 className="font-semibold mb-2">Actual vs Predicted Energy Consumption</h4>
      <Plot
        data={[
          { x: [], y: [], type: 'scatter', mode: 'lines', name: 'Actual', line: { color: '#2563eb' } },
          { x: [], y: [], type: 'scatter', mode: 'lines', name: 'Predicted', line: { color: '#22c55e' } },
        ]}
        layout={{
          autosize: true,
          height: 250,
          margin: { t: 30, r: 10, l: 40, b: 40 },
          xaxis: { title: 'Timestamp' },
          yaxis: { title: 'Meter Reading' },
          legend: { orientation: 'h', y: -0.2 },
        }}
        useResizeHandler
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
