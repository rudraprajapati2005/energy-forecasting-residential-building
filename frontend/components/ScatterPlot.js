import dynamic from 'next/dynamic';
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function ScatterPlot() {
  return (
    <div>
      <h4 className="font-semibold mb-2">Consumption vs Temperature</h4>
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
