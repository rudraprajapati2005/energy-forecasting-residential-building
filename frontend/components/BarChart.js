import dynamic from 'next/dynamic';
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function BarChart() {
  return (
    <div>
      <h4 className="font-semibold mb-2">Modeled vs Actual Consumption (Retrofit Savings)</h4>
      <Plot
        data={[
          { x: [], y: [], type: 'bar', name: 'Modeled', marker: { color: '#2563eb' } },
          { x: [], y: [], type: 'bar', name: 'Actual', marker: { color: '#22c55e' } },
        ]}
        layout={{
          barmode: 'group',
          autosize: true,
          height: 250,
          margin: { t: 30, r: 10, l: 40, b: 40 },
          xaxis: { title: 'Period' },
          yaxis: { title: 'Consumption' },
          legend: { orientation: 'h', y: -0.2 },
        }}
        useResizeHandler
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
