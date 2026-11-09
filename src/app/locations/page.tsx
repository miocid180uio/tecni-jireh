"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Clock,
  MessageCircle,
  ExternalLink,
  Snowflake,
  Settings,
  Award,
  CheckCircle2,
  Navigation,
  ChevronDown,
  Building2,
  Wrench,
} from "lucide-react";

export interface JirehLocationBranch {
  id: "campo-alegre" | "sucre" | "los-jabillos";
  name: string;
  fullName: string;
  badge: string;
  address: string;
  mapUrl: string;
  phone: string;
  whatsapp: string;
  whatsappNumber: string;
  schedule: string;
}

export const REFRIJIREH_LOCATIONS: JirehLocationBranch[] = [
  {
    id: "campo-alegre",
    name: "Campo Alegre",
    fullName: "Sede Campo Alegre",
    badge: "Sede Principal • Mayor Stock",
    address:
      "Calle el Caro #13, prolongación Av. Bermúdez, sector Campo Alegre. Maracay",
    mapUrl: "https://maps.app.goo.gl/mhShtqPj38NzzFr28",
    phone: "+58 243-2345678",
    whatsapp: "+58 422-5504442",
    whatsappNumber: "584225504442",
    schedule: "Lun - Vie: 8:00 AM - 5:00 PM | Sáb: 8:00 AM - 1:00 PM",
  },
  {
    id: "sucre",
    name: "Sucre",
    fullName: "Sede Sucre",
    badge: "Sector El Hipódromo",
    address:
      "Edif. Capozzi Local 45B. Calle Sucre, sector El Hipódromo. Maracay",
    mapUrl: "https://maps.app.goo.gl/cSZmAoqWvPgsykPe8",
    phone: "+58 243-8765432",
    whatsapp: "+58 412-5013697",
    whatsappNumber: "584125013697",
    schedule: "Lun - Vie: 8:00 AM - 4:00 PM | Sáb: 8:00 AM - 1:00 PM",
  },
  {
    id: "los-jabillos",
    name: "Los Jabillos",
    fullName: "Sede Los Jabillos",
    badge: "Sector José Félix Ribas",
    address:
      "Av. Principal Los Jabillos, Sector José Félix Ribas. Maracay",
    mapUrl: "https://maps.app.goo.gl/gemZjPkPubvcesqD8",
    phone: "+58 243-0000000",
    whatsapp: "+58 412-7781151",
    whatsappNumber: "584127781151",
    schedule: "Lun - Vie: 8:00 AM - 5:00 PM | Sáb: 8:00 AM - 1:00 PM",
  },
];

function LocationsContent() {
  const searchParams = useSearchParams();
  const repuestoParam = searchParams.get("repuesto") || "";
  const equipoParam = searchParams.get("equipo") || "";
  const vipCodeParam = searchParams.get("vip_code") || "VIP-JIREH";
  const tecnicoParam = searchParams.get("tecnico") || "";

  const [selectedBranchId, setSelectedBranchId] = useState<
    JirehLocationBranch["id"]
  >("campo-alegre");

  const buildBranchWhatsappUrl = (branch: JirehLocationBranch) => {
    const lines = [
      `¡Hola *Refrigeraciones Jireh (${branch.fullName})*! ❄️⚙️`,
      `Vengo desde *TECNI JIREH* (tecni.refrijireh.com) para cotizar un repuesto:`,
      repuestoParam ? `• *Repuesto:* ${repuestoParam}` : null,
      equipoParam ? `• *Equipo / Capacidad:* ${equipoParam}` : null,
      tecnicoParam ? `• *Técnico asignado:* ${tecnicoParam}` : null,
      vipCodeParam ? `• *Código Beneficio VIP:* ${vipCodeParam}` : null,
      ``,
      `¿Tienen disponibilidad en *${branch.fullName}*?`,
    ]
      .filter(Boolean)
      .join("\n");

    return `https://wa.me/${branch.whatsappNumber}?text=${encodeURIComponent(
      lines
    )}`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
      {/* Cabecera Compacta con Botón de Regreso a la Página Principal */}
      <header className="bg-gradient-to-r from-[#0A2540] via-[#0D3156] to-[#0096C7] text-white shadow-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-3.5 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 active:scale-95 text-white font-extrabold text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-white/20 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-[#00B4D8]" />
            <span>Volver a Técnicos</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-xl bg-white/10 border border-white/25 flex items-center justify-center">
              <Settings className="w-4 h-4 text-[#00B4D8] animate-spin-slow" />
              <Snowflake className="w-2.5 h-2.5 text-white absolute" />
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-1">
                <span className="text-sm sm:text-base font-black tracking-tight text-white">
                  REFRI
                </span>
                <span className="text-sm sm:text-base font-black tracking-tight text-[#00B4D8]">
                  JIREH
                </span>
              </div>
              <p className="text-[10px] text-cyan-100 -mt-1">
                Nuestras 3 Sedes Oficiales
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal Compacto: Las 3 Sedes Visibles sin Desplazar */}
      <main className="max-w-5xl mx-auto w-full px-3.5 sm:px-6 py-4 sm:py-6 flex-1 flex flex-col justify-center gap-3.5">
        {/* Banner Superior Resumido */}
        <div className="bg-gradient-to-r from-[#0A2540] to-[#12385E] rounded-2xl p-3.5 sm:p-4 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border border-cyan-500/30">
          <div>
            <div className="flex items-center gap-1.5 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" />
              <span>Ubícanos • Ventas y Repuestos RefriJireh</span>
            </div>
            <h1 className="text-base sm:text-lg font-extrabold mt-0.5">
              Selecciona una de nuestras 3 Sedes para Cotizar por WhatsApp
            </h1>
            <p className="text-[11px] sm:text-xs text-cyan-100">
              Haz clic en cualquiera de las 3 sucursales para ver su información
              y contactar directo a ventas.
            </p>
          </div>

          {repuestoParam && (
            <div className="bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-xs shrink-0 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-300 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-cyan-200 uppercase font-bold">
                  Cotizando ({vipCodeParam}):
                </p>
                <p className="font-bold text-white truncate max-w-[200px]">
                  {repuestoParam}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Botones Rápidos de las 3 Sedes (Siempre visibles de un vistazo) */}
        <div className="grid grid-cols-3 gap-2">
          {REFRIJIREH_LOCATIONS.map((branch) => {
            const isSelected = selectedBranchId === branch.id;
            return (
              <button
                key={branch.id}
                type="button"
                onClick={() => setSelectedBranchId(branch.id)}
                className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-[#0A2540] text-white border-[#00B4D8] shadow-md scale-[1.01]"
                    : "bg-white text-[#0A2540] border-slate-200 hover:border-cyan-300"
                }`}
              >
                <div className="flex items-center justify-between gap-1 w-full">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      isSelected
                        ? "bg-[#00B4D8]/25 text-cyan-200"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    Sede
                  </span>
                  <CheckCircle2
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isSelected ? "text-amber-400" : "text-slate-300"
                    }`}
                  />
                </div>
                <div className="mt-1.5">
                  <p className="text-xs sm:text-sm font-black leading-tight truncate">
                    {branch.name}
                  </p>
                  <p
                    className={`text-[10px] sm:text-[11px] font-semibold truncate mt-0.5 ${
                      isSelected ? "text-emerald-300" : "text-emerald-600"
                    }`}
                  >
                    {branch.whatsapp}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Vista en Escritorio (Las 3 tarjetas completas lado a lado sin desplazar)
            y en Móvil (Acordeón compacto donde las 3 sedes están en pantalla y la seleccionada muestra todos los detalles) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {REFRIJIREH_LOCATIONS.map((branch) => {
            const isExpanded = selectedBranchId === branch.id;
            return (
              <div
                key={branch.id}
                onClick={() => setSelectedBranchId(branch.id)}
                className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between cursor-pointer ${
                  isExpanded
                    ? "border-[#00B4D8] ring-2 ring-[#00B4D8]/20 shadow-card"
                    : "border-slate-200/90 shadow-sm hover:border-cyan-300"
                }`}
              >
                {/* Cabecera de cada Sede */}
                <div className="p-3.5 sm:p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isExpanded
                            ? "bg-[#0A2540] text-[#00B4D8]"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-sm sm:text-base font-black text-[#0A2540] truncate">
                          {branch.fullName}
                        </h2>
                        <p className="text-[11px] font-semibold text-[#0096C7] truncate">
                          {branch.badge}
                        </p>
                      </div>
                    </div>

                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 md:hidden transition-transform ${
                        isExpanded ? "rotate-180 text-[#00B4D8]" : ""
                      }`}
                    />
                  </div>

                  {/* Detalles desplegables en móvil al tocar la sede (y siempre visibles en escritorio) */}
                  <div
                    className={`${
                      isExpanded ? "block" : "hidden md:block"
                    } space-y-2.5 pt-1 border-t border-slate-100`}
                  >
                    <p className="text-xs text-slate-600 leading-snug">
                      📍 {branch.address}
                    </p>

                    <div className="bg-slate-50 rounded-xl p-2.5 space-y-1.5 border border-slate-100">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                        <Clock className="w-3.5 h-3.5 text-[#0096C7] shrink-0" />
                        <span>{branch.schedule}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-700">
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>WhatsApp: {branch.whatsapp}</span>
                      </div>
                    </div>

                    {/* Botones de Acción de la Sede */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2 pt-1">
                      <a
                        href={buildBranchWhatsappUrl(branch)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
                      >
                        <MessageCircle className="w-4 h-4 shrink-0" />
                        <span>Cotizar por WhatsApp ({branch.name})</span>
                      </a>

                      <a
                        href={branch.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="w-full py-2 px-3 rounded-xl bg-[#0A2540] hover:bg-[#12385E] active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Navigation className="w-3.5 h-3.5 text-[#00B4D8] shrink-0" />
                        <span>Ver en Google Maps</span>
                        <ExternalLink className="w-3 h-3 opacity-75" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Botón Inferior de Regreso a la Página Principal de TECNI JIREH */}
        <div className="pt-1 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-[#0A2540] border border-slate-300 font-extrabold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-[#0096C7]" />
            <span>Volver atrás a la Página Principal (tecni.refrijireh.com)</span>
          </Link>

          <a
            href="https://www.refrijireh.com/catalog"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-[#0096C7] hover:underline"
          >
            <span>Ver catálogo online completo</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </main>
    </div>
  );
}

export default function LocationsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A2540] text-white flex flex-col items-center justify-center gap-3">
          <Snowflake className="w-9 h-9 text-[#00B4D8] animate-spin" />
          <p className="text-xs font-bold">Cargando Sedes RefriJireh...</p>
        </div>
      }
    >
      <LocationsContent />
    </Suspense>
  );
}
