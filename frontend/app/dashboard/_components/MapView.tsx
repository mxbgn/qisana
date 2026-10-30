'use client';

import { useState, useEffect, useRef } from 'react';
import { Professional } from '../page';

interface MapViewProps {
  results: Professional[];
  centerCoords: { lat: number; lng: number; zoom?: number } | null;
  searchMarkerCoords: { lat: number; lng: number } | null;
  selectedProId: number | null;
  hoveredProId: number | null;
  onProClick: (pro: Professional) => void;
}

export default function MapView({ results, centerCoords, searchMarkerCoords, selectedProId, hoveredProId, onProClick }: MapViewProps) {
  const [lib, setLib] = useState<any>(null);
  const mapRef = useRef<any>(null);
  const prevCenterCoordsRef = useRef<{ lat: number; lng: number; zoom?: number } | null>(null);

  useEffect(() => {
    import('leaflet').then((L) => {
      import('react-leaflet').then((rl) => {
        setLib({ L, ...rl });
      });
    });
  }, []);

  if (!lib) {
    return (
      <div className="w-full aspect-square shrink-0 lg:w-auto lg:aspect-auto lg:h-auto lg:flex-1 lg:shrink min-w-0 relative z-0 qisana-card flex items-center justify-center bg-surface-base text-surface-muted font-medium italic">
        Initialisation de la carte...
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, useMapEvents } = lib;

  function MapController() {
    const map = useMapEvents({});
    
    useEffect(() => {
      if (map) {
        mapRef.current = map;
      }
    }, [map]);

    useEffect(() => {
      if (!centerCoords || !map) return;

      const hasChanged = !prevCenterCoordsRef.current || 
        prevCenterCoordsRef.current.lat !== centerCoords.lat ||
        prevCenterCoordsRef.current.lng !== centerCoords.lng ||
        prevCenterCoordsRef.current.zoom !== centerCoords.zoom;
      
      if (hasChanged) {
        const targetZoom = centerCoords.zoom ?? map.getZoom();
        map.flyTo([centerCoords.lat, centerCoords.lng], targetZoom);
        prevCenterCoordsRef.current = centerCoords;
      }
    }, [centerCoords, map]);
    
    return null;
  }

  const createIcon = (proId: number) => {
    const isSelected = proId === selectedProId;
    const isHovered = proId === hoveredProId;
    const color = isSelected ? '#020265' : '#64748b';
    const scale = isSelected ? 'scale-150' : (isHovered ? 'scale-125' : 'scale-100');
    const shadow = isSelected || isHovered ? 'drop-shadow-[0_0_8px_rgba(2,2,101,0.5)]' : 'drop-shadow-md';

    return lib.L.divIcon({
      className: 'bg-transparent border-none',
      html: `<div class="transition-all duration-300 ease-out ${scale} ${shadow}">
               <svg width="32" height="42" viewBox="0 0 32 42" fill="none">
                 <path d="M16 2C8.268 2 2 8.268 2 16C2 28 16 40 16 40C16 40 30 28 30 16C30 8.268 23.732 2 16 2Z" fill="${color}" stroke="white" stroke-width="3"/>
                 <circle cx="16" cy="16" r="4.5" fill="white"/>
               </svg>
             </div>`,
      iconSize: [32, 42], iconAnchor: [16, 42],
    });
  };

  const createSearchIcon = () => {
    return lib.L.divIcon({
      className: 'bg-transparent border-none',
      html: `<div class="drop-shadow-md">
               <svg width="32" height="42" viewBox="0 0 32 42" fill="none">
                 <path d="M16 2C8.268 2 2 8.268 2 16C2 28 16 40 16 40C16 40 30 28 30 16C30 8.268 23.732 2 16 2Z" fill="#bb2929" stroke="white" stroke-width="3"/>
                 <circle cx="16" cy="16" r="4.5" fill="white"/>
               </svg>
             </div>`,
      iconSize: [32, 42], iconAnchor: [16, 42],
    });
  };

  return (
    <main className="w-full aspect-square shrink-0 lg:w-auto lg:aspect-auto lg:h-auto lg:flex-1 lg:shrink min-w-0 relative z-0 qisana-card">
      <MapContainer center={[48.8566, 2.3522]} zoom={12} zoomControl={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer 
          url={`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${process.env.NEXT_PUBLIC_CARTO_API_KEY}`} 
          attribution='&copy; CARTO &mdash; &copy; OpenStreetMap contributors' 
        />
        <MapController />

        {searchMarkerCoords && (
          <Marker 
            position={[searchMarkerCoords.lat, searchMarkerCoords.lng]} 
            icon={createSearchIcon()}
            zIndexOffset={2000}
          >
            <Popup>
              <div className="font-sans font-bold text-brand-navy text-xs">Lieu de l'intervention</div>
            </Popup>
          </Marker>
        )}

        {results.map((pro) => {
          const isSelected = pro.id === selectedProId;
          const isHovered = pro.id === hoveredProId;
          const zIndex = isSelected ? 500 : (isHovered ? 1000 : 0);

          return pro.profile?.lat && (
            <Marker 
              key={pro.id} 
              position={[pro.profile.lat, pro.profile.lng]} 
              icon={createIcon(pro.id)}
              zIndexOffset={zIndex}
              eventHandlers={{
                click: () => onProClick(pro)
              }}
            />
          );
        })}
      </MapContainer>
    </main>
  );
}
