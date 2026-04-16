import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

// Fix for default marker icons in Leaflet with Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapComponentProps {
  location: string;
}

// Component to handle map centering when coordinates change
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, 13);
  return null;
}

export default function MapComponent({ location }: MapComponentProps) {
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) return;

    setLoading(true);
    setError(null);

    // Use Nominatim API for geocoding
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        } else {
          setError('Standort konnte nicht gefunden werden');
        }
      })
      .catch(() => {
        setError('Fehler beim Laden der Kartendaten');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [location]);

  if (loading) {
    return (
      <div className="w-full h-80 bg-white/5 rounded-[2rem] flex flex-col items-center justify-center border border-white/5 animate-pulse">
        <MapPin className="w-8 h-8 text-white/20 mb-4" />
        <span className="text-white/20 text-xs font-bold uppercase tracking-widest">Karte wird geladen...</span>
      </div>
    );
  }

  if (error || !coords) {
    return (
      <div className="w-full h-80 bg-white/5 rounded-[2rem] flex flex-col items-center justify-center border border-white/10">
        <MapPin className="w-8 h-8 text-white/10 mb-4" />
        <span className="text-white/30 text-xs font-bold uppercase tracking-widest">{error || 'Karte nicht verfügbar'}</span>
      </div>
    );
  }

  return (
    <div className="w-full h-80 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl relative z-0">
      <MapContainer 
        center={coords} 
        zoom={13} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%', background: '#050505' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="grayscale-item" // We can style the tiles if wanted, but standard is fine
        />
        <ChangeView center={coords} />
        <Marker position={coords}>
          <Popup>
            <div className="font-serif font-bold text-black">{location}</div>
          </Popup>
        </Marker>
      </MapContainer>
      
      {/* Dark overlay for map to match theme better if needed, but standard OSM is bright. 
          Alternatively use a dark tile set like CartoDB Dark Matter */}
      <style>{`
        .leaflet-container {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
        .leaflet-tile {
          filter: brightness(0.9);
        }
        .leaflet-popup-content-wrapper {
          background: #050505;
          color: white;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 1rem;
        }
        .leaflet-popup-tip {
          background: #050505;
        }
        .leaflet-container .leaflet-marker-icon {
          filter: invert(100%) hue-rotate(-180deg);
        }
      `}</style>
    </div>
  );
}
