import Head from 'next/head';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Head>
        <title>Energy Forecasting · Residential Buildings</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <section className="md:col-span-7">
            <div className="mb-4">
              <h1 className="text-4xl md:text-5xl font-extrabold">Smart Energy Forecasts for Residential Buildings</h1>
              <p className="mt-3 text-lg muted">Predict consumption, reduce waste, and make energy decisions with confidence — visualizations and KPIs built for operators and researchers.</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/dashboard" className="inline-block px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium shadow-lg hover:scale-105 transition">Open Dashboard</a>
              <button className="inline-block px-6 py-3 rounded-lg bg-white/6 text-white font-medium border border-white/6 hover:opacity-90 transition">Upload Data</button>
              <a href="#features" className="inline-block px-4 py-3 rounded-lg text-sm bg-white/4 text-white muted hover:underline">Learn more</a>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="card p-4 rounded-lg">
                <div className="text-sm muted">Accurate Forecasts</div>
                <div className="mt-2 font-semibold text-xl">Hourly, Daily & Monthly</div>
                <div className="mt-2 text-xs muted">Flexible horizons for operations and reporting.</div>
              </div>
              <div className="card p-4 rounded-lg">
                <div className="text-sm muted">Visual Insights</div>
                <div className="mt-2 font-semibold text-xl">Charts & Heatmaps</div>
                <div className="mt-2 text-xs muted">Compare baseline vs forecast with ease.</div>
              </div>
              <div className="card p-4 rounded-lg">
                <div className="text-sm muted">KPI Tracking</div>
                <div className="mt-2 font-semibold text-xl">Automated Metrics</div>
                <div className="mt-2 text-xs muted">MAPE, RMSE and custom indicators.</div>
              </div>
              <div className="card p-4 rounded-lg">
                <div className="text-sm muted">Export & Share</div>
                <div className="mt-2 font-semibold text-xl">PNG / PDF</div>
                <div className="mt-2 text-xs muted">Create reports quickly for stakeholders.</div>
              </div>
            </div>
          </section>

          <aside className="md:col-span-5">
            <div className="card p-6 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm muted">Live Preview</div>
                  <div className="mt-2 font-semibold text-lg">City Residence · Jan 2026</div>
                </div>
                <div className="text-2xl">🏘️</div>
              </div>

              <div className="mt-6">
                <div className="h-44 bg-gradient-to-b from-white/3 to-white/2 rounded-lg flex items-center justify-center muted">Chart preview placeholder</div>
                <div className="mt-4 flex items-center justify-between text-sm muted">
                  <div>Energy: -- kWh</div>
                  <div>Forecast error: --</div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="card p-3 rounded-lg text-center">
                <div className="text-sm muted">Avg Savings</div>
                <div className="font-semibold text-lg mt-2">--%</div>
              </div>
              <div className="card p-3 rounded-lg text-center">
                <div className="text-sm muted">Weather Impact</div>
                <div className="font-semibold text-lg mt-2">--</div>
              </div>
            </div>
          </aside>
        </div>

        <footer className="mt-12 py-8 border-t border-white/6">
          <div className="max-w-7xl mx-auto text-center muted text-sm">© {new Date().getFullYear()} Energy Forecasting — built for research & operations.</div>
        </footer>
      </div>
    </div>
  );
}
