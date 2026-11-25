import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Layers, Crosshair, TrainFront, AlertTriangle, MapPin } from 'lucide-react';
import { computeWalkScore, getScoreTier } from '../utils/walkability';
import { ISSUE_CATEGORIES, METRO_STATIONS } from '../data/hyderabadWalkability';

const HYD_CENTER = [17.416, 78.445];

function safeFlyTo(map, lat, lng, zoom) {
  if (!map || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
  const size = map.getSize();
  if (!size || size.x <= 0 || size.y <= 0) return;
  map.flyTo([lat, lng], zoom, { duration: 0.7 });
}

export default function HyderabadMap({
  neighborhoods,
  weights,
  selectedNeighborhoodId,
  onSelectNeighborhood,
  issues,
  selectedIssueId,
  onSelectIssue,
  layers,
  onToggleLayer,
  isPickingLocation,
  draftCoords,
  onPickLocation,
  onCancelPick,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const zonesLayerRef = useRef(null);
  const metroLayerRef = useRef(null);
  const issuesLayerRef = useRef(null);
  const draftMarkerRef = useRef(null);

  const callbacksRef = useRef({
    onSelectNeighborhood,
    onSelectIssue,
    onPickLocation,
  });
  callbacksRef.current = { onSelectNeighborhood, onSelectIssue, onPickLocation };

  const pendingViewRef = useRef(null);
  const wasZeroSizeRef = useRef(true);

  // Initialize Leaflet map once
  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;

    const map = L.map(el, {
      center: HYD_CENTER,
      zoom: 12,
      zoomControl: false,
      minZoom: 11,
      maxZoom: 18,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    zonesLayerRef.current = L.layerGroup().addTo(map);
    metroLayerRef.current = L.layerGroup().addTo(map);
    issuesLayerRef.current = L.layerGroup().addTo(map);

    mapRef.current = map;

    const ro = new ResizeObserver(() => {
      if (!mapRef.current) return;
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        mapRef.current.invalidateSize({ animate: false });
        if (wasZeroSizeRef.current && pendingViewRef.current) {
          const { lat, lng, zoom } = pendingViewRef.current;
          mapRef.current.setView([lat, lng], zoom, { animate: false });
        }
        wasZeroSizeRef.current = false;
      } else {
        wasZeroSizeRef.current = true;
      }
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle click-to-pick location mode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const container = map.getContainer();
    container.style.cursor = isPickingLocation ? 'crosshair' : '';

    const handleClick = (e) => {
      if (!isPickingLocation) return;
      const { lat, lng } = e.latlng;
      callbacksRef.current.onPickLocation(
        Number(lat.toFixed(5)),
        Number(lng.toFixed(5))
      );
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
      container.style.cursor = '';
    };
  }, [isPickingLocation]);

  // Render draft location pin when picking/reporting
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (draftMarkerRef.current) {
      draftMarkerRef.current.remove();
      draftMarkerRef.current = null;
    }

    if (draftCoords && Number.isFinite(draftCoords.lat) && Number.isFinite(draftCoords.lng)) {
      const icon = L.divIcon({
        className: 'draft-pin-icon',
        html: `
          <div style="position:relative;display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);">
            <div style="background:#181D23;color:#fff;font-size:11px;font-weight:700;padding:3px 8px;border-radius:9999px;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.25);margin-bottom:4px;">
              New Issue Pin
            </div>
            <div style="width:20px;height:20px;border-radius:9999px;background:#D96B27;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);"></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([draftCoords.lat, draftCoords.lng], {
        icon,
        draggable: true,
        zIndexOffset: 1000,
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        callbacksRef.current.onPickLocation(
          Number(pos.lat.toFixed(5)),
          Number(pos.lng.toFixed(5))
        );
      });

      draftMarkerRef.current = marker;
    }
  }, [draftCoords]);

  // Render Walkability Zones layer
  useEffect(() => {
    const group = zonesLayerRef.current;
    const map = mapRef.current;
    if (!group || !map) return;

    group.clearLayers();
    if (!layers.zones) return;

    neighborhoods.forEach((n) => {
      const score = computeWalkScore(n.metrics, weights);
      const tier = getScoreTier(score);
      const isSelected = n.id === selectedNeighborhoodId;

      const circle = L.circle([n.lat, n.lng], {
        radius: n.radiusM,
        color: tier.color,
        weight: isSelected ? 3 : 1.5,
        opacity: isSelected ? 0.95 : 0.65,
        fillColor: tier.color,
        fillOpacity: isSelected ? 0.22 : 0.12,
      });

      circle.on('click', () => {
        if (!isPickingLocation) {
          callbacksRef.current.onSelectNeighborhood(n.id);
        }
      });

      circle.addTo(group);

      const badgeIcon = L.divIcon({
        className: 'walk-zone-badge',
        html: `
          <button type="button" aria-label="${n.name} walk score ${score}" style="
            display:flex;
            align-items:center;
            gap:6px;
            background:${isSelected ? '#181D23' : '#FFFFFF'};
            color:${isSelected ? '#FFFFFF' : '#181D23'};
            border:2px solid ${tier.color};
            border-radius:9999px;
            padding:3px 9px 3px 4px;
            box-shadow:${isSelected ? '0 8px 20px rgba(24,29,35,0.28)' : '0 4px 12px rgba(24,29,35,0.14)'};
            font-family:Inter,system-ui,sans-serif;
            font-size:11px;
            font-weight:700;
            white-space:nowrap;
            cursor:pointer;
            transform:translate(-50%,-50%);
          ">
            <span style="
              display:inline-flex;
              align-items:center;
              justify-content:center;
              width:22px;
              height:22px;
              border-radius:9999px;
              background:${tier.color};
              color:#fff;
              font-family:'JetBrains Mono',monospace;
              font-size:11px;
              font-weight:700;
            ">${score}</span>
            <span>${n.name.split('&')[0].split('(')[0].trim()}</span>
          </button>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const badgeMarker = L.marker([n.lat, n.lng], {
        icon: badgeIcon,
        zIndexOffset: isSelected ? 500 : 100,
      });

      badgeMarker.on('click', () => {
        if (!isPickingLocation) {
          callbacksRef.current.onSelectNeighborhood(n.id);
        }
      });

      badgeMarker.addTo(group);
    });
  }, [neighborhoods, weights, selectedNeighborhoodId, layers.zones, isPickingLocation]);

  // Render Metro stations layer
  useEffect(() => {
    const group = metroLayerRef.current;
    if (!group) return;

    group.clearLayers();
    if (!layers.metro) return;

    METRO_STATIONS.forEach((st) => {
      const icon = L.divIcon({
        className: 'metro-station-icon',
        html: `
          <div title="${st.name} (${st.line} Line)" style="
            width:22px;
            height:22px;
            border-radius:6px;
            background:#0E7C7B;
            color:#FFFFFF;
            border:2px solid #FFFFFF;
            box-shadow:0 2px 6px rgba(14,124,123,0.4);
            display:flex;
            align-items:center;
            justify-content:center;
            font-family:'Plus Jakarta Sans',sans-serif;
            font-weight:800;
            font-size:11px;
            transform:translate(-50%,-50%);
          ">M</div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([st.lat, st.lng], { icon, zIndexOffset: 200 });
      marker.bindPopup(
        `<div style="padding:10px 12px;">
          <div style="font-size:10px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#0E7C7B;">Hyderabad Metro</div>
          <div style="font-size:13px;font-weight:700;color:#181D23;margin-top:2px;">${st.name}</div>
          <div style="font-size:12px;color:#525866;margin-top:2px;">${st.line} Line</div>
        </div>`,
        { className: 'walkable-popup' }
      );
      marker.addTo(group);
    });
  }, [layers.metro]);

  // Render Pedestrian Issues layer
  useEffect(() => {
    const group = issuesLayerRef.current;
    if (!group) return;

    group.clearLayers();
    if (!layers.issues) return;

    const categoryMap = Object.fromEntries(ISSUE_CATEGORIES.map((c) => [c.id, c]));

    issues.forEach((issue) => {
      const cat = categoryMap[issue.category] || { label: 'Issue', color: '#D96B27' };
      const isSelected = issue.id === selectedIssueId;
      const isResolved = issue.status === 'Resolved';
      const pinColor = isResolved ? '#1F7A4C' : cat.color;

      const icon = L.divIcon({
        className: 'issue-pin-icon',
        html: `
          <div style="
            position:relative;
            transform:translate(-50%,-50%);
            width:${isSelected ? 22 : 16}px;
            height:${isSelected ? 22 : 16}px;
            border-radius:9999px;
            background:${pinColor};
            border:${isSelected ? '3px solid #181D23' : '2.5px solid #FFFFFF'};
            box-shadow:0 3px 10px rgba(0,0,0,0.28);
            cursor:pointer;
          ">
            ${
              issue.severity === 'Critical' && !isResolved
                ? `<span style="position:absolute;inset:-4px;border-radius:9999px;border:2px solid ${pinColor};opacity:0.55;"></span>`
                : ''
            }
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([issue.lat, issue.lng], {
        icon,
        zIndexOffset: isSelected ? 800 : 300,
      });

      marker.bindPopup(
        `<div style="padding:12px 14px;max-width:260px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:${pinColor};">${cat.label}</span>
            <span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:9999px;background:#F3F4F6;color:#181D23;">${issue.status}</span>
          </div>
          <div style="font-size:13px;font-weight:700;color:#181D23;margin-top:4px;line-height:1.3;">${issue.title}</div>
          <div style="font-size:11px;color:#525866;margin-top:4px;">${issue.street}</div>
          <div style="font-size:11px;color:#374151;margin-top:6px;line-height:1.4;">${issue.description}</div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;padding-top:6px;border-top:1px solid #EFECE6;font-size:11px;color:#525866;">
            <span>Severity: <strong>${issue.severity}</strong></span>
            <span>▲ ${issue.upvotes}</span>
          </div>
        </div>`,
        { className: 'walkable-popup' }
      );

      marker.on('click', () => {
        if (!isPickingLocation) {
          callbacksRef.current.onSelectIssue(issue.id);
        }
      });

      marker.addTo(group);

      const map = mapRef.current;
      if (isSelected && map && map.getSize().x > 0 && map.getSize().y > 0) {
        marker.openPopup();
      }
    });
  }, [issues, selectedIssueId, layers.issues, isPickingLocation]);

  // Smooth fly-to when neighborhood changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedNeighborhoodId) return;
    const target = neighborhoods.find((n) => n.id === selectedNeighborhoodId);
    if (target) {
      pendingViewRef.current = { lat: target.lat, lng: target.lng, zoom: 13.5 };
      safeFlyTo(map, target.lat, target.lng, 13.5);
    }
  }, [selectedNeighborhoodId, neighborhoods]);

  // Smooth fly-to when issue changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedIssueId) return;
    const target = issues.find((i) => i.id === selectedIssueId);
    if (target) {
      pendingViewRef.current = { lat: target.lat, lng: target.lng, zoom: 15 };
      safeFlyTo(map, target.lat, target.lng, 15);
    }
  }, [selectedIssueId, issues]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#E9E4DA]">
      <div
        ref={containerRef}
        className="h-full w-full"
        role="region"
        aria-label="Interactive Walkable Hyderabad Map"
      />

      {/* Picking Location Banner */}
      {isPickingLocation && (
        <div className="pointer-events-auto absolute top-4 left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-3 rounded-full border border-[#D96B27] bg-[#181D23] px-4 py-2 text-xs font-medium text-white shadow-xl">
          <Crosshair className="h-4 w-4 text-[#F39C6B]" />
          <span>Click anywhere on the Hyderabad map to place (or drag) the issue pin</span>
          <button
            type="button"
            onClick={onCancelPick}
            className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-white hover:bg-white/25"
          >
            Done
          </button>
        </div>
      )}

      {/* Map Layer Toggles */}
      <div className="pointer-events-auto absolute top-4 right-4 z-[900] flex flex-wrap items-center gap-1.5 rounded-xl border border-black/10 bg-white/95 p-1.5 shadow-lg backdrop-blur-sm">
        <span className="flex items-center gap-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-[#525866]">
          <Layers className="h-3.5 w-3.5" />
          Layers
        </span>
        <button
          type="button"
          onClick={() => onToggleLayer('zones')}
          aria-pressed={layers.zones}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
            layers.zones
              ? 'bg-[#181D23] text-white shadow-xs'
              : 'bg-transparent text-[#525866] hover:bg-black/5'
          }`}
        >
          <MapPin className="h-3.5 w-3.5" />
          Walk Zones
        </button>
        <button
          type="button"
          onClick={() => onToggleLayer('issues')}
          aria-pressed={layers.issues}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
            layers.issues
              ? 'bg-[#D96B27] text-white shadow-xs'
              : 'bg-transparent text-[#525866] hover:bg-black/5'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Issues ({issues.length})
        </button>
        <button
          type="button"
          onClick={() => onToggleLayer('metro')}
          aria-pressed={layers.metro}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
            layers.metro
              ? 'bg-[#0E7C7B] text-white shadow-xs'
              : 'bg-transparent text-[#525866] hover:bg-black/5'
          }`}
        >
          <TrainFront className="h-3.5 w-3.5" />
          Metro
        </button>
      </div>

      {/* Compact Legend */}
      <div className="pointer-events-auto absolute bottom-4 left-4 z-[900] hidden sm:flex flex-col gap-1.5 rounded-xl border border-black/10 bg-white/95 px-3 py-2.5 text-[11px] shadow-lg backdrop-blur-sm">
        <div className="font-semibold uppercase tracking-wider text-[#525866]">Walkability Scale</div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium text-[#181D23]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#1F7A4C]" /> 82+ Haven
          </span>
          <span className="flex items-center gap-1.5 font-medium text-[#181D23]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#0E7C7B]" /> 72–81 High
          </span>
          <span className="flex items-center gap-1.5 font-medium text-[#181D23]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#D96B27]" /> 62–71 Fair
          </span>
          <span className="flex items-center gap-1.5 font-medium text-[#181D23]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#B91C1C]" /> &lt;62 Needs Work
          </span>
        </div>
      </div>
    </div>
  );
}
