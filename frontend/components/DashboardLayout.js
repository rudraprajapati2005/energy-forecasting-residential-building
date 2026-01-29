import SidebarFilters from './SidebarFilters';
import MainVisualizations from './MainVisualizations';
import MetadataSidebar from './MetadataSidebar';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full py-4 px-6 border-b border-white/6 bg-gradient-to-r from-transparent to-transparent">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-lg bg-white/6 flex items-center justify-center text-lg">🏠</div>
            <div>
              <h1 className="text-lg font-semibold">Energy Forecasting</h1>
              <p className="text-sm muted">Residential Building Insights</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:block">
              <input placeholder="Search buildings, meters..." className="px-3 py-2 rounded-lg bg-white/4 border border-white/6 placeholder:muted text-sm" />
            </div>
            <div className="w-10 h-10 rounded-full bg-white/6 flex items-center justify-center">👤</div>
          </div>
        </div>
      </header>

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-12 gap-6">
          <aside className="md:col-span-3 col-span-1 card p-5 rounded-lg">
            <SidebarFilters />
          </aside>

          <main className="md:col-span-6 col-span-1">
            <div className="card p-6 rounded-lg">
              <MainVisualizations />
            </div>
          </main>

          <aside className="md:col-span-3 col-span-1 card p-5 rounded-lg">
            <MetadataSidebar />
          </aside>
        </div>
      </div>
    </div>
  );
}
