import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });
import styles from './LineChart.module.css';

export default function DailyPredictions({ forecast }) {
  const [hourly, setHourly] = useState([]);
  const [daily, setDaily] = useState([]);
  const [modelName, setModelName] = useState('');
  const [total, setTotal] = useState(null);
  const [modelsData, setModelsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('daily'); // 'daily' | 'hourly'
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(0);
  useEffect(() => {
    let mounted = true;

    function processForecast(json) {
      if (!mounted) return;
      // clear previous error when new forecast arrives
      setError(null);
      try {
        if (json.results && json.results.length > 0) {
          const models = json.results.map(res => {
            const name = res.model_name || 'model';
            const totalVal = res.predicted_total_two_months ?? null;
            const ratio = (typeof res.ratio_vs_given !== 'undefined' && res.ratio_vs_given !== null) ? Number(res.ratio_vs_given) : null;
            let dailyArr = [];
            let hourlyArr = [];
            // Prefer hourly predictions when available (preserves variance). Fall back to daily when only daily provided.
            if (res.hourly_predictions && res.hourly_predictions.length > 0) {
              hourlyArr = res.hourly_predictions.map(p => ({ t: p.timestamp, v: p.value }));
              const map = {};
              hourlyArr.forEach(({ t, v }) => {
                const d = (new Date(t)).toISOString().slice(0,10);
                map[d] = (map[d] || 0) + v;
              });
              dailyArr = Object.keys(map).sort().map(k => ({ date: k, value: map[k] }));
            } else if (res.daily_predictions && res.daily_predictions.length > 0) {
              // if only daily values available, distribute evenly into 24 hourly slots
              dailyArr = res.daily_predictions.map(p => ({ date: p.date, value: p.value }));
              res.daily_predictions.forEach(p => {
                const per = (p.value || 0) / 24;
                for (let hr = 0; hr < 24; hr++) {
                  const ts = new Date(p.date + 'T' + String(hr).padStart(2,'0') + ':00:00').toISOString();
                  hourlyArr.push({ t: ts, v: per });
                }
              });
            } else {
              const start = json.start_date;
              const end = json.end_date;
              if (start && end && totalVal !== null) {
                const s = new Date(start);
                const e = new Date(end);
                const days = Math.round((e - s) / (1000*60*60*24)) + 1;
                const perDay = days > 0 ? totalVal / days : 0;
                for (let d = new Date(s); d <= e; d.setDate(d.getDate()+1)) {
                  const dateStr = new Date(d).toISOString().slice(0,10);
                  dailyArr.push({ date: dateStr, value: perDay });
                  for (let hr=0; hr<24; hr++) {
                    const ts = new Date(dateStr + 'T' + String(hr).padStart(2,'0') + ':00:00').toISOString();
                    hourlyArr.push({ t: ts, v: perDay/24 });
                  }
                }
              }
            }
            // compute adjusted series (divide by ratio) if ratio available
            let dailyAdj = [];
            let hourlyAdj = [];
            if (ratio && ratio !== 0) {
              dailyAdj = dailyArr.map(d => ({ date: d.date, value: (d.value || 0) / ratio }));
              hourlyAdj = hourlyArr.map(h => ({ t: h.t, v: (h.v || 0) / ratio }));
            }
            const displayTotal = (totalVal !== null && ratio && ratio !== 0) ? (totalVal / ratio) : totalVal;
            return { name, total: totalVal, ratio, daily: dailyArr, hourly: hourlyArr, daily_adj: dailyAdj, hourly_adj: hourlyAdj, display_total: displayTotal };
          });

          const first = models[0];
          setModelName(first.name || 'model');
          setTotal(first.total ?? null);
          setDaily(first.daily);
          setHourly(first.hourly);
          setModelsData(models);
        }
      } catch (err) {
        setError(err.toString());
      }
    }

    async function fetchPredictions() {
      setError(null);
      setLoading(true);
      try {
        const resp = await fetch('http://localhost:8000/forecast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        const json = await resp.json();
        processForecast(json);
      } catch (err) {
        setError(err.toString());
      } finally {
        setLoading(false);
      }
    }

    // If parent passed a forecast object (from Use Inputs), use it; otherwise fetch on mount
    if (forecast) {
      setError(null);
      processForecast(forecast);
      setLoading(false);
    } else {
      fetchPredictions();
    }

    return () => { mounted = false; };
  }, [forecast]);

  const hourlyX = hourly.map(h => h.t);
  const hourlyY = hourly.map(h => h.v);
  const dailyX = daily.map(d => d.date);
  const dailyY = daily.map(d => d.value);

  const formatNumber = (n, decimals = 6) => {
    if (n === null || typeof n === 'undefined' || Number.isNaN(Number(n))) return '—';
    const s = Number(n).toFixed(decimals);
    return s.replace(/\.?0+$/, '');
  };

  // enforce a minimum display start date (remove earlier points)
  const FLOOR_START_ISO = '2025-12-01T00:00:00Z';
  const FLOOR_START_TS = new Date(FLOOR_START_ISO).getTime();

  // Build plot data for multiple models
  const plotData = (() => {
    if (view === 'hourly') {
      if (modelsData && modelsData.length > 0) {
        const colors = ['#2563eb','#f97316','#10b981','#ef4444'];
        // build filtered traces (explicitly compute filtered arrays so UI can report counts)
        return modelsData.map((m, i) => {
          // get full arrays and drop any timestamps earlier than FLOOR_START_ISO
          const fullX_unfiltered = (m.hourly_adj && m.hourly_adj.length > 0) ? m.hourly_adj.map(h => h.t) : m.hourly.map(h => h.t);
          const fullY_unfiltered = (m.hourly_adj && m.hourly_adj.length > 0) ? m.hourly_adj.map(h => h.v) : m.hourly.map(h => h.v);
          const fullX = [];
          const fullY = [];
          for (let k = 0; k < fullX_unfiltered.length; k++) {
            const ts = new Date(fullX_unfiltered[k]).getTime();
            if (isNaN(ts)) continue;
            if (ts < FLOOR_START_TS) continue;
            fullX.push(fullX_unfiltered[k]);
            fullY.push(fullY_unfiltered[k]);
          }
          let x = fullX;
          let y = fullY;
          if (weeks && weeks.length > 0 && typeof selectedWeek === 'number') {
            const wk = weeks[selectedWeek];
            if (wk) {
              const s = new Date(wk.start).getTime();
              const e = new Date(wk.end).getTime();
              const filtX = [];
              const filtY = [];
              for (let idx = 0; idx < fullX.length; idx++) {
                const t = new Date(fullX[idx]).getTime();
                if (t >= s && t <= e) {
                  filtX.push(fullX[idx]);
                  filtY.push(fullY[idx]);
                }
              }
              x = filtX;
              y = filtY;
            }
          }
          return { x, y, type: 'scatter', mode: 'lines+markers', name: m.name, line: { color: colors[i % colors.length] }, marker: { size: 4 } };
        });
      }
      return [ { x: hourlyX, y: hourlyY, type: 'scatter', mode: 'lines+markers', name: 'Hourly', line: { color: '#2563eb' }, marker: { size: 3 } } ];
    }
    // daily view: group bars for each model across the union of dates
    if (modelsData && modelsData.length > 0) {
      // union of dates
      const allDates = Array.from(new Set(modelsData.flatMap(m => m.daily.map(d => d.date)))).sort();
      const colors = ['#2563eb','#f97316','#10b981','#ef4444'];
      // show only adjusted daily traces if available, otherwise base
      return modelsData.map((m, i) => {
        const baseMap = Object.fromEntries(m.daily.map(d => [d.date, d.value]));
        const baseY = allDates.map(d => baseMap[d] ?? 0);
        let y;
        if (m.daily_adj && m.daily_adj.length > 0) {
          const adjMap = Object.fromEntries(m.daily_adj.map(d => [d.date, d.value]));
          y = allDates.map(d => adjMap[d] ?? 0);
        } else {
          y = baseY;
        }
        return { x: allDates, y, type: 'scatter', mode: 'lines+markers', name: m.name, line: { color: colors[i % colors.length], width: 2 }, marker: { size: 6 } };
      });
    }
    return [ { x: dailyX, y: dailyY, type: 'scatter', mode: 'lines+markers', name: 'Daily', line: { color: '#2563eb', width: 1.5 }, marker: { size: 4 } } ];
  })();

  // compute week ranges whenever hourly data or modelsData updates
  useEffect(() => {
    // gather all hourly timestamps from modelsData or fallback
    let allT = [];
    if (modelsData && modelsData.length > 0) {
      modelsData.forEach(m => {
        const arr = (m.hourly_adj && m.hourly_adj.length > 0) ? m.hourly_adj.map(h => h.t) : m.hourly.map(h => h.t);
        if (arr && arr.length > 0) allT = allT.concat(arr);
      });
    }
    if (allT.length === 0 && hourlyX && hourlyX.length > 0) allT = allT.concat(hourlyX);
    if (allT.length === 0) {
      setWeeks([]);
      return;
    }
    const dates = allT.map(t => new Date(t));
    const minD = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxD = new Date(Math.max(...dates.map(d => d.getTime())));
    // normalize minD to start of day
    minD.setHours(0,0,0,0);
    // enforce floor at 2025-12-01
    const floor = new Date(FLOOR_START_ISO);
    if (minD.getTime() < floor.getTime()) minD.setTime(floor.getTime());
    // build week ranges (7-day windows) from minD, cap to 8 weeks for two-month data
    const w = [];
    let cursor = new Date(minD);
    let idx = 0;
    while (cursor.getTime() <= maxD.getTime() && idx < 8) {
      const start = new Date(cursor);
      const end = new Date(start.getTime() + (7 * 24 * 60 * 60 * 1000) - 1);
      // determine if this week has any timestamps
      const has = dates.some(d => d.getTime() >= start.getTime() && d.getTime() <= end.getTime());
      w.push({ start: start.toISOString(), end: end.toISOString(), label: `Week ${idx+1}`, hasData: has });
      cursor = new Date(end.getTime() + 1);
      idx += 1;
    }
    setWeeks(w);
    // preserve existing selection when possible; otherwise pick first week that has data
    setSelectedWeek(prev => {
      if (typeof prev === 'number' && prev >= 0 && prev < w.length && w[prev] && w[prev].hasData) return prev;
      const firstWithData = w.findIndex(x => x.hasData);
      return firstWithData >= 0 ? firstWithData : 0;
    });
  }, [modelsData, hourlyX]);

  return (
    <div className={styles.lineChart} style={{minHeight: 420}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        {/* Per-model adjusted totals (total divided by ratio when available) */}
        {modelsData && modelsData.length > 0 && (
          <div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:8}}>
            {modelsData.map((m, i) => {
              const adj = (m.total !== null && m.ratio && m.ratio !== 0) ? (m.total / m.ratio) : m.total;
              return (
                <div key={i} style={{fontSize:12,background:'#fff',padding:'6px 8px',borderRadius:6,border:'1px solid rgba(0,0,0,0.06)',color:'#111'}}>
                  <div style={{fontSize:11,color:'#666'}}>{m.name}</div>
                  <div style={{fontWeight:700}}>{adj !== null ? formatNumber(adj,6) + ' kWh' : '—'}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{marginTop:8, marginBottom:8}}>
        <button onClick={() => setView('daily')} style={{marginRight:8, padding:'6px 10px'}} disabled={view==='daily'}>Daily</button>
        <button onClick={() => setView('hourly')} style={{padding:'6px 10px'}} disabled={view==='hourly'}>Hourly</button>
      </div>

      {/* Week selector shown only in hourly view */}
      {view === 'hourly' && weeks && weeks.length > 0 && (
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}}>
          {weeks.map((w, i) => (
            <button
              key={i}
              onClick={() => w.hasData && setSelectedWeek(i)}
              disabled={!w.hasData}
              style={{
                padding:'6px 10px',
                background: i===selectedWeek ? '#2563eb' : '#fff',
                color: i===selectedWeek ? '#fff' : (w.hasData ? '#000' : '#999'),
                border: '1px solid #ddd',
                cursor: w.hasData ? 'pointer' : 'not-allowed',
                opacity: w.hasData ? 1 : 0.6
              }}
            >
              {w.label}
            </button>
          ))}
        </div>
      )}

      {/* Selected week info */}
      {view === 'hourly' && weeks && weeks.length > 0 && (
        <div style={{fontSize:12,color:'#666',marginBottom:8}}>
          {weeks[selectedWeek]
            ? `${weeks[selectedWeek].label}: ${new Date(weeks[selectedWeek].start).toLocaleDateString()} — ${new Date(weeks[selectedWeek].end).toLocaleDateString()}`
            : 'No week selected'}
        </div>
      )}

      {loading && <div>Loading predictions…</div>}
      {error && <div style={{color:'red'}}>Error: {error}</div>}

      {!loading && !error && (
        (() => {
          const hasHourly = (modelsData && modelsData.some(m => m.hourly && m.hourly.length > 0)) || (hourlyX.length > 0 && hourlyY.length > 0);
          const hasDaily = (modelsData && modelsData.some(m => m.daily && m.daily.length > 0)) || (dailyX.length > 0 && dailyY.length > 0);
          if (!hasHourly && !hasDaily) {
            return <div style={{color:'#666', padding:16}}>No prediction data returned from the backend. Check the API response in console.</div>;
          }
          return (
            <Plot
              data={plotData}
              layout={{
                autosize: true,
                height: view === 'hourly' ? 520 : 420,
                margin: { t: 40, r: 10, l: 50, b: 110 },
                xaxis: { title: view === 'hourly' ? 'Timestamp' : 'Date', tickangle: view === 'daily' ? -45 : -30, type: 'date' },
                yaxis: { title: 'Consumption (kWh)' },
                // use lines for daily view
                title: modelName && modelsData && modelsData.length === 1 ? `${modelName} — ${view === 'hourly' ? 'Hourly' : 'Daily'} Predictions` : 'Predictions',
                legend: {
                  orientation: 'v',
                  x: 0.98,
                  y: 0.98,
                  xanchor: 'right',
                  yanchor: 'top',
                  bgcolor: 'rgba(255,255,255,0.6)',
                  borderwidth: 0,
                  font: { size: 11 },
                }
              }}
              config={{ responsive: true }}
              useResizeHandler
              style={{ width: '100%', height: view === 'hourly' ? 520 : 420, display: 'block' }}
            />
          );
        })()
      )}
    </div>
  );
}
