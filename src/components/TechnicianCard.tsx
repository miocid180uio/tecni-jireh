"use client";

import React from "react";
import {
  Star,
  MapPin,
  ShieldCheck,
  Clock,
  Award,
  Wrench,
  MessageCircle,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { TechnicianProfile } from "@/types/jireh";

interface TechnicianCardProps {
  technician: TechnicianProfile;
  onSelect: (tech: TechnicianProfile) => void;
  onQuotePart: (tech: TechnicianProfile) => void;
  compact?: boolean;
}

export default function TechnicianCard({
  technician,
  onSelect,
  onQuotePart,
  compact = false,
}: TechnicianCardProps) {
  const handleQuickWhatsapp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = `¡Hola *${technician.nombre}*! Te vi en *TECNI JIREH* (${technician.ciudad}) como Técnico ${
      technician.esVipVerificado ? "VIP Verificado Jireh ❄️" : ""
    }. Necesito apoyo técnico con un equipo de refrigeración.`;
    const phone = technician.telefonoWhatsapp.replace(/\D/g, "");
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div
      onClick={() => onSelect(technician)}
      className={`group relative bg-white rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between ${
        technician.esVipVerificado
          ? "border-cyan-200/80 shadow-card hover:shadow-floating hover:-translate-y-1"
          : "border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      {/* Cintillo Superior VIP optimizado para Smartphone */}
      {technician.esVipVerificado && (
        <div className="bg-gradient-to-r from-[#0A2540] via-[#0e355c] to-[#00B4D8] px-3 sm:px-3.5 py-1.5 flex items-center justify-between gap-1.5 text-white text-[10px] sm:text-[11px] font-semibold tracking-wide">
          <span className="flex items-center gap-1 min-w-0 truncate">
            <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate font-bold">
              {technician.rankingVip
                ? `TOP #${technician.rankingVip} • TÉCNICO VIP JIREH`
                : "TÉCNICO VIP VERIFICADO"}
            </span>
          </span>
          <span className="bg-amber-400/20 text-amber-300 border border-amber-300/40 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] font-extrabold whitespace-nowrap shrink-0">
            {technician.puntosJirehVip.toFixed(2)} PTS •{" "}
            {technician.nivelVip || "VIP"}
          </span>
        </div>
      )}

      <div>
        {/* Imagen Estilo Airbnb + Badges Flotantes */}
        <div
          className={`relative w-full overflow-hidden bg-slate-100 ${
            compact ? "h-44" : "h-48 sm:h-52"
          }`}
        >
          <img
            src={technician.fotoUrl}
            alt={technician.nombre}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A2540]/85 via-[#0A2540]/20 to-black/15" />

          {/* Badge Superior Izquierdo con Cédula / Sede */}
          {technician.sedeJireh && (
            <div className="absolute top-2.5 left-2.5 max-w-[62%]">
              <span className="block truncate bg-[#0A2540]/85 backdrop-blur-md text-cyan-200 border border-white/15 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm">
                {technician.sedeJireh} • CI: {technician.cedula}
              </span>
            </div>
          )}

          {/* Badge Superior Derecho (Verificado / Rápido) */}
          <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1">
            {technician.insigniaRapida && (
              <span
                className={`px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] font-bold shadow-md backdrop-blur-md flex items-center gap-1 ${
                  technician.insigniaRapida === "Verificado" ||
                  technician.insigniaRapida === "Top VIP"
                    ? "bg-emerald-500/95 text-white"
                    : "bg-[#00B4D8]/95 text-white"
                }`}
              >
                <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                {technician.insigniaRapida}
              </span>
            )}

            {technician.disponibleUrgenciasHoy && (
              <span className="bg-white/95 text-[#0A2540] px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                ~{technician.tiempoRespuestaMin} min
              </span>
            )}
          </div>

          {/* Ciudad y Zonas sobre la parte baja de la foto */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between gap-2 text-white">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-[11px] font-medium text-cyan-200 truncate">
                <MapPin className="w-3 h-3 text-[#00B4D8] shrink-0" />
                <span className="truncate">
                  {technician.ciudad} •{" "}
                  {technician.zonasCobertura.slice(0, 2).join(", ")}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold leading-tight flex items-center gap-1 mt-0.5 truncate">
                <span className="truncate">{technician.nombre}</span>
                {technician.esVipVerificado && (
                  <ShieldCheck className="w-4 h-4 text-[#00B4D8] fill-white shrink-0" />
                )}
              </h3>
            </div>

            <div className="bg-white/95 text-[#0A2540] px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-md font-bold text-xs shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{technician.calificacion.toFixed(1)}</span>
              <span className="text-slate-400 font-normal text-[10px]">
                ({technician.totalResenas})
              </span>
            </div>
          </div>
        </div>

        {/* Contenido de la Tarjeta */}
        <div className="p-3.5 sm:p-4">
          <p className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-[#0096C7] mb-1 line-clamp-1">
            {technician.etiquetaDestacada}
          </p>

          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-2.5">
            {technician.bio}
          </p>

          {/* Chips de Zonas y Puntos VIP */}
          <div className="flex flex-wrap items-center gap-1.5">
            {technician.zonasCobertura.slice(0, 2).map((zona) => (
              <span
                key={zona}
                className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
              >
                {zona}
              </span>
            ))}
            {technician.esVipVerificado && (
              <span className="text-[11px] bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                {technician.puntosJirehVip.toFixed(2)} Puntos VIP
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer con Tarifa + Acciones Táctiles para Smartphone */}
      <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-2.5 border-t border-slate-100 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-lg font-extrabold text-[#0A2540]">
              ${technician.tarifaDiagnosticoUSD}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-500 ml-1">
              {technician.modalidadTarifa}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuotePart(technician);
            }}
            className="text-[11px] font-bold text-[#0A2540] hover:text-[#0096C7] bg-cyan-50 hover:bg-cyan-100/80 active:scale-95 border border-cyan-200/80 px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-all"
            title="Cotizar repuesto en RefriJireh con el código VIP de este técnico"
          >
            <Wrench className="w-3.5 h-3.5 text-[#00B4D8] shrink-0" />
            <span>Cotizar Repuesto</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(technician);
            }}
            className="w-full py-3 sm:py-2.5 px-3 rounded-xl font-extrabold text-xs bg-gradient-to-r from-[#00B4D8] to-[#0096C7] hover:from-[#0096C7] hover:to-[#0A2540] active:scale-[0.98] text-white shadow-sm transition-all flex items-center justify-center gap-1.5"
          >
            <span>Reservar / Ver</span>
          </button>

          <button
            type="button"
            onClick={handleQuickWhatsapp}
            className="w-full py-3 sm:py-2.5 px-3 rounded-xl font-extrabold text-xs bg-[#0A2540] hover:bg-[#12385E] active:scale-[0.98] text-white shadow-sm transition-all flex items-center justify-center gap-1.5"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#00B4D8] shrink-0" />
            <span>Contactar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
