"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  Wrench,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Award,
  CheckCircle2,
  ShoppingBag,
} from "lucide-react";
import { TechnicianProfile } from "@/types/jireh";
import { buildRefriJirehPartQuoteLinks } from "@/services/jirehVipService";

interface SparePartQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedTech?: TechnicianProfile | null;
}

const COMMON_SPARE_PARTS = [
  "Compresor Embraco / GMCC",
  "Gas Refrigerante R410A / R134a",
  "Capacitor de Marcha / Arranque",
  "Tarjeta Universal Aire Split",
  "Motor Ventilador / Turbina",
  "Controlador Digital / Bimetal",
];

export default function SparePartQuoteModal({
  isOpen,
  onClose,
  preselectedTech,
}: SparePartQuoteModalProps) {
  const [repuesto, setRepuesto] = useState(
    "Compresor / Repuesto de Refrigeración"
  );
  const [equipo, setEquipo] = useState("Split 18.000 BTU / Nevera No Frost");
  const [ciudad, setCiudad] = useState(preselectedTech?.ciudad || "Maracay");
  const [codigoVipManual, setCodigoVipManual] = useState(
    preselectedTech?.codigoVipRefriJireh || ""
  );

  if (!isOpen) return null;

  const codigoActivo =
    preselectedTech?.codigoVipRefriJireh ||
    codigoVipManual.trim() ||
    "VIP-TECNIJIREH";

  const links = buildRefriJirehPartQuoteLinks({
    tecnicoNombre: preselectedTech?.nombre,
    codigoVip: codigoActivo,
    cedula: preselectedTech?.cedula,
    repuesto,
    equipo,
    ciudad,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-[#0A2540]/75 backdrop-blur-sm p-3 sm:p-4 pb-20 md:pb-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[calc(100vh-5.5rem)] sm:max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera Corporativa RefriJireh */}
        <div className="bg-gradient-to-r from-[#0A2540] via-[#12385E] to-[#0096C7] p-4 sm:p-5 text-white relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-1.5 rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-amber-300 text-xs font-extrabold uppercase tracking-wider mb-1">
            <ShoppingBag className="w-4 h-4" />
            <span>Sincronización Tienda Oficial refrijireh.com</span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold">
            Cotizar Repuesto en RefriJireh
          </h3>
          <p className="text-xs text-cyan-100 mt-1">
            Cotiza el repuesto exacto para tu reparación vinculando el código del
            Técnico VIP para aplicar beneficios y acumular puntos en el{" "}
            <strong className="text-white">Club VIP Jireh</strong>.
          </p>
        </div>

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Banner de Código VIP Vinculado */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-700 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase text-amber-800">
                  {preselectedTech
                    ? `Técnico Asignado: ${preselectedTech.nombre}`
                    : "Código de Beneficio VIP Jireh"}
                </p>
                <p className="text-xs text-slate-600">
                  Suma puntos y activa atención preferencial en mostrador o
                  delivery.
                </p>
              </div>
            </div>
            <span className="bg-[#0A2540] text-amber-300 font-mono font-extrabold text-xs px-3 py-1.5 rounded-xl shrink-0">
              {codigoActivo}
            </span>
          </div>

          {/* Selección rápida de repuestos */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Repuestos Frecuentes en Stock:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_SPARE_PARTS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setRepuesto(item)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-medium border transition-colors ${
                    repuesto === item
                      ? "bg-[#00B4D8] text-white border-[#00B4D8]"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Campos del Repuesto */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ¿Qué repuesto o material necesitas cotizar?
              </label>
              <input
                type="text"
                value={repuesto}
                onChange={(e) => setRepuesto(e.target.value)}
                placeholder="Ej: Compresor Embraco 1/4 HP R134a, Tarjeta Split..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Marca / Capacidad del Equipo
                </label>
                <input
                  type="text"
                  value={equipo}
                  onChange={(e) => setEquipo(e.target.value)}
                  placeholder="Ej: Split 18.000 BTU / Nevera LG"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sede / Ciudad de Despacho
                </label>
                <select
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                >
                  <option value="Maracay">Maracay (Sede Principal)</option>
                  <option value="Valencia">Valencia</option>
                  <option value="Caracas">Caracas</option>
                </select>
              </div>
            </div>

            {!preselectedTech && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Código VIP o Cédula del Técnico (Opcional)
                </label>
                <input
                  type="text"
                  value={codigoVipManual}
                  onChange={(e) => setCodigoVipManual(e.target.value)}
                  placeholder="Ej: VIP-CM2850 o V-16845230"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                />
              </div>
            )}
          </div>

          {/* Botones de Acción hacia Página Interna de Sedes (/locations) y Web Oficial */}
          <div className="pt-2 space-y-2.5">
            <Link
              href={links.whatsappUrl}
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Cotizar por WhatsApp de Ventas RefriJireh</span>
            </Link>

            <a
              href={links.webUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-[#0A2540] hover:bg-[#12385E] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <ShoppingBag className="w-4 h-4 text-[#00B4D8]" />
              <span>Abrir Catálogo Web en www.refrijireh.com</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
