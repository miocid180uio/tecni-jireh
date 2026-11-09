"use client";

import React, { useState } from "react";
import {
  MapPin,
  Star,
  Navigation,
  ShieldCheck,
  Award,
  MessageCircle,
  X,
  Compass,
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
  const [activePinTech, setActivePinTech] = useState<TechnicianProfile | null>(
    technicians[0] || null
  );

  const cityLabel =
    selectedCity === "Todas"
      ? "Cobertura Nacional (Maracay • Valencia • Caracas)"
      : `Radar Técnico Activo: ${selectedCity}`;

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-200/90 shadow-card bg-[#E8EEF5] select-none ${
        compactPreview ? "h-56 sm:h-64" : "h-[480px] sm:h-[560px]"
      }`}
    >
      {/* Fondo de Mapa Vectorial Estilizado (Calles, Avenidas y Manzanas) */}
      <svg
        className="w-full h-full object-cover"
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
            <stop offset="0%" stopColor="#00B4D8" stopOpacity="0.28" />
            <stop offset="70%" stopColor="#00B4D8" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#00B4D8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Cuadrícula urbana */}
        <rect width="800" height="500" fill="url(#cityGrid)" />

        {/* Parques / Zonas Verdes (ej. Henri Pittier / Parque del Este / Casupo) */}
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
        <circle cx="420" cy="240" r="145" fill="url(#radarPulse)" />

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

        {/* Autopista Regional del Centro (Destacada en Amarillo Suave) */}
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

      {/* Etiquetas de Referencia Geográfica */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-sm border border-slate-200/80">
        <span className="w-2.5 h-2.5 rounded-full bg-[#00B4D8] animate-ping" />
        <span className="text-xs font-bold text-[#0A2540]">{cityLabel}</span>
        <span className="text-[11px] bg-cyan-50 text-[#0096C7] font-semibold px-2 py-0.5 rounded-full">
          {technicians.length} disponibles
        </span>
      </div>

      {/* Botón de centrar / expandir igual al mockup */}
      {onExpandMap && (
        <button
          type="button"
          onClick={onExpandMap}
          className="absolute top-3 right-3 z-10 bg-white/95 hover:bg-white text-[#0A2540] p-2 rounded-xl shadow-md border border-slate-200/80 transition-transform active:scale-95 flex items-center gap-1.5 text-xs font-bold"
          title="Cambiar vista de mapa"
        >
          <Compass className="w-4 h-4 text-[#00B4D8]" />
          <span className="hidden sm:inline">
            {compactPreview ? "Ampliar Mapa" : "Centrar Radar"}
          </span>
        </button>
      )}

      {/* Punto Azul Central "Tu Ubicación" */}
      <div
        className="absolute z-10 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ left: "50%", top: "48%" }}
      >
        <div className="w-12 h-12 rounded-full bg-[#00B4D8]/25 animate-pulse flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-[#00B4D8] border-2 border-white shadow-md" />
        </div>
      </div>

      {/* Pines Interactivos de los Técnicos (Con Tarifa y Badge VIP) */}
      {technicians.map((tech) => {
        const isSelected = activePinTech?.id === tech.id;
        return (
          <button
            key={tech.id}
            type="button"
            onClick={() => {
              setActivePinTech(tech);
              if (compactPreview) {
                onSelectTechnician(tech);
              }
            }}
            style={{
              left: `${tech.coordenadas.mapX}%`,
              top: `${tech.coordenadas.mapY}%`,
            }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ${
              isSelected ? "z-30 scale-110" : "z-20 hover:scale-110"
            }`}
          >
            <div
              className={`px-2.5 py-1 rounded-full font-extrabold text-xs shadow-lg flex items-center gap-1 border-2 transition-colors ${
                isSelected
                  ? "bg-[#0A2540] text-white border-amber-400"
                  : tech.esVipVerificado
                  ? "bg-[#00B4D8] text-white border-white"
                  : "bg-white text-[#0A2540] border-slate-200"
              }`}
            >
              {tech.esVipVerificado && (
                <Award
                  className={`w-3.5 h-3.5 ${
                    isSelected ? "text-amber-400" : "text-amber-200"
                  }`}
                />
              )}
              <span>${tech.tarifaDiagnosticoUSD}</span>
              <span className="text-[10px] opacity-90 flex items-center">
                ★{tech.calificacion.toFixed(1)}
              </span>
            </div>
            {/* Triángulo inferior del Pin */}
            <div
              className={`w-2.5 h-2.5 rotate-45 mx-auto -mt-1.5 ${
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

      {/* Tarjeta Flotante Inferior cuando se selecciona un Pin en Vista Mapa Completa */}
      {!compactPreview && activePinTech && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-floating border border-cyan-200/80 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start gap-3">
            <img
              src={activePinTech.fotoUrl}
              alt={activePinTech.nombre}
              className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0096C7] flex items-center gap-1">
                  {activePinTech.esVipVerificado && (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  )}
                  {activePinTech.esVipVerificado
                    ? `VIP ${activePinTech.nivelVip} (${activePinTech.puntosJirehVip} pts)`
                    : "Técnico Registrado"}
                </span>
                <button
                  type="button"
                  onClick={() => setActivePinTech(null)}
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
                    ${activePinTech.tarifaDiagnosticoUSD}{" "}
                    <span className="text-[11px] font-normal text-slate-500">
                      diagnóstico
                    </span>
                  </span>
                  <span className="text-xs font-bold text-amber-600 flex items-center gap-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {activePinTech.calificacion.toFixed(1)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectTechnician(activePinTech)}
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
