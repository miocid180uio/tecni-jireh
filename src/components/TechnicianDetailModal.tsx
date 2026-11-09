"use client";

import React, { useState } from "react";
import {
  X,
  Star,
  MapPin,
  ShieldCheck,
  Award,
  Clock,
  CheckCircle2,
  MessageCircle,
  Wrench,
  ExternalLink,
  Calendar,
  Sparkles,
  PhoneCall,
  Lock,
  KeyRound,
} from "lucide-react";
import { TechnicianProfile, JirehVipClient } from "@/types/jireh";
import { buildRefriJirehPartQuoteLinks } from "@/services/jirehVipService";

interface TechnicianDetailModalProps {
  technician: TechnicianProfile | null;
  onClose: () => void;
  onOpenPartQuoteModal: (tech: TechnicianProfile) => void;
  isMasterAdminLogged?: boolean;
  authenticatedVipClient?: JirehVipClient | null;
  onRequestEditTechnician?: (cedula: string) => void;
}

export default function TechnicianDetailModal({
  technician,
  onClose,
  onOpenPartQuoteModal,
  isMasterAdminLogged = false,
  authenticatedVipClient = null,
  onRequestEditTechnician,
}: TechnicianDetailModalProps) {
  const [problemaCliente, setProblemaCliente] = useState(
    "Mi equipo no enfría adecuadamente y requiero diagnóstico técnico"
  );
  const [zonaCliente, setZonaCliente] = useState(
    technician?.zonasCobertura[0] || ""
  );
  const [urgenciaSeleccionada, setUrgenciaSeleccionada] = useState<
    "Hoy Mismo (Urgente)" | "Mañana" | "Programar Visita"
  >("Hoy Mismo (Urgente)");

  if (!technician) return null;

  // Determinar cuál de los 3 Modos de Visualización aplica para este técnico:
  // Modo 3: Cuenta maestra admin@jireh.com
  // Modo 2: El propio técnico autenticado en Firebase con su correo y clave
  // Modo 1: Visitante no registrado o un usuario/técnico distinto (Solo Consulta)
  const isOwnTechnicianProfile = Boolean(
    authenticatedVipClient &&
      authenticatedVipClient.cedula.replace(/\D/g, "") ===
        technician.cedula.replace(/\D/g, "")
  );

  const detailAccessMode: 1 | 2 | 3 = isMasterAdminLogged
    ? 3
    : isOwnTechnicianProfile
    ? 2
    : 1;

  const handleDirectWhatsappBooking = () => {
    const phone = technician.telefonoWhatsapp.replace(/\D/g, "");
    const texto = [
      `¡Hola *${technician.nombre}*! ❄️⚙️`,
      `Te contacto desde la plataforma *TECNI JIREH* (${technician.ciudad}).`,
      technician.esVipVerificado
        ? `Vi tu insignia *Técnico VIP Verificado Jireh* (${technician.puntosJirehVip} pts - Cód: ${technician.codigoVipRefriJireh}).`
        : null,
      ``,
      `📋 *Solicitud de Servicio:*`,
      `• *Falla / Equipo:* ${problemaCliente}`,
      `• *Ubicación:* ${zonaCliente || technician.ciudad}`,
      `• *Disponibilidad requerida:* ${urgenciaSeleccionada}`,
      `• *Tarifa base vista en App:* $${technician.tarifaDiagnosticoUSD} (${technician.modalidadTarifa})`,
      ``,
      `¿Tienes disponibilidad para atender este servicio?`,
    ]
      .filter(Boolean)
      .join("\n");

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(texto)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const quickRefriJirehLinks = buildRefriJirehPartQuoteLinks({
    tecnicoNombre: technician.nombre,
    codigoVip: technician.codigoVipRefriJireh,
    cedula: technician.cedula,
    ciudad: technician.ciudad,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0A2540]/70 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera con Foto y Perfil */}
        <div className="relative h-56 sm:h-64 w-full shrink-0 bg-[#0A2540]">
          <img
            src={technician.fotoUrl}
            alt={technician.nombre}
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A2540] via-[#0A2540]/45 to-transparent" />

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {technician.esVipVerificado && (
            <div className="absolute top-4 left-4 bg-gradient-to-r from-amber-400 to-amber-500 text-[#0A2540] px-3 py-1 rounded-full text-xs font-extrabold shadow-lg flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              <span>
                TÉCNICO VIP VERIFICADO JIREH • {technician.puntosJirehVip} PTS
              </span>
            </div>
          )}

          <div className="absolute bottom-4 left-5 right-5 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 text-xs text-cyan-300 font-semibold">
                <MapPin className="w-3.5 h-3.5" />
                <span>
                  {technician.ciudad} • {technician.anosExperiencia} años de
                  experiencia
                </span>
              </div>
              <h2 className="text-2xl font-extrabold flex items-center gap-2 mt-0.5">
                {technician.nombre}
                {technician.esVipVerificado && (
                  <ShieldCheck className="w-6 h-6 text-[#00B4D8] fill-white" />
                )}
              </h2>
              <p className="text-xs sm:text-sm text-slate-200">
                {technician.etiquetaDestacada}
              </p>
            </div>

            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl px-3.5 py-2 flex items-center gap-3 self-start sm:self-end">
              <div>
                <div className="flex items-center gap-1 text-amber-300 font-bold text-sm">
                  <Star className="w-4 h-4 fill-amber-300" />
                  <span>{technician.calificacion.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-slate-200">
                  {technician.totalResenas} reseñas
                </p>
              </div>
              <div className="h-7 w-px bg-white/20" />
              <div>
                <p className="text-sm font-extrabold text-white">
                  ${technician.tarifaDiagnosticoUSD}
                </p>
                <p className="text-[10px] text-cyan-200">
                  {technician.modalidadTarifa}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cuerpo Scrollable */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Barra de Control de Modo de Visualización (Modo 1, 2 o 3) */}
          {detailAccessMode === 1 && (
            <div className="bg-slate-100 border border-slate-200/90 rounded-2xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>
                  <strong>Modo Solo Consulta:</strong> Ficha protegida contra modificaciones por terceros.
                </span>
              </div>
              {onRequestEditTechnician && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRequestEditTechnician(technician.cedula);
                  }}
                  className="text-[#0A2540] hover:text-[#0096C7] font-extrabold underline flex items-center gap-1"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>¿Eres este técnico o Admin? Corregir datos</span>
                </button>
              )}
            </div>
          )}

          {detailAccessMode === 2 && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-900 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Modo 2 Activo: Estás viendo tu propio perfil autenticado en Firebase.
                </span>
              </div>
              {onRequestEditTechnician && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRequestEditTechnician(technician.cedula);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl transition-colors"
                >
                  Modificar / Corregir mis Datos
                </button>
              )}
            </div>
          )}

          {detailAccessMode === 3 && (
            <div className="bg-amber-50 border border-amber-400 rounded-2xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-[#0A2540] font-bold">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Modo 3 Maestro (admin@jireh.com): Edición de datos habilitada.
                </span>
              </div>
              {onRequestEditTechnician && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRequestEditTechnician(technician.cedula);
                  }}
                  className="bg-[#0A2540] hover:bg-[#12385E] text-amber-300 font-bold px-3 py-1.5 rounded-xl transition-colors"
                >
                  Editar / Corregir Datos del Técnico
                </button>
              )}
            </div>
          )}

          {/* Bloque de Respaldo Ecosistema Jireh */}
          {technician.esVipVerificado && (
            <div className="bg-gradient-to-r from-[#0A2540] to-[#12385E] rounded-2xl p-4 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-cyan-500/30">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Respaldo Oficial Refrigeraciones Jireh</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  Este técnico es miembro{" "}
                  <strong className="text-white">{technician.nivelVip}</strong> en{" "}
                  <span className="underline decoration-cyan-400">
                    clientes-jireh-vip.vercel.app
                  </span>{" "}
                  y utiliza repuestos originales adquiridos en nuestras sedes.
                </p>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenPartQuoteModal(technician)}
                  className="flex-1 sm:flex-initial bg-[#00B4D8] hover:bg-[#0096C7] text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-colors"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Cotizar Repuesto en RefriJireh</span>
                </button>
              </div>
            </div>
          )}

          {/* Descripción y Zonas */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#0A2540] uppercase tracking-wider">
              Sobre el Técnico
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {technician.bio}
            </p>

            <div className="grid grid-cols-3 gap-2.5 pt-2">
              <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 text-center">
                <p className="text-base font-extrabold text-[#0A2540]">
                  +{technician.trabajosCompletados}
                </p>
                <p className="text-[11px] text-slate-500">Servicios Éxitosos</p>
              </div>
              <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 text-center">
                <p className="text-base font-extrabold text-[#0096C7]">
                  ~{technician.tiempoRespuestaMin} min
                </p>
                <p className="text-[11px] text-slate-500">Tiempo Respuesta</p>
              </div>
              <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 text-center">
                <p className="text-base font-extrabold text-emerald-600">
                  Garantía
                </p>
                <p className="text-[11px] text-slate-500">Repuestos Jireh</p>
              </div>
            </div>

            <div className="pt-1">
              <p className="text-xs font-semibold text-slate-500 mb-2">
                Zonas de Cobertura Inmediata en {technician.ciudad}:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {technician.zonasCobertura.map((zona) => (
                  <span
                    key={zona}
                    onClick={() => setZonaCliente(zona)}
                    className={`text-xs px-3 py-1 rounded-full font-medium cursor-pointer transition-colors ${
                      zonaCliente === zona
                        ? "bg-[#0A2540] text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    📍 {zona}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Galería de Trabajos Recientes */}
          {technician.portafolioFotos.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-sm font-bold text-[#0A2540] uppercase tracking-wider">
                Trabajos Recientes Verificados
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {technician.portafolioFotos.map((foto, i) => (
                  <div
                    key={i}
                    className="relative rounded-xl overflow-hidden border border-slate-200 h-36 group"
                  >
                    <img
                      src={foto.url}
                      alt={foto.titulo}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex items-end p-2.5">
                      <p className="text-xs font-medium text-white">
                        {foto.titulo}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formulario Rápido para Prellenar Solicitud por WhatsApp */}
          <div className="bg-cyan-50/70 border border-cyan-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0A2540] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#00B4D8]" />
                <span>Reservar / Solicitar Visita por WhatsApp</span>
              </h3>
              <span className="text-xs font-bold text-[#0096C7]">
                Sin comisiones ocultas
              </span>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ¿Qué falla presenta tu equipo o qué servicio necesitas?
                </label>
                <input
                  type="text"
                  value={problemaCliente}
                  onChange={(e) => setProblemaCliente(e.target.value)}
                  placeholder="Ej: Mi nevera Samsung no congela / Mantenimiento Split 18.000 BTU"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Urbanización / Sector en {technician.ciudad}
                  </label>
                  <input
                    type="text"
                    value={zonaCliente}
                    onChange={(e) => setZonaCliente(e.target.value)}
                    placeholder="Ej: Base Aragua / El Viñedo / Chacao"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ¿Para cuándo lo necesitas?
                  </label>
                  <select
                    value={urgenciaSeleccionada}
                    onChange={(e) =>
                      setUrgenciaSeleccionada(e.target.value as any)
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] bg-white"
                  >
                    <option value="Hoy Mismo (Urgente)">
                      ⚡ Hoy Mismo (Urgencia)
                    </option>
                    <option value="Mañana">📅 Para Mañana</option>
                    <option value="Programar Visita">
                      🕒 Programar esta semana
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Reseñas de Clientes */}
          {technician.resenasDestacadas.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-sm font-bold text-[#0A2540] uppercase tracking-wider">
                Opiniones de Clientes en {technician.ciudad}
              </h3>
              <div className="space-y-2.5">
                {technician.resenasDestacadas.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-slate-50 border border-slate-200/70 rounded-xl p-3.5"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span className="font-bold text-xs text-[#0A2540]">
                          {rev.autor}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-2">
                          • {rev.zona}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-amber-500">
                        {"★".repeat(rev.calificacion)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 italic">
                      &ldquo;{rev.comentario}&rdquo;
                    </p>
                    <p className="text-[10px] text-[#0096C7] font-semibold mt-1.5">
                      Servicio: {rev.servicioRealizado} ({rev.fecha})
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Fijo con Botones de Acción */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleDirectWhatsappBooking}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Contactar a {technician.nombre} por WhatsApp</span>
          </button>

          <a
            href={quickRefriJirehLinks.webUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto py-3 px-4 rounded-xl bg-[#0A2540] hover:bg-[#12385E] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Wrench className="w-4 h-4 text-[#00B4D8]" />
            <span>Tienda RefriJireh ({quickRefriJirehLinks.codigoAplicado})</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-75" />
          </a>
        </div>
      </div>
    </div>
  );
}
