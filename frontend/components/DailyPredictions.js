import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });
import styles from './LineChart.module.css';

export default function DailyPredictions() {
  const [hourly, setHourly] = useState([]);
  const [daily, setDaily] = useState([]);
  const [modelName, setModelName] = useState('');
  const [total, setTotal] = useState(null);
  const [modelsData, setModelsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('daily'); // 'daily' | 'hourly'

  useEffect(() => {
    let mounted = true;
    async function fetchPredictions() {
      try {
        const resp = await fetch('http://localhost:8000/forecast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        const json = await resp.json();
        if (!mounted) return;
        if (json.results && json.results.length > 0) {
          // aggregate per-model daily/hourly data
          const models = json.results.map(res => {
            const name = res.model_name || 'model';
            const totalVal = res.predicted_total_two_months ?? null;
            let dailyArr = [];
            let hourlyArr = [];
            if (res.daily_predictions && res.daily_predictions.length > 0) {
              dailyArr = res.daily_predictions.map(p => ({ date: p.date, value: p.value }));
              // create hourly placeholder by spreading daily evenly across 24 hours
              res.daily_predictions.forEach(p => {
                const per = (p.value || 0) / 24;
                for (let hr = 0; hr < 24; hr++) {
                  const ts = new Date(p.date + 'T' + String(hr).padStart(2,'0') + ':00:00').toISOString();
                  hourlyArr.push({ t: ts, v: per });
                }
              });
            } else if (res.hourly_predictions && res.hourly_predictions.length > 0) {
              hourlyArr = res.hourly_predictions.map(p => ({ t: p.timestamp, v: p.value }));
              const map = {};
              hourlyArr.forEach(({ t, v }) => {
                const d = (new Date(t)).toISOString().slice(0,10);
                map[d] = (map[d] || 0) + v;
              });
              dailyArr = Object.keys(map).sort().map(k => ({ date: k, value: map[k] }));
            } else {
              // fallback distribution across start/end
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
            return { name, total: totalVal, daily: dailyArr, hourly: hourlyArr };
          });

          // populate first model's summary for header (keeps backward compatibility)
          const first = models[0];
          setModelName(first.name || 'model');
          setTotal(first.total ?? null);
          setDaily(first.daily);
          setHourly(first.hourly);
          setModelsData(models);
        }
      } catch (err) {
        setError(err.toString());
      } finally {
        setLoading(false);
      }
    }
    fetchPredictions();
    return () => { mounted = false; };
  }, []);

  const hourlyX = hourly.map(h => h.t);
  const hourlyY = hourly.map(h => h.v);
  const dailyX = daily.map(d => d.date);
  const dailyY = daily.map(d => d.value);

  // Build plot data for multiple models
  const plotData = (() => {
    if (view === 'hourly') {
      if (modelsData && modelsData.length > 0) {
        const colors = ['#2563eb','#f97316','#10b981','#ef4444'];
        return modelsData.map((m, i) => ({ x: m.hourly.map(h => h.t), y: m.hourly.map(h => h.v), type: 'scatter', mode: 'lines', name: m.name, line: { color: colors[i % colors.length] } }));
      }
      return [ { x: hourlyX, y: hourlyY, type: 'scatter', mode: 'lines', name: 'Hourly', line: { color: '#2563eb' } } ];
    }
    // daily view: group bars for each model across the union of dates
    if (modelsData && modelsData.length > 0) {
      // union of dates
      const allDates = Array.from(new Set(modelsData.flatMap(m => m.daily.map(d => d.date)))).sort();
      const colors = ['#2563eb','#f97316','#10b981','#ef4444'];
      return modelsData.map((m, i) => {
        const map = Object.fromEntries(m.daily.map(d => [d.date, d.value]));
        const y = allDates.map(d => map[d] ?? 0);
        return { x: allDates, y, type: 'bar', name: m.name, marker: { color: colors[i % colors.length] } };
      });
    }
    return [ { x: dailyX, y: dailyY, type: 'bar', name: 'Daily', marker: { color: '#2563eb' } } ];
  })();

  return (
    <div className={styles.lineChart} style={{minHeight: 420}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h4 className={styles.title}>Predicted Energy</h4>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <div style={{fontSize:12,color:'#666'}}>Total (2 months):</div>
          <div style={{fontWeight:700}}>{total !== null ? (Math.round(total*100)/100) + ' kWh' : '—'}</div>
        </div>
      </div>

      <div style={{marginTop:8, marginBottom:8}}>
        <button onClick={() => setView('daily')} style={{marginRight:8, padding:'6px 10px'}} disabled={view==='daily'}>Daily</button>
        <button onClick={() => setView('hourly')} style={{padding:'6px 10px'}} disabled={view==='hourly'}>Hourly</button>
      </div>

      {loading && <div>Loading predictions…</div>}
      {error && <div style={{color:'red'}}>Error: {error}</div>}

      {!loading && !error && (
        (() => {
          const hasHourly = hourlyX.length > 0 && hourlyY.length > 0;
          const hasDaily = dailyX.length > 0 && dailyY.length > 0;
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
                barmode: view === 'daily' ? 'group' : undefined,
                title: modelName && modelsData && modelsData.length === 1 ? `${modelName} — ${view === 'hourly' ? 'Hourly' : 'Daily'} Predictions` : 'Predictions'
              }}
              useResizeHandler
              style={{ width: '100%', height: view === 'hourly' ? 520 : 420 }}
            />
          );
        })()
      )}
    </div>
  );
}
