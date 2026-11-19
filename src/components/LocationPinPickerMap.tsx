"use client";

import React, { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Layers, Move } from "lucide-react";

interface LocationPinPickerMapProps {
  lat: number;
  lng: number;
  technicianName?: string;
  priceUSD?: number;
  onChange: (newLat: number, newLng: number) => void;
}

export default function LocationPinPickerMap({
  lat,
  lng,
  technicianName = "Mi Ubicación",
  priceUSD = 15,
  onChange,
}: LocationPinPickerMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const [mapStyle, setMapStyle] = useState<"roadmap" | "hybrid">("roadmap");
  const [isLocatingGps, setIsLocatingGps] = useState(false);

  const buildPinHtml = (name: string, price: number) => {
    const firstName = (name || "Técnico").trim().split(" ")[0];
    return `
      <div style="
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 6px 11px;
        border-radius: 9999px;
        font-weight: 800;
        font-size: 11px;
        white-space: nowrap;
        box-shadow: 0 8px 20px rgba(10, 37, 64, 0.45);
        border: 2px solid #fbbf24;
        background: #0A2540;
        color: #ffffff;
        cursor: grab;
      ">
        <span style="color: #fbbf24; font-weight: 900;">📍</span>
        <span>${firstName}</span>
        <span style="background: rgba(255,255,255,0.18); padding: 1px 6px; border-radius: 999px; font-size: 10px;">
          $${price || 15}
        </span>
      </div>
    `;
  };

  useEffect(() => {
    let mounted = true;

    async function initPickerMap() {
      if (!containerRef.current || mapRef.current) return;
      const L = (await import("leaflet")).default;
      if (!mounted || !containerRef.current) return;

      const startLat = Number(lat) || 10.258;
      const startLng = Number(lng) || -67.595;

      const map = L.map(containerRef.current, {
        center: [startLat, startLng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
        touchZoom: true,
        dragging: true,
        scrollWheelZoom: true,
      });

      L.control
        .zoom({
          position: "bottomright",
          zoomInTitle: "Acercar",
          zoomOutTitle: "Alejar",
        })
        .addTo(map);

      const tileLayer = L.tileLayer(
        "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=es",
        { maxZoom: 20, minZoom: 6 }
      ).addTo(map);

      const icon = L.divIcon({
        className: "jireh-gmap-pin",
        html: buildPinHtml(technicianName, priceUSD),
        iconSize: [130, 34],
        iconAnchor: [65, 17],
      });

      const marker = L.marker([startLat, startLng], {
        icon,
        draggable: true,
      }).addTo(map);

      // Al arrastrar el icono del técnico y soltarlo
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        if (pos) {
          onChange(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
        }
      });

      // Al tocar o hacer clic en cualquier punto del mapa, mover el icono allí
      map.on("click", (e: any) => {
        const clickedLat = Number(e.latlng.lat.toFixed(6));
        const clickedLng = Number(e.latlng.lng.toFixed(6));
        marker.setLatLng([clickedLat, clickedLng]);
        onChange(clickedLat, clickedLng);
      });

      mapRef.current = map;
      markerRef.current = marker;
      tileLayerRef.current = tileLayer;
    }

    initPickerMap();

    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Actualizar posición del marcador si cambia desde fuera (ej. al escribir dirección o usar GPS)
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    const validLat = Number(lat);
    const validLng = Number(lng);
    if (!validLat || !validLng) return;

    const currentPos = markerRef.current.getLatLng();
    const dist =
      Math.abs(currentPos.lat - validLat) + Math.abs(currentPos.lng - validLng);
    if (dist > 0.0001) {
      markerRef.current.setLatLng([validLat, validLng]);
      mapRef.current.flyTo(
        [validLat, validLng],
        Math.max(mapRef.current.getZoom(), 13),
        { duration: 0.5 }
      );
    }
  }, [lat, lng]);

  // Actualizar nombre o tarifa en el pin en vivo
  useEffect(() => {
    async function refreshIcon() {
      if (!markerRef.current) return;
      const L = (await import("leaflet")).default;
      const icon = L.divIcon({
        className: "jireh-gmap-pin",
        html: buildPinHtml(technicianName, priceUSD),
        iconSize: [130, 34],
        iconAnchor: [65, 17],
      });
      markerRef.current.setIcon(icon);
    }
    refreshIcon();
  }, [technicianName, priceUSD]);

  // Alternar vista Calles / Satélite
  useEffect(() => {
    if (!tileLayerRef.current) return;
    const lyrs = mapStyle === "hybrid" ? "y" : "m";
    tileLayerRef.current.setUrl(
      `https://mt1.google.com/vt/lyrs=${lyrs}&x={x}&y={y}&z={z}&hl=es`
    );
  }, [mapStyle]);

  const handleUseCurrentGps = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const gpsLat = Number(pos.coords.latitude.toFixed(6));
        const gpsLng = Number(pos.coords.longitude.toFixed(6));
        onChange(gpsLat, gpsLng);
        if (mapRef.current && markerRef.current) {
          markerRef.current.setLatLng([gpsLat, gpsLng]);
          mapRef.current.flyTo([gpsLat, gpsLng], 16, { duration: 0.6 });
        }
        setIsLocatingGps(false);
      },
      () => {
        setIsLocatingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="bg-white border border-cyan-300/90 rounded-2xl p-3 space-y-2.5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-extrabold text-[#0A2540] flex items-center gap-1.5">
            <Move className="w-3.5 h-3.5 text-[#00B4D8]" />
            <span>Ubica tu Icono Exacto en el Mapa</span>
          </p>
          <p className="text-[11px] text-slate-500">
            Arrastra tu icono o haz clic/toque en el punto del mapa más cercano
            a tu dirección real.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleUseCurrentGps}
            disabled={isLocatingGps}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-xl text-[11px] font-extrabold flex items-center gap-1 transition-colors"
          >
            <Navigation className="w-3 h-3 text-emerald-600" />
            <span>{isLocatingGps ? "Ubicando..." : "Usar mi GPS"}</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setMapStyle((prev) =>
                prev === "roadmap" ? "hybrid" : "roadmap"
              )
            }
            className="bg-slate-100 hover:bg-slate-200 text-[#0A2540] px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-colors"
          >
            <Layers className="w-3 h-3 text-[#0096C7]" />
            <span>{mapStyle === "roadmap" ? "Satélite" : "Calles"}</span>
          </button>
        </div>
      </div>

      {/* Mapa Interactivo para Arrastrar o Tocar la Ubicación Exacta */}
      <div className="relative w-full h-52 sm:h-60 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
        <div ref={containerRef} className="w-full h-full" />
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium px-1">
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3 text-[#00B4D8]" />
          Coordenadas seleccionadas:{" "}
          <strong className="text-[#0A2540] font-mono">
            {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}
          </strong>
        </span>
        <span className="text-[#0096C7] font-bold">
          💡 Puedes mover el pin con el dedo o ratón
        </span>
      </div>
    </div>
  );
}
