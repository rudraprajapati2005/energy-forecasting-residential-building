import KPISection from './KPISection';
import LineChart from './LineChart';
import BarChart from './BarChart';
import HeatmapChart from './HeatmapChart';
import ScatterPlot from './ScatterPlot';

export default function MainVisualizations() {
  return (
    <div className="space-y-8">
      <KPISection />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card rounded-lg p-4">
          <LineChart />
        </div>
        <div className="card rounded-lg p-4">
          <BarChart />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card rounded-lg p-4">
          <HeatmapChart />
        </div>
        <div className="card rounded-lg p-4">
          <ScatterPlot />
        </div>
      </div>
      <div className="flex justify-end mt-4 space-x-2">
        <button className="px-4 py-2 rounded-lg bg-white/6 text-white hover:scale-105 transition">Export PNG</button>
        <button className="px-4 py-2 rounded-lg bg-white/6 text-white hover:scale-105 transition">Export PDF</button>
      </div>
    </div>
  );
}
