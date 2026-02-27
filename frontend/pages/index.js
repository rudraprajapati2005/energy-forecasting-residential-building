import Head from 'next/head';
import { useState } from 'react';

export default function Home() {
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState(null);
  const [area, setArea] = useState('');
  const [floor, setFloor] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [prevUsage, setPrevUsage] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

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
        setStatusMsg('Unable to retrieve location: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      location,
      coords,
      area: Number(area) || 0,
      floor: Number(floor) || 0,
      yearBuilt: Number(yearBuilt) || null,
      prevTwoMonthsUsage: Number(prevUsage) || 0,
    };
    console.log('Form payload:', payload);
    setStatusMsg('Inputs logged to console.');
    // TODO: send payload to backend or use in forecasting flow
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
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Address or coordinates" className="input input-grow" />
                  <button type="button" onClick={useMyLocation} className="btn btn-primary">My location</button>
                </div>

                <label className="field-label">Area (sq.ft)</label>
                <input type="number" value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. 1200" className="input" />

                <div className="two-up">
                  <div>
                    <label className="field-label">Floor</label>
                    <input type="number" value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="Floor number" className="input" />
                  </div>
                  <div>
                    <label className="field-label">Year Built</label>
                    <input type="number" value={yearBuilt} onChange={(e) => setYearBuilt(e.target.value)} placeholder="e.g. 1998" className="input" />
                  </div>
                </div>

                <label className="field-label">Previous 2 months usage (kWh)</label>
                <input type="number" value={prevUsage} onChange={(e) => setPrevUsage(e.target.value)} placeholder="total kWh" className="input" />

                <div className="form-row">
                  <div className="text-xs muted">{statusMsg}</div>
                  <div className="button-row">
                    <button type="submit" className="btn btn-success">Use Inputs</button>
                    <button type="button" onClick={() => { setLocation(''); setCoords(null); setArea(''); setFloor(''); setYearBuilt(''); setPrevUsage(''); setStatusMsg(''); }} className="btn btn-outline">Clear</button>
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
