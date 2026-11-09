"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MapPin,
  Star,
  Maximize2,
  ShieldCheck,
  Navigation,
  ExternalLink,
  Layers,
  Sparkles,
} from "lucide-react";
import { TechnicianProfile, JirehCity } from "@/types/jireh";

interface InteractiveMapViewProps {
  technicians: TechnicianProfile[];
  selectedCity: JirehCity;
  onSelectTechnician: (tech: TechnicianProfile) => void;
  compactPreview?: boolean;
  onExpandMap?: () => void;
}

export default function InteractiveMapView({
  technicians,
  selectedCity,
  onSelectTechnician,
  compactPreview = false,
  onExpandMap,
}: InteractiveMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  const [activeTech, setActiveTech] = useState<TechnicianProfile | null>(null);
  const [mapStyle, setMapStyle] = useState<"roadmap" | "hybrid">("roadmap");
  const [isMapReady, setIsMapReady] = useState(false);

  // =========================================================================
  // REGLA SOLICITADA: Mostrar en el mapa ÚNICAMENTE la ubicación de los
  // 6 primeros técnicos (Top #1 al #6) + aquellos técnicos adicionales que
  // hayan actualizado expresamente su información de ubicación.
  // =========================================================================
  const mappedTechnicians = useMemo(() => {
    const primarySixAndUpdated = technicians.filter(
      (t) =>
        (t.rankingVip !== undefined && t.rankingVip <= 6) ||
        t.fechaSolicitud === "Actualización VIP" ||
        t.fechaSolicitud === "Hoy"
    );

    if (primarySixAndUpdated.length > 0) {
      return primarySixAndUpdated;
    }
    return technicians.slice(0, 6);
  }, [technicians]);

  // Inicializar Google Maps sobre motor interactivo Leaflet (100% táctil, pellizco para zoom y arrastre nativo)
  useEffect(() => {
    let isMounted = true;

    async function setupGoogleMap() {
      if (!mapContainerRef.current || leafletMapRef.current) return;

      const L = (await import("leaflet")).default;
      if (!isMounted || !mapContainerRef.current) return;

      const initialCenter: [number, number] =
        selectedCity === "Valencia"
          ? [10.2215, -68.012]
          : selectedCity === "Caracas"
          ? [10.496, -66.853]
          : [10.258, -67.601]; // Maracay por defecto

      const initialZoom = selectedCity === "Todas" ? 10 : 13;

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        zoomControl: false,
        attributionControl: false,
        touchZoom: true,
        dragging: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
      });

      // Controles de zoom en esquina inferior derecha (estilo Google Maps)
      L.control
        .zoom({
          position: "bottomright",
          zoomInTitle: "Acercar mapa",
          zoomOutTitle: "Alejar mapa",
        })
        .addTo(map);

      // Capa oficial de Google Maps Calles en Español (mt1.google.com)
      const gmapTileUrl =
        "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=es";
      const tileLayer = L.tileLayer(gmapTileUrl, {
        maxZoom: 20,
        minZoom: 6,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);

      leafletMapRef.current = map;
      tileLayerRef.current = tileLayer;
      markersLayerRef.current = markersGroup;
      setIsMapReady(true);
    }

    setupGoogleMap();

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Cambiar entre vista Google Maps Calles (lyrs=m) y Google Maps Satélite Híbrido (lyrs=y)
  useEffect(() => {
    if (!tileLayerRef.current) return;
    const lyrs = mapStyle === "hybrid" ? "y" : "m";
    tileLayerRef.current.setUrl(
      `https://mt1.google.com/vt/lyrs=${lyrs}&x={x}&y={y}&z={z}&hl=es`
    );
  }, [mapStyle]);

  // Renderizar los pines de los 6 primeros técnicos (+ actualizados) y ajustar vista automáticamente
  useEffect(() => {
    let cancelled = false;

    async function renderTechnicianMarkers() {
      if (!isMapReady || !leafletMapRef.current || !markersLayerRef.current)
        return;

      const L = (await import("leaflet")).default;
      if (cancelled || !leafletMapRef.current || !markersLayerRef.current)
        return;

      const map = leafletMapRef.current;
      const markersGroup = markersLayerRef.current;
      markersGroup.clearLayers();

      const boundsPoints: [number, number][] = [];

      mappedTechnicians.forEach((tech, index) => {
        const lat = Number(tech.coordenadas?.lat) || 10.258;
        const lng = Number(tech.coordenadas?.lng) || -67.595;
        boundsPoints.push([lat, lng]);

        const isSelected = activeTech?.id === tech.id;
        const rankLabel = tech.rankingVip ? `#${tech.rankingVip}` : `#${index + 1}`;
        const firstName = tech.nombre.split(" ")[0];

        const badgeHtml = `
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 5px 10px;
            border-radius: 9999px;
            font-weight: 800;
            font-size: 11px;
            white-space: nowrap;
            box-shadow: 0 6px 16px rgba(10, 37, 64, 0.32);
            border: 2px solid ${isSelected ? "#fbbf24" : "#ffffff"};
            background: ${
              isSelected
                ? "#0A2540"
                : "linear-gradient(135deg, #0A2540 0%, #0096C7 100%)"
            };
            color: #ffffff;
            transform: ${isSelected ? "scale(1.12)" : "scale(1)"};
            transition: all 0.2s ease;
            cursor: pointer;
          ">
            <span style="color: #fbbf24; font-weight: 900;">${rankLabel}</span>
            <span>${firstName}</span>
            <span style="background: rgba(255,255,255,0.18); padding: 1px 6px; border-radius: 999px; font-size: 10px;">
              $${tech.tarifaDiagnosticoUSD}
            </span>
          </div>
        `;

        const icon = L.divIcon({
          className: "jireh-gmap-pin",
          html: badgeHtml,
          iconSize: [120, 32],
          iconAnchor: [60, 16],
        });

        const marker = L.marker([lat, lng], { icon });
        marker.on("click", () => {
          setActiveTech(tech);
          map.flyTo([lat, lng], Math.max(map.getZoom(), 14), {
            duration: 0.6,
          });
        });

        marker.addTo(markersGroup);
      });

      // Ajustar encuadre para mostrar los técnicos en pantalla
      if (!activeTech) {
        if (selectedCity === "Maracay") {
          map.setView([10.261, -67.598], 13);
        } else if (selectedCity === "Valencia") {
          map.setView([10.2215, -68.012], 13);
        } else if (selectedCity === "Caracas") {
          map.setView([10.496, -66.853], 13);
        } else if (boundsPoints.length > 1) {
          const bounds = L.latLngBounds(boundsPoints);
          map.fitBounds(bounds, { padding: [38, 38], maxZoom: 13 });
        }
      }
    }

    renderTechnicianMarkers();

    return () => {
      cancelled = true;
    };
  }, [isMapReady, mappedTechnicians, selectedCity, activeTech]);

  const handleFocusTechnicianOnMap = (tech: TechnicianProfile) => {
    setActiveTech(tech);
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo(
        [tech.coordenadas.lat, tech.coordenadas.lng],
        15,
        { duration: 0.7 }
      );
    }
  };

  const getExternalGoogleMapsUrl = (tech: TechnicianProfile) => {
    const query = encodeURIComponent(
      `${tech.zonasCobertura[0] || ""}, ${tech.ciudad}, Venezuela`
    );
    return `https://www.google.com/maps/search/?api=1&query=${tech.coordenadas.lat},${tech.coordenadas.lng}&query_place_id=${query}`;
  };

  return (
    <div className="space-y-2.5">
      <div
        className={`relative w-full rounded-2xl overflow-hidden border border-slate-200/90 shadow-card bg-slate-100 ${
          compactPreview ? "h-64 sm:h-80" : "h-[480px] sm:h-[560px]"
        }`}
      >
        {/* Contenedor Real de Google Maps */}
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Píldora Superior Izquierda: Google Maps + Top 6 Técnicos */}
        <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-1.5 pointer-events-none">
          <div className="bg-[#0A2540]/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-md border border-white/15">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Google Maps • Top {mappedTechnicians.length} Técnicos</span>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 bg-white/95 backdrop-blur-md text-[#0A2540] px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm border border-slate-200">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Nuevas ubicaciones se suman al actualizar su perfil
          </span>
        </div>

        {/* Controles Superiores Derechos: Cambiar Vista Calles/Satélite + Ampliar */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              setMapStyle((prev) =>
                prev === "roadmap" ? "hybrid" : "roadmap"
              )
            }
            className="bg-white/95 hover:bg-white active:scale-95 text-[#0A2540] px-2.5 py-1.5 rounded-full text-[11px] font-extrabold shadow-md flex items-center gap-1 border border-slate-200 transition-all"
            title="Cambiar entre Mapa de Calles y Satélite de Google Maps"
          >
            <Layers className="w-3.5 h-3.5 text-[#0096C7]" />
            <span>{mapStyle === "roadmap" ? "Satélite" : "Calles"}</span>
          </button>

          {compactPreview && onExpandMap && (
            <button
              type="button"
              onClick={onExpandMap}
              className="bg-[#0A2540]/90 hover:bg-[#0A2540] active:scale-95 text-white px-3 py-1.5 rounded-full text-[11px] font-extrabold shadow-md flex items-center gap-1.5 border border-white/15 transition-all"
            >
              <Maximize2 className="w-3.5 h-3.5 text-[#00B4D8]" />
              <span>Ampliar</span>
            </button>
          )}
        </div>

        {/* Tarjeta Flotante al Seleccionar uno de los 6 Técnicos en Google Maps */}
        {activeTech && (
          <div className="absolute bottom-3 left-3 right-14 sm:right-auto sm:w-96 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-floating border border-cyan-200 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={activeTech.fotoUrl}
                alt={activeTech.nombre}
                className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-200"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                    #{activeTech.rankingVip || 1}
                  </span>
                  <p className="text-xs font-extrabold text-[#0A2540] truncate">
                    {activeTech.nombre}
                  </p>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00B4D8] shrink-0" />
                </div>
                <p className="text-[11px] text-slate-600 truncate">
                  📍 {activeTech.ciudad} •{" "}
                  {activeTech.zonasCobertura.slice(0, 2).join(", ")}
                </p>
                <div className="flex items-center gap-2 text-[11px] font-bold text-[#0096C7]">
                  <span>
                    ${activeTech.tarifaDiagnosticoUSD}{" "}
                    {activeTech.modalidadTarifa}
                  </span>
                  <span className="text-amber-500 flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {activeTech.calificacion.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onSelectTechnician(activeTech)}
                className="bg-[#00B4D8] hover:bg-[#0096C7] text-white text-[11px] font-extrabold px-2.5 py-1.5 rounded-xl transition-colors"
              >
                Ver Perfil
              </button>
              <a
                href={getExternalGoogleMapsUrl(activeTech)}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-100 hover:bg-slate-200 text-[#0A2540] text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center justify-center gap-1 transition-colors"
              >
                <Navigation className="w-2.5 h-2.5 text-[#0096C7]" />
                <span>Google Maps</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Selector Rápido de los 6 Primeros Técnicos en el Mapa */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-[11px] font-extrabold text-[#0A2540] shrink-0 mr-1 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-[#00B4D8]" />
          <span>Ubicar en Google Maps:</span>
        </span>
        {mappedTechnicians.map((tech, idx) => {
          const isSelected = activeTech?.id === tech.id;
          return (
            <button
              key={tech.id}
              type="button"
              onClick={() => handleFocusTechnicianOnMap(tech)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap border transition-all flex items-center gap-1.5 shrink-0 ${
                isSelected
                  ? "bg-[#0A2540] text-white border-[#0A2540] shadow-sm"
                  : "bg-white hover:bg-cyan-50 text-slate-700 border-slate-200"
              }`}
            >
              <span className="text-amber-500 font-black">
                #{tech.rankingVip || idx + 1}
              </span>
              <span>{tech.nombre.split(" ").slice(0, 2).join(" ")}</span>
              <span
                className={`text-[10px] ${
                  isSelected ? "text-cyan-200" : "text-slate-400"
                }`}
              >
                ({tech.ciudad})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
