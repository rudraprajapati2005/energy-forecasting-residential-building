import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });
import styles from './LineChart.module.css';

export default function DailyPredictions() {
  const [hourly, setHourly] = useState([]);
  const [daily, setDaily] = useState([]);
  const [modelName, setModelName] = useState('');
  const [total, setTotal] = useState(null);
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
          const first = json.results[0];
          setModelName(first.model_name || 'model');
          setTotal(first.predicted_total_two_months ?? null);

          // hourly_predictions may be provided by backend
          if (first.hourly_predictions && first.hourly_predictions.length > 0) {
            const h = first.hourly_predictions.map(p => ({ t: p.timestamp, v: p.value }));
            setHourly(h);
            // derive daily from hourly
            const map = {};
            h.forEach(({ t, v }) => {
              const d = (new Date(t)).toISOString().slice(0,10);
              map[d] = (map[d] || 0) + v;
            });
            const dArr = Object.keys(map).sort().map(k => ({ date: k, value: map[k] }));
            setDaily(dArr);
          } else if (first.daily_predictions && first.daily_predictions.length > 0) {
            setDaily(first.daily_predictions.map(p => ({ date: p.date, value: p.value })));
            // create hourly placeholder by spreading daily evenly across 24 hours
            const h = [];
            first.daily_predictions.forEach(p => {
              const per = (p.value || 0) / 24;
              for (let hr = 0; hr < 24; hr++) {
                const ts = new Date(p.date + 'T' + String(hr).padStart(2,'0') + ':00:00').toISOString();
                h.push({ t: ts, v: per });
              }
            });
            setHourly(h);
          } else {
            // fallback: distribute total across days between start_date and end_date
            const start = json.start_date;
            const end = json.end_date;
            const totalVal = first.predicted_total_two_months || 0;
            if (start && end) {
              const s = new Date(start);
              const e = new Date(end);
              const days = Math.round((e - s) / (1000*60*60*24)) + 1;
              const perDay = days > 0 ? totalVal / days : 0;
              const dArr = [];
              const hArr = [];
              for (let d = new Date(s); d <= e; d.setDate(d.getDate()+1)) {
                const dateStr = new Date(d).toISOString().slice(0,10);
                dArr.push({ date: dateStr, value: perDay });
                for (let hr=0; hr<24; hr++) {
                  const ts = new Date(dateStr + 'T' + String(hr).padStart(2,'0') + ':00:00').toISOString();
                  hArr.push({ t: ts, v: perDay/24 });
                }
              }
              setDaily(dArr);
              setHourly(hArr);
            }
          }
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
              data={view === 'hourly' ? [ { x: hourlyX, y: hourlyY, type: 'scatter', mode: 'lines', name: 'Hourly', line: { color: '#2563eb' } } ]
                                         : [ { x: dailyX, y: dailyY, type: 'bar', name: 'Daily', marker: { color: '#2563eb' } } ]}
              layout={{
                autosize: true,
                height: view === 'hourly' ? 520 : 420,
                margin: { t: 40, r: 10, l: 50, b: 110 },
                xaxis: { title: view === 'hourly' ? 'Timestamp' : 'Date', tickangle: view === 'daily' ? -45 : -30, type: 'date' },
                yaxis: { title: 'Consumption (kWh)' },
                title: modelName ? `${modelName} — ${view === 'hourly' ? 'Hourly' : 'Daily'} Predictions` : 'Predictions'
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
