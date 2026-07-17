import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useTheme } from '../contexts/ThemeContext';

interface MapNode {
  id: number;
  name: string;
  type: string;
  status: string;
  occupancy: number;
  queue_length_minutes: number;
}

interface DigitalTwinMapProps {
  nodes: MapNode[];
  activePath?: { lat: number; lng: number }[]; // Array of nodes in routing path
  onNodeClick?: (nodeName: string) => void;
}

const DigitalTwinMap = ({ nodes, activePath, onNodeClick }: DigitalTwinMapProps) => {
  const { theme } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);
  const pathLineRef = useRef<L.Polyline | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const rectangleRef = useRef<L.Rectangle | null>(null);

  // Center around MetLife Stadium mock coordinates
  const STADIUM_CENTER: [number, number] = [34.0538, -118.2447];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Leaflet Map
    const map = L.map(mapContainerRef.current, {
      center: STADIUM_CENTER,
      zoom: 17,
      zoomControl: true,
      attributionControl: false
    });

    // Drawing outer stadium ring layout boundary as a visual layout guide
    const circle = L.circle(STADIUM_CENTER, {
      radius: 350
    }).addTo(map);
    circleRef.current = circle;

    // Inner Pitch boundary
    const rect = L.rectangle([
      [34.0533, -118.2452],
      [34.0543, -118.2442]
    ], {
      weight: 2
    }).addTo(map);
    rectangleRef.current = rect;

    mapRef.current = map;
    markerGroupRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
    };
  }, []);

  // Update map tile layers and styles based on theme
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileUrl = theme === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Recolor stadium boundary circle
    if (circleRef.current) {
      circleRef.current.setStyle({
        color: theme === 'dark' ? '#0842a0' : '#1a73e8',
        fillColor: theme === 'dark' ? '#0842a0' : '#e8f0fe',
        fillOpacity: 0.1
      });
    }

    // Recolor inner pitch rectangle
    if (rectangleRef.current) {
      rectangleRef.current.setStyle({
        color: theme === 'dark' ? '#0f5132' : '#1e8e3e',
        fillColor: theme === 'dark' ? '#0f5132' : '#e6f4ea',
        fillOpacity: 0.15
      });
    }
  }, [theme]);

  // Update markers when nodes list updates (simulated fluctuations)
  useEffect(() => {
    const map = mapRef.current;
    const markerGroup = markerGroupRef.current;
    if (!map || !markerGroup) return;

    markerGroup.clearLayers();

    // Map each node type to coordinate offsets
    const nodeCoords: { [key: string]: [number, number] } = {
      "Gate 1": [34.0522, -118.2437],
      "Gate 2": [34.0532, -118.2447],
      "Gate 3 (Congested)": [34.0542, -118.2457],
      "Gate 4": [34.0552, -118.2467],
      "Gate 5": [34.0562, -118.2477],
      "Concessions Plaza": [34.0548, -118.2452],
      "Restrooms North": [34.0558, -118.2462],
      "Medical Station 1": [34.0538, -118.2442],
      "Transport Terminal": [34.0512, -118.2427]
    };

    nodes.forEach((node: MapNode) => {
      const coords = nodeCoords[node.name] || STADIUM_CENTER;

      // Color coding depending on status
      let color = '#1e8e3e'; // Google Green
      if (node.status === 'congested') {
        color = '#d93025'; // Google Red
      } else if (node.status === 'restricted') {
        color = '#ab47bc'; // Purple
      } else if (node.status === 'closed') {
        color = '#5f6368'; // Muted Gray
      }

      // Draw custom circle marker
      const marker = L.circleMarker(coords, {
        radius: 12 + (node.occupancy / 20), // grows with density
        color: color,
        fillColor: color,
        fillOpacity: 0.6,
        weight: 2
      });

      // Bind detailed digital twin details tooltip
      const tooltipContent = `
        <div style="font-family: Inter, sans-serif; padding: 4px; color: ${theme === 'dark' ? '#fff' : '#202124'};">
          <h4 style="margin: 0 0 4px 0; font-weight: bold; color: ${theme === 'dark' ? '#a8c7fa' : '#1a73e8'};">${node.name}</h4>
          <p style="margin: 0; font-size: 11px; color: ${theme === 'dark' ? '#b3b3b3' : '#5f6368'};">Status: <strong style="color: ${color};">${node.status.toUpperCase()}</strong></p>
          <p style="margin: 0; font-size: 11px; color: ${theme === 'dark' ? '#b3b3b3' : '#5f6368'};">Occupancy: <strong>${node.occupancy}%</strong></p>
          <p style="margin: 0; font-size: 11px; color: ${theme === 'dark' ? '#b3b3b3' : '#5f6368'};">Est. Wait: <strong>${node.queue_length_minutes} mins</strong></p>
        </div>
      `;

      marker.bindTooltip(tooltipContent, {
        permanent: false,
        direction: 'top',
        className: theme === 'dark' ? 'leaflet-tooltip-custom-dark' : 'leaflet-tooltip-custom-light'
      });

      if (onNodeClick) {
        marker.on('click', () => onNodeClick(node.name));
      }

      marker.addTo(markerGroup);
    });
  }, [nodes, theme]);

  // Update polyline route path
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old path
    if (pathLineRef.current) {
      map.removeLayer(pathLineRef.current);
      pathLineRef.current = null;
    }

    if (activePath && activePath.length > 0) {
      const latlngs = activePath.map((node: { lat: number; lng: number }) => [node.lat, node.lng] as [number, number]);
      
      const polyline = L.polyline(latlngs, {
        color: '#f9ab00', // Google Yellow accent line
        weight: 5,
        opacity: 0.8,
        dashArray: '8, 8',
        lineJoin: 'round'
      }).addTo(map);

      pathLineRef.current = polyline;
      map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    }
  }, [activePath]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-neutral-200 dark:border-[#3c4043] shadow-sm">
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '380px' }} />
      {/* Visual Overlay Ticker info */}
      <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 pointer-events-none z-[1000] shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-[#1e8e3e] animate-pulse"></span>
          <span>Telemetry Synced</span>
        </div>
      </div>
    </div>
  );
};

export default DigitalTwinMap;
