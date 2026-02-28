import Head from 'next/head';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const FlexibleMapSearch = dynamic(() => import('../components/FlexibleMapSearch'), { ssr: false });

export default function Home() {
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState(null);
  const [area, setArea] = useState('');
  const [floor, setFloor] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [prevUsage, setPrevUsage] = useState('');
  const [prevMonth1, setPrevMonth1] = useState('');
  const [prevMonth2, setPrevMonth2] = useState('');
  const [prevYear, setPrevYear] = useState(new Date().getFullYear());
  const [statusMsg, setStatusMsg] = useState('');

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const yearOptions = (() => {
    const curr = new Date().getFullYear();
    const out = [];
    for (let y = curr; y >= curr - 5; y--) out.push(y);
    return out;
  })();

  // When the left month (prevMonth1) is selected, auto-set prevMonth2 to the next month
  useEffect(() => {
    if (!prevMonth1) {
      // allow manual selection when no left-month chosen
      return;
    }
    const idx = monthNames.indexOf(prevMonth1);
    if (idx === -1) return;
    const next = monthNames[(idx + 1) % 12];
    setPrevMonth2(next);
  }, [prevMonth1]);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setStatusMsg('Geolocation not supported in this browser.');
      return;
    }
    setStatusMsg('Locating...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ latitude, longitude });
        setLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        setStatusMsg('Location captured');
      },
      (err) => {
        console.error('Geolocation error:', err);
        let msg = 'Unable to retrieve location: ' + (err && err.message ? err.message : 'unknown error');
        if (err && typeof err.code === 'number') {
          // 1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT
          if (err.code === 1) msg += ' (permission denied). Please allow location access in your browser.';
          else if (err.code === 2) msg += ' (position unavailable). Check your device or try again.';
          else if (err.code === 3) msg += ' (timed out). Try again or increase timeout.';
        }
        // Hint about secure context requirement
        try {
          if (typeof window !== 'undefined' && window.location && window.location.protocol !== 'https:' && !window.location.hostname.includes('localhost')) {
            msg += ' Note: Geolocation requires a secure context (HTTPS). Serve the app over HTTPS or use localhost.';
          }
        } catch (e) {
          // ignore
        }
        setStatusMsg(msg);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const [showMapPicker, setShowMapPicker] = useState(false);

  const handleMapSelect = (place) => {
    // Accept objects from search (place.lat/place.lon), map click ({lat, lon}) or arrays
    const latRaw = place?.lat ?? place?.latitude ?? (Array.isArray(place) ? place[0] : undefined);
    const lonRaw = place?.lon ?? place?.lng ?? place?.longitude ?? (Array.isArray(place) ? place[1] : undefined);
    const lat = Number(latRaw);
    let lon = Number(lonRaw);

    if (!isFinite(lat) || !isFinite(lon)) {
      console.warn('Invalid place coordinates:', place);
      setStatusMsg('Could not read coordinates from selection.');
      return;
    }

    // Normalize longitude to [-180, 180]
    lon = ((((lon + 180) % 360) + 360) % 360) - 180;

    setCoords({ latitude: lat, longitude: lon });
    setLocation(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);
    setStatusMsg('Location selected from map');
    setShowMapPicker(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Required fields validation
    if (!location || !(Number(area) > 0) || !floor || !yearBuilt) {
      setStatusMsg('Please complete required fields: Location, Area, Floor, Year Built.');
      return;
    }
    // Validate month selections
    if (!prevMonth1 || !prevMonth2) {
      setStatusMsg('Please select both months.');
      return;
    }
    const idx1 = monthNames.indexOf(prevMonth1);
    const idx2 = monthNames.indexOf(prevMonth2);

    // Only allow crossing the year boundary for Dec -> Jan (special case)
    if (idx2 < idx1 && !(idx1 === 11 && idx2 === 0)) {
      setStatusMsg('Invalid selection: only Dec → Jan may cross years. Please pick months in chronological order.');
      return;
    }

    // Compute actual years for each selected month
    const year1 = prevYear;
    const year2 = (idx2 < idx1) ? prevYear + 1 : prevYear;

    // Inclusive month span: number of months from month1 to month2 inclusive
    const spanMonthsInclusive = (year2 - year1) * 12 + (idx2 - idx1) + 1;
    if (spanMonthsInclusive > 4) {
      setStatusMsg('Selected range is too large — maximum allowed is 4 months.');
      return;
    }

    const labels = [`${prevMonth1} ${year1}`, `${prevMonth2} ${year2}`];

    const payload = {
      location,
      coords,
      area: Number(area) || 0,
      floor: Number(floor) || 0,
      yearBuilt: Number(yearBuilt) || null,
      prevTwoMonthsUsage: Number(prevUsage) || 0,
      prevTwoMonthsLabels: labels,
    };

    setStatusMsg('Sending inputs to backend for forecasting...');
    fetch('http://localhost:8000/forecast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(async (res) => {
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'server error');
      }
      return res.json();
    }).then((data) => {
      console.log('Forecast response', data);
      setStatusMsg('Forecast received. See console for details.');
    }).catch((err) => {
      console.error('Forecast error', err);
      setStatusMsg('Forecast failed: ' + (err.message || err));
    });
  };
  return (
    <div className="home-root">
      <Head>
        <title>Energy Forecasting · Residential Buildings</title>
      </Head>

      <header className="site-hero">
        <div className="hero-inner">
          <div className="hero-left">
            <h1 className="hero-title">Smart Energy Forecasts for Residential Buildings</h1>
            <p className="hero-sub muted">Predict consumption, reduce waste, and make energy decisions with confidence — visualizations and KPIs built for operators and researchers.</p>
            <div className="hero-actions">
              <a href="/dashboard" className="btn btn-gradient">Open Dashboard</a>
              <a href="#inputs" className="btn btn-outline">Enter building data</a>
            </div>
          </div>
          <div className="hero-right">
            <div className="live-card card card-large rounded-xl">
              <div className="card-row">
                <div>
                  <div className="text-sm muted">Live Preview</div>
                  <div className="mt-2 font-semibold text-lg">City Residence · Jan 2026</div>
                </div>
                <div className="text-2xl">🏘️</div>
              </div>
              <div className="mt-6">
                <div className="chart-preview">Chart preview placeholder</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="page-container">
        <div className="main-grid">
          <section className="left-panel" id="inputs">
            <div className="card card-large rounded-xl">
              <h3 className="text-lg font-semibold">Building Inputs</h3>
              <form onSubmit={handleSubmit} className="inputs-form">
                <label className="field-label">Location</label>
                <div className="input-row">
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Address or coordinates" className="input input-grow" required />
                  <button type="button" onClick={useMyLocation} className="btn btn-primary">My location</button>
                  <button type="button" onClick={() => setShowMapPicker((s) => !s)} className="btn btn-outline">Select from map</button>
                </div>
                {coords && (
                  <div className="text-xs muted mt-2">Coordinates: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}</div>
                )}
                {showMapPicker && (
                  <div className="mt-3">
                    <FlexibleMapSearch onSelect={handleMapSelect} />
                  </div>
                )}

                <label className="field-label">Area (sq.ft) *</label>
                <input type="number" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. 1200" className="input" min="1" required />

                <div className="two-up">
                  <div>
                    <label className="field-label">Floor</label>
                    <input type="number" value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="Floor number" className="input" required />
                  </div>
                  <div>
                    <label className="field-label">Year Built</label>
                    <input type="number" value={yearBuilt} onChange={(e) => setYearBuilt(e.target.value)} placeholder="e.g. 1998" className="input" required />
                  </div>
                </div>

                <label className="field-label">Which two months?</label>
                <div className="two-up">
                  <div>
                    <select value={prevMonth1} onChange={(e) => setPrevMonth1(e.target.value)} className="input">
                      <option value="">Select month 1</option>
                      {monthNames.map((m, idx) => (
                        <option key={`m1-${m}`} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <select value={prevMonth2} onChange={(e) => setPrevMonth2(e.target.value)} className="input" disabled={prevMonth1 !== ''}>
                      <option value="">Select month 2</option>
                      {monthNames.map((m) => (
                        <option key={`m2-${m}`} value={m}>{m}</option>
                      ))}
                    </select>
                    {prevMonth1 !== '' && <div className="text-xs muted mt-1">Locked to next month: {prevMonth2}</div>}
                  </div>
                </div>

                <label className="field-label">Year (base)</label>
                <select value={prevYear} onChange={(e) => setPrevYear(Number(e.target.value))} className="input" style={{width:'120px'}}>
                  {yearOptions.map((y) => (
                    <option key={`y-${y}`} value={y}>{y}</option>
                  ))}
                </select>
                <div className="text-xs muted mt-1">Special case: if you choose Dec then Jan, Jan will be treated as the following year.</div>

                <label className="field-label">Previous 2 months usage (kWh)</label>
                <input type="number" value={prevUsage} onChange={(e) => setPrevUsage(e.target.value)} placeholder="total kWh" className="input" />

                <div className="form-row">
                  <div className="text-xs muted">{statusMsg}</div>
                  <div className="button-row">
                    <button type="submit" className="btn btn-success">Use Inputs</button>
                    <button type="button" onClick={() => { setLocation(''); setCoords(null); setArea(''); setFloor(''); setYearBuilt(''); setPrevUsage(''); setPrevMonth1(''); setPrevMonth2(''); setPrevYear(new Date().getFullYear()); setStatusMsg(''); }} className="btn btn-outline">Clear</button>
                  </div>
                </div>
              </form>
            </div>
          </section>

          <aside className="right-panel">
            <div className="kpi-grid">
              <div className="card card-small text-center">
                <div className="text-sm muted">Avg Savings</div>
                <div className="font-semibold text-lg mt-2">--%</div>
              </div>
              <div className="card card-small text-center">
                <div className="text-sm muted">Weather Impact</div>
                <div className="font-semibold text-lg mt-2">--</div>
              </div>
              <div className="card card-small text-center">
                <div className="text-sm muted">Forecast Horizon</div>
                <div className="font-semibold text-lg mt-2">2 months</div>
              </div>
              <div className="card card-small text-center">
                <div className="text-sm muted">Model Confidence</div>
                <div className="font-semibold text-lg mt-2">--</div>
              </div>
            </div>

            <div className="mt-6 card card-large rounded-xl">
              <h4 className="text-lg font-semibold">Forecast Details</h4>
              <div className="mt-3 muted">Select inputs to compute a forecast. Results appear here and in the dashboard.</div>
            </div>
          </aside>
        </div>

        <footer className="site-footer">
          <div className="footer-inner muted">© {new Date().getFullYear()} Energy Forecasting — built for research & operations.</div>
        </footer>
      </main>
    </div>
  );
}
