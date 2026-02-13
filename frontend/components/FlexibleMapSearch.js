import { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, LayersControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './FlexibleMapSearch.module.css';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search?format=json&q=';

function MapSearchBar({ onSelect }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const timeoutRef = useRef();

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }
    timeoutRef.current = setTimeout(async () => {
      const res = await fetch(NOMINATIM_URL + encodeURIComponent(value));
      const data = await res.json();
      setSuggestions(data);
    }, 400);
  };

  return (
    <div className={styles.searchWrapper}>
      <input
        type="text"
        className={styles.searchInput}
        placeholder="Search location..."
        value={query}
        onChange={handleChange}
      />
      {suggestions.length > 0 && (
        <div className={styles.suggestions}>
          {suggestions.map((s) => (
            <div
              key={s.place_id}
              className={styles.suggestion}
              onClick={() => {
                onSelect(s);
                setQuery(s.display_name);
                setSuggestions([]);
              }}
            >
              {s.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MapMarker({ position }) {
  return (
    <Marker position={position}>
      <Popup>Selected Location</Popup>
    </Marker>
  );
}

function MapPanTo({ position }) {
  const map = useMap();
  if (position) {
    map.setView(position, 13);
  }
  return null;
}

export default function FlexibleMapSearch() {
  const [position, setPosition] = useState([40.7128, -74.006]);
  const [marker, setMarker] = useState(null);
  const { BaseLayer } = LayersControl;

  const handleSelect = (place) => {
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    setPosition([lat, lon]);
    setMarker([lat, lon]);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapSearchBar onSelect={handleSelect} />
      <MapContainer
        center={position}
        zoom={10}
        scrollWheelZoom={true}
        style={{ height: '500px', width: '100%' }}
        zoomControl={false}
      >
        <ZoomControl position="topright" />
        <LayersControl position="topright">
          <BaseLayer checked name="OpenStreetMap">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          </BaseLayer>
          <BaseLayer name="Satellite">
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
          </BaseLayer>
        </LayersControl>
        {marker && <MapMarker position={marker} />}
        <MapPanTo position={position} />
      </MapContainer>
    </div>
  );
}
