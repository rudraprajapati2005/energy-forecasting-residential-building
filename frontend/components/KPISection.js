export default function KPISection() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="card rounded-lg p-4 flex flex-col">
        <div className="flex items-center justify-between">
          <div className="text-sm muted">Predicted Savings</div>
          <div className="text-2xl font-semibold badge-gradient">--%</div>
        </div>
        <div className="mt-3 text-xs muted">Compared to baseline consumption</div>
      </div>

      <div className="card rounded-lg p-4 flex flex-col">
        <div className="flex items-center justify-between">
          <div className="text-sm muted">Total Energy</div>
          <div className="text-2xl font-semibold">-- kWh</div>
        </div>
        <div className="mt-3 text-xs muted">Period: selected range</div>
      </div>

      <div className="card rounded-lg p-4 flex flex-col">
        <div className="flex items-center justify-between">
          <div className="text-sm muted">Forecast Error</div>
          <div className="text-2xl font-semibold">--</div>
        </div>
        <div className="mt-3 text-xs muted">MAPE / RMSE</div>
      </div>

      <div className="card rounded-lg p-4 flex flex-col">
        <div className="flex items-center justify-between">
          <div className="text-sm muted">Weather Impact</div>
          <div className="text-2xl font-semibold">--</div>
        </div>
        <div className="mt-3 text-xs muted">Sensitivity score</div>
      </div>
    </div>
  );
}
