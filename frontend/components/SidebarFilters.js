export default function SidebarFilters() {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium muted mb-2">Building ID</label>
        <input type="text" placeholder="Search or select..." className="w-full bg-white/4 border border-white/6 rounded-lg px-3 py-2 placeholder:muted" />
      </div>
      <div>
        <label className="block text-sm font-medium muted mb-2">Meter Type</label>
        <select className="w-full bg-white/4 border border-white/6 rounded-lg px-3 py-2">
          <option>Electricity</option>
          <option>Chilled Water</option>
          <option>Steam</option>
          <option>Hot Water</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium muted mb-2">Date Range</label>
        <select className="w-full bg-white/4 border border-white/6 rounded-lg px-3 py-2">
          <option>Hourly</option>
          <option>Daily</option>
          <option>Monthly</option>
        </select>
      </div>

      <div className="mt-4">
        <button className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium">Apply Filters</button>
      </div>
    </div>
  );
}
