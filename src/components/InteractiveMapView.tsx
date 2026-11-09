"use client";

import React, { useState, useRef } from "react";
import {
  Star,
  ShieldCheck,
  Award,
  MessageCircle,
  X,
  Maximize2,
  Plus,
  Minus,
  RotateCcw,
} from "lucide-react";
import { TechnicianProfile, JirehCity } from "@/types/jireh";

interface InteractiveMapViewProps {
  technicians: TechnicianProfile[];
  selectedCity: JirehCity;
  onSelectTechnician: (tech: TechnicianProfile) => void;
  compactPreview?: boolean;
  onExpandMap?: () => void;
}

/**
 * Calcula una posición bien distribuida en el mapa para evitar que los pines
 * se amontonen uno encima de otro en pantallas móviles.
 */
function getWellSpacedCoords(index: number, total: number, fallbackX: number, fallbackY: number) {
  if (total <= 6) {
    const preset6 = [
      { x: 24, y: 34 },
      { x: 72, y: 30 },
      { x: 48, y: 52 },
      { x: 26, y: 72 },
      { x: 74, y: 68 },
      { x: 52, y: 26 },
    ];
    return preset6[index % preset6.length];
  }
  // Distribución en espiral áurea suave dentro del área segura [16%..84%]
  const goldenAngle = index * 2.39996;
  const radius = Math.min(34, 10 + Math.sqrt(index + 1) * 5.6);
  const x = Math.max(15, Math.min(85, Math.round(50 + Math.cos(goldenAngle) * radius * 1.15)));
  const y = Math.max(20, Math.min(82, Math.round(52 + Math.sin(goldenAngle) * radius * 0.95)));
  return { x: x || fallbackX, y: y || fallbackY };
}

export default function InteractiveMapView({
  technicians,
  selectedCity,
  onSelectTechnician,
  compactPreview = false,
  onExpandMap,
}: InteractiveMapViewProps) {
  const [activePinTech, setActivePinTech] = useState<TechnicianProfile | null>(
    technicians[0] || null
  );

  // Estado de Zoom y Desplazamiento (Pan) para gestos táctiles y botones +/-
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const pinchDistanceRef = useRef<number | null>(null);
  const pinchInitialZoomRef = useRef<number>(1);

  const cityLabel =
    selectedCity === "Todas"
      ? "Maracay • Valencia • Caracas"
      : `Radar: ${selectedCity}`;

  // Cantidad inteligente de pines visibles según el nivel de zoom para que nunca se sature en móvil
  const maxPinsForZoom = compactPreview
    ? zoom < 1.35
      ? 6
      : zoom < 1.9
      ? 12
      : 24
    : zoom < 1.3
    ? 12
    : zoom < 1.8
    ? 24
    : 36;

  const pinsToRender = technicians.slice(0, maxPinsForZoom);

  const clampPan = (nx: number, ny: number, currentZoom: number) => {
    const maxOffset = (currentZoom - 1) * 180 + 40;
    return {
      x: Math.max(-maxOffset, Math.min(maxOffset, nx)),
      y: Math.max(-maxOffset, Math.min(maxOffset, ny)),
    };
  };

  const handleZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom((prev) => Math.min(3.2, Number((prev + 0.45).toFixed(2))));
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom((prev) => {
      const next = Math.max(1, Number((prev - 0.45).toFixed(2)));
      if (next === 1) setPan({ x: 0, y: 0 });
      else setPan((p) => clampPan(p.x, p.y, next));
      return next;
    });
  };

  const handleResetView = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // --- Gestos Táctiles Smartphone (1 dedo arrastrar / 2 dedos pellizcar para acercar o alejar) ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchDistanceRef.current = Math.hypot(dx, dy);
      pinchInitialZoomRef.current = zoom;
      dragStartRef.current = null;
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        panX: pan.x,
        panY: pan.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchDistanceRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / Math.max(1, pinchDistanceRef.current);
      const nextZoom = Math.max(1, Math.min(3.2, Number((pinchInitialZoomRef.current * ratio).toFixed(2))));
      setZoom(nextZoom);
      if (nextZoom === 1) setPan({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && dragStartRef.current) {
      const dx = e.touches[0].clientX - dragStartRef.current.x;
      const dy = e.touches[0].clientY - dragStartRef.current.y;
      setPan(clampPan(dragStartRef.current.panX + dx, dragStartRef.current.panY + dy, zoom));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    dragStartRef.current = null;
    pinchDistanceRef.current = null;
  };

  // --- Soporte de Arrastre y Rueda con Mouse en Escritorio ---
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan(clampPan(dragStartRef.current.panX + dx, dragStartRef.current.panY + dy, zoom));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.25 : -0.25;
    setZoom((prev) => {
      const next = Math.max(1, Math.min(3.2, Number((prev + delta).toFixed(2))));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-200/90 shadow-card bg-[#E8EEF5] select-none touch-none ${
        compactPreview ? "h-56 sm:h-64" : "h-[460px] sm:h-[560px]"
      } ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Lienzo Transformable con Zoom y Desplazamiento (Pan) */}
      <div
        className="w-full h-full relative transition-transform duration-75 ease-out origin-center"
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
        }}
      >
        {/* Fondo de Mapa Vectorial Estilizado (Calles, Avenidas y Manzanas) */}
        <svg
          className="w-full h-full object-cover pointer-events-none"
          viewBox="0 0 800 500"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern
              id="cityGrid"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <rect width="60" height="60" fill="#EDF2F7" />
              <path
                d="M 60 0 L 0 0 0 60"
                fill="none"
                stroke="#DCE4EE"
                strokeWidth="2"
              />
            </pattern>
            <radialGradient id="radarPulse" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00B4D8" stopOpacity="0.26" />
              <stop offset="70%" stopColor="#00B4D8" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#00B4D8" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width="800" height="500" fill="url(#cityGrid)" />

          {/* Zonas Verdes */}
          <path
            d="M0,0 L320,0 L270,110 L90,140 L0,90 Z"
            fill="#D4EED8"
            opacity="0.7"
          />
          <path
            d="M580,320 L800,290 L800,500 L520,500 Z"
            fill="#D4EED8"
            opacity="0.65"
          />
          <circle cx="400" cy="250" r="145" fill="url(#radarPulse)" />

          {/* Avenidas Principales */}
          <path
            d="M -20 320 Q 260 240 450 220 T 820 120"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="14"
          />
          <path
            d="M -20 160 Q 300 200 520 280 T 820 410"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="12"
          />
          <path
            d="M 240 -20 L 310 520"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="10"
          />
          <path
            d="M 550 -20 L 460 520"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="10"
          />

          {/* Autopista Regional del Centro */}
          <path
            d="M -20 390 Q 340 290 820 190"
            fill="none"
            stroke="#FDE68A"
            strokeWidth="10"
          />
          <path
            d="M -20 390 Q 340 290 820 190"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="1.5"
            strokeDasharray="8 8"
          />
        </svg>

        {/* Punto Azul Central "Tu Ubicación" */}
        <div
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: "50%", top: "50%" }}
        >
          <div className="w-10 h-10 rounded-full bg-[#00B4D8]/25 animate-pulse flex items-center justify-center">
            <div className="w-3.5 h-3.5 rounded-full bg-[#00B4D8] border-2 border-white shadow-md" />
          </div>
        </div>

        {/* Pines Interactivos Bien Distribuidos (Escalan inversamente al zoom para no solaparse) */}
        {pinsToRender.map((tech, idx) => {
          const isSelected = activePinTech?.id === tech.id;
          const pos = getWellSpacedCoords(
            idx,
            pinsToRender.length,
            tech.coordenadas.mapX,
            tech.coordenadas.mapY
          );

          return (
            <button
              key={tech.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActivePinTech(tech);
                if (compactPreview) {
                  onSelectTechnician(tech);
                }
              }}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: `translate(-50%, -50%) scale(${Math.max(
                  0.62,
                  1 / Math.pow(zoom, 0.65)
                )})`,
              }}
              className={`absolute transition-transform duration-150 ${
                isSelected ? "z-30" : "z-20 hover:z-30"
              }`}
            >
              <div
                className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full font-extrabold text-[11px] shadow-md flex items-center gap-1 border-2 whitespace-nowrap ${
                  isSelected
                    ? "bg-[#0A2540] text-white border-amber-400 scale-110"
                    : tech.esVipVerificado
                    ? "bg-[#00B4D8] text-white border-white"
                    : "bg-white text-[#0A2540] border-slate-200"
                }`}
              >
                {tech.esVipVerificado && (
                  <Award
                    className={`w-3 h-3 shrink-0 ${
                      isSelected ? "text-amber-400" : "text-amber-200"
                    }`}
                  />
                )}
                <span>${tech.tarifaDiagnosticoUSD}</span>
                <span className="text-[10px] opacity-95">
                  ★{tech.calificacion.toFixed(1)}
                </span>
              </div>
              <div
                className={`w-2 h-2 rotate-45 mx-auto -mt-1 ${
                  isSelected
                    ? "bg-[#0A2540]"
                    : tech.esVipVerificado
                    ? "bg-[#00B4D8]"
                    : "bg-white"
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Etiqueta Superior Izquierda Compacta y Elegante */}
      <div className="absolute top-2.5 left-2.5 z-30 flex items-center gap-1.5 bg-[#0A2540]/90 backdrop-blur-md text-white px-2.5 py-1 rounded-full shadow-md border border-white/15 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-[#00B4D8] animate-ping shrink-0" />
        <span className="text-[11px] font-bold truncate max-w-[165px] sm:max-w-none">
          {cityLabel}
        </span>
        <span className="text-[10px] bg-cyan-500/25 text-cyan-200 font-extrabold px-1.5 py-0.2 rounded-full">
          {pinsToRender.length}/{technicians.length}
        </span>
      </div>

      {/* Botón Superior Derecho para Ampliar Mapa */}
      {onExpandMap && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onExpandMap();
          }}
          className="absolute top-2.5 right-2.5 z-30 bg-white/95 hover:bg-white text-[#0A2540] px-2.5 py-1 rounded-full shadow-md border border-slate-200/80 active:scale-95 flex items-center gap-1 text-[11px] font-extrabold"
          title="Ampliar vista de mapa"
        >
          <Maximize2 className="w-3.5 h-3.5 text-[#00B4D8]" />
          <span>{compactPreview ? "Ampliar" : "Lista"}</span>
        </button>
      )}

      {/* Controles Táctiles de Zoom (+ / - / Reset) en el borde derecho */}
      <div className="absolute bottom-3 right-2.5 z-30 flex flex-col gap-1 bg-white/95 backdrop-blur-md p-1 rounded-2xl shadow-md border border-slate-200/90">
        <button
          type="button"
          onClick={handleZoomIn}
          aria-label="Acercar mapa"
          className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-cyan-50 active:scale-90 text-[#0A2540] flex items-center justify-center font-bold transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          aria-label="Alejar mapa"
          className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-cyan-50 active:scale-90 text-[#0A2540] flex items-center justify-center font-bold transition-all"
        >
          <Minus className="w-4 h-4" />
        </button>
        {zoom > 1 && (
          <button
            type="button"
            onClick={handleResetView}
            aria-label="Restablecer zoom"
            className="w-8 h-8 rounded-xl bg-amber-50 hover:bg-amber-100 active:scale-90 text-amber-800 flex items-center justify-center font-bold transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Indicador inferior izquierdo de ayuda táctil */}
      {compactPreview && (
        <div className="absolute bottom-2.5 left-2.5 z-30 bg-white/90 backdrop-blur-sm text-slate-600 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-slate-200/80 pointer-events-none">
          {zoom > 1
            ? `Zoom ${zoom.toFixed(1)}x • Arrastra para mover`
            : "Pellizca o usa + / - para acercar"}
        </div>
      )}

      {/* Tarjeta Flotante Inferior cuando se selecciona un Pin en Vista Mapa Completa */}
      {!compactPreview && activePinTech && (
        <div className="absolute bottom-3 left-3 right-14 sm:left-auto sm:right-14 sm:w-96 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-floating border border-cyan-200/80 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start gap-3">
            <img
              src={activePinTech.fotoUrl}
              alt={activePinTech.nombre}
              className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0096C7] flex items-center gap-1 truncate">
                  {activePinTech.esVipVerificado && (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  )}
                  {activePinTech.esVipVerificado
                    ? `VIP ${activePinTech.nivelVip} (${activePinTech.puntosJirehVip} pts)`
                    : "Técnico Registrado"}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePinTech(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h4 className="font-bold text-sm text-[#0A2540] truncate">
                {activePinTech.nombre}
              </h4>
              <p className="text-xs text-slate-500 truncate">
                {activePinTech.etiquetaDestacada}
              </p>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-[#0A2540]">
                    ${activePinTech.tarifaDiagnosticoUSD}
                  </span>
                  <span className="text-xs font-bold text-amber-600 flex items-center gap-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {activePinTech.calificacion.toFixed(1)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTechnician(activePinTech);
                  }}
                  className="bg-[#00B4D8] hover:bg-[#0096C7] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-colors flex items-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Ver / Reservar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
