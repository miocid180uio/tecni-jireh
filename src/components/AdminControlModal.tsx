"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  Award,
  Clock,
  Eye,
  EyeOff,
  Search,
  Lock,
  LogOut,
  Sparkles,
  Check,
  Mail,
  KeyRound,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  TechnicianProfile,
  TechnicianPublicationStatus,
} from "@/types/jireh";

const MASTER_ADMIN_EMAIL = "admin@jireh.com";

interface AdminControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  technicians: TechnicianProfile[];
  onUpdateTechnician: (
    techId: string,
    changes: Partial<TechnicianProfile>
  ) => void;
  onBulkPublishTopVip: () => void;
  onAdminSessionChange?: (isAuthenticatedAdmin: boolean) => void;
  onEditTechnicianData?: (cedula: string) => void;
}

export default function AdminControlModal({
  isOpen,
  onClose,
  technicians,
  onUpdateTechnician,
  onBulkPublishTopVip,
  onAdminSessionChange,
  onEditTechnicianData,
}: AdminControlModalProps) {
  // Estado de autenticación exclusivo para admin@jireh.com
  const [isAuthenticatedAdmin, setIsAuthenticatedAdmin] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Filtros de la Tabla de Control
  const [statusFilter, setStatusFilter] = useState<
    "todos" | TechnicianPublicationStatus
  >("todos");
  const [branchFilter, setBranchFilter] = useState<"Todas" | string>("Todas");
  const [searchFilter, setSearchFilter] = useState("");

  // Escuchar sesión real de Firebase Auth si ya inició sesión como admin@jireh.com
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const isMasterAdmin = Boolean(
        user && user.email && user.email.toLowerCase() === MASTER_ADMIN_EMAIL
      );
      setIsAuthenticatedAdmin(isMasterAdmin);
      onAdminSessionChange?.(isMasterAdmin);
    });
    return () => unsubscribe();
  }, [onAdminSessionChange]);

  if (!isOpen) return null;

  // Contadores de moderación
  const counts = {
    todos: technicians.length,
    publicado: technicians.filter(
      (t) => (t.estadoPublicacion || "publicado") === "publicado"
    ).length,
    pendiente: technicians.filter((t) => t.estadoPublicacion === "pendiente")
      .length,
    pausado: technicians.filter((t) => t.estadoPublicacion === "pausado")
      .length,
  };

  const filteredList = technicians.filter((tech) => {
    const currentStatus = tech.estadoPublicacion || "publicado";
    if (statusFilter !== "todos" && currentStatus !== statusFilter) {
      return false;
    }
    if (
      branchFilter !== "Todas" &&
      !(tech.sedeJireh || "").toLowerCase().includes(branchFilter.toLowerCase())
    ) {
      return false;
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return (
        tech.nombre.toLowerCase().includes(q) ||
        tech.cedula.toLowerCase().includes(q) ||
        tech.ciudad.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleLoginAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const normalizedEmail = emailInput.trim().toLowerCase();

    // Validación estricta: SOLO la cuenta admin@jireh.com tiene acceso a este dashboard
    if (normalizedEmail !== MASTER_ADMIN_EMAIL) {
      setAuthError(
        "Acceso denegado: Este Dashboard de Control es exclusivo para la cuenta principal admin@jireh.com."
      );
      return;
    }

    if (!passwordInput.trim()) {
      setAuthError("Por favor ingresa la contraseña de admin@jireh.com.");
      return;
    }

    setIsLoggingIn(true);
    try {
      if (auth) {
        await signInWithEmailAndPassword(auth, normalizedEmail, passwordInput);
        setIsAuthenticatedAdmin(true);
        onAdminSessionChange?.(true);
        setPasswordInput("");
      } else {
        setAuthError(
          "No se pudo conectar al servicio de autenticación de Firebase."
        );
      }
    } catch (err: any) {
      setAuthError(
        "Contraseña incorrecta para admin@jireh.com o credenciales no válidas."
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogoutAdmin = async () => {
    if (auth) {
      await signOut(auth);
    }
    setIsAuthenticatedAdmin(false);
    onAdminSessionChange?.(false);
    setPasswordInput("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A2540]/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[94vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera del Dashboard de Control Administrativo */}
        <div className="bg-gradient-to-r from-[#07192C] via-[#0A2540] to-[#12385E] p-5 text-white flex flex-wrap items-center justify-between gap-4 border-b border-cyan-500/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider bg-cyan-500/20 text-[#00B4D8] px-2.5 py-0.5 rounded-full border border-cyan-400/30">
                  Panel de Control • Administrador Principal
                </span>
                {isAuthenticatedAdmin && (
                  <span className="text-xs text-emerald-300 font-bold hidden sm:inline">
                    ● Sesión verificada: {MASTER_ADMIN_EMAIL}
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-black mt-0.5">
                Gobernanza y Publicación de Técnicos en TECNI JIREH
              </h2>
              <p className="text-xs text-slate-300">
                Acceso restringido exclusivamente para{" "}
                <strong className="text-amber-300">{MASTER_ADMIN_EMAIL}</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {isAuthenticatedAdmin && (
              <button
                type="button"
                onClick={handleLogoutAdmin}
                className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión Admin</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Si NO ha iniciado sesión como admin@jireh.com, mostrar pantalla de Login Estricto */}
        {!isAuthenticatedAdmin ? (
          <form
            onSubmit={handleLoginAdmin}
            className="p-8 max-w-md w-full mx-auto my-auto space-y-4"
          >
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-[#0A2540] text-amber-400 flex items-center justify-center mx-auto shadow-md">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-extrabold text-[#0A2540]">
                Acceso Exclusivo Administrador
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Este panel de control solo está disponible para la cuenta
                maestra{" "}
                <strong className="text-[#0A2540]">{MASTER_ADMIN_EMAIL}</strong>{" "}
                con su contraseña oficial de Refrigeraciones Jireh.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correo Administrador
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="admin@jireh.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contraseña de {MASTER_ADMIN_EMAIL}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                  />
                </div>
              </div>
            </div>

            {authError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 flex items-start gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0A2540] to-[#12385E] hover:from-[#12385E] hover:to-[#00B4D8] text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
            >
              {isLoggingIn ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              )}
              <span>Iniciar Sesión como {MASTER_ADMIN_EMAIL}</span>
            </button>
          </form>
        ) : (
          /* Si YA autenticó con admin@jireh.com, renderizar el Dashboard de Control Completo */
          <>
            <div className="bg-slate-50 border-b border-slate-200 p-4 space-y-3 shrink-0">
              {/* Tarjetas de Resumen de Estados */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => setStatusFilter("todos")}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    statusFilter === "todos"
                      ? "bg-[#0A2540] text-white border-[#0A2540] shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <p className="text-[11px] font-bold uppercase opacity-80">
                    Total Registrados
                  </p>
                  <p className="text-xl font-black mt-0.5">{counts.todos}</p>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter("publicado")}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    statusFilter === "publicado"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase">
                      Publicados (Visibles)
                    </p>
                    <Eye className="w-4 h-4" />
                  </div>
                  <p className="text-xl font-black mt-0.5">
                    {counts.publicado}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter("pendiente")}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    statusFilter === "pendiente"
                      ? "bg-amber-500 text-[#0A2540] border-amber-500 shadow-sm"
                      : "bg-white text-amber-800 border-amber-200 hover:bg-amber-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase">
                      Pendientes por Aprobar
                    </p>
                    <Clock className="w-4 h-4" />
                  </div>
                  <p className="text-xl font-black mt-0.5">
                    {counts.pendiente}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter("pausado")}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    statusFilter === "pausado"
                      ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                      : "bg-white text-rose-800 border-rose-200 hover:bg-rose-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase">
                      Ocultos / Pausados
                    </p>
                    <EyeOff className="w-4 h-4" />
                  </div>
                  <p className="text-xl font-black mt-0.5">{counts.pausado}</p>
                </button>
              </div>

              {/* Buscador + Filtro por Sede (Principal, Campo, Jabillos, Sucre) */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500 mr-1">
                    Filtrar Sede:
                  </span>
                  {["Todas", "Principal", "Campo", "Jabillos", "Sucre"].map(
                    (sede) => (
                      <button
                        key={sede}
                        type="button"
                        onClick={() => setBranchFilter(sede)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                          branchFilter === sede
                            ? "bg-[#00B4D8] text-white"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {sede === "Todas"
                          ? "Todas las Sedes"
                          : `Sede ${sede.toUpperCase()}`}
                      </button>
                    )
                  )}
                </div>

                <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-[240px]">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Buscar por nombre o CI/RUC..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de Control de Técnicos */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0A2540] text-white text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-3 text-center">#</th>
                      <th className="py-3 px-4">Técnico / Especialidad</th>
                      <th className="py-3 px-3">CI/RUC & Sede</th>
                      <th className="py-3 px-3">Puntos VIP</th>
                      <th className="py-3 px-3 text-center">Badge VIP</th>
                      <th className="py-3 px-3 text-center">
                        Estado en Cartelera
                      </th>
                      <th className="py-3 px-4 text-right">
                        Acción del Administrador
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {filteredList.map((tech, idx) => {
                      const status: TechnicianPublicationStatus =
                        tech.estadoPublicacion || "publicado";

                      return (
                        <tr
                          key={tech.id}
                          className={`transition-colors ${
                            status === "publicado"
                              ? "bg-white hover:bg-slate-50/80"
                              : status === "pendiente"
                              ? "bg-amber-50/60 hover:bg-amber-50"
                              : "bg-rose-50/40 hover:bg-rose-50/70 opacity-75"
                          }`}
                        >
                          <td className="py-3.5 px-3 text-center font-black text-slate-500">
                            {tech.rankingVip ? `#${tech.rankingVip}` : idx + 1}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={tech.fotoUrl}
                                alt={tech.nombre}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                              />
                              <div>
                                <div className="font-extrabold text-sm text-[#0A2540] flex items-center gap-1.5">
                                  <span>{tech.nombre}</span>
                                  {tech.esVipVerificado && (
                                    <ShieldCheck className="w-4 h-4 text-[#00B4D8]" />
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                                  <span>📍 {tech.ciudad}</span>
                                  <span>•</span>
                                  <span>${tech.tarifaDiagnosticoUSD} diag.</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <p className="font-mono font-bold text-[#0A2540]">
                              {tech.cedula}
                            </p>
                            <span className="inline-block mt-0.5 text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                              {tech.sedeJireh || "Sede Principal"}
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="bg-cyan-100 text-[#0096C7] font-extrabold px-2.5 py-1 rounded-full text-xs">
                                {tech.puntosJirehVip.toFixed(2)} PTS
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateTechnician(tech.id, {
                                  esVipVerificado: !tech.esVipVerificado,
                                })
                              }
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 transition-all ${
                                tech.esVipVerificado
                                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                                  : "bg-slate-100 text-slate-500 border border-slate-200"
                              }`}
                            >
                              <Award
                                className={`w-3.5 h-3.5 ${
                                  tech.esVipVerificado
                                    ? "text-amber-600"
                                    : "text-slate-400"
                                }`}
                              />
                              <span>
                                {tech.esVipVerificado ? "VIP Activo" : "Estándar"}
                              </span>
                            </button>
                          </td>

                          <td className="py-3.5 px-3 text-center">
                            {status === "publicado" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Publicado
                              </span>
                            )}
                            {status === "pendiente" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                                <Clock className="w-3 h-3 text-amber-600" />
                                Pendiente Revisión
                              </span>
                            )}
                            {status === "pausado" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                                <EyeOff className="w-3 h-3 text-rose-600" />
                                Oculto / Pausado
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              {onEditTechnicianData && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    onEditTechnicianData(tech.cedula);
                                  }}
                                  className="bg-cyan-50 hover:bg-cyan-100 text-[#0A2540] border border-cyan-200 font-bold text-xs px-2.5 py-1.5 rounded-xl transition-colors"
                                  title="Modificar o corregir datos del técnico"
                                >
                                  Corregir Datos
                                </button>
                              )}

                              {status !== "publicado" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateTechnician(tech.id, {
                                      estadoPublicacion: "publicado",
                                    })
                                  }
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Aprobar y Publicar</span>
                                </button>
                              )}

                              {status === "publicado" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateTechnician(tech.id, {
                                      estadoPublicacion: "pausado",
                                    })
                                  }
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors"
                                >
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>Ocultar de Web</span>
                                </button>
                              )}

                              {status === "pausado" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onUpdateTechnician(tech.id, {
                                      estadoPublicacion: "pendiente",
                                    })
                                  }
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-2.5 py-1.5 rounded-xl transition-colors"
                                >
                                  Mover a Pendiente
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer del Dashboard Administrativo */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-600 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00B4D8] shrink-0" />
                <span>
                  <strong>Regla activa:</strong> Los nuevos técnicos que llenen el
                  formulario entran en{" "}
                  <strong className="text-amber-700">Pendiente Revisión</strong>{" "}
                  hasta que <strong>{MASTER_ADMIN_EMAIL}</strong> los apruebe.
                </span>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onBulkPublishTopVip}
                  className="bg-[#00B4D8] hover:bg-[#0096C7] text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-colors"
                >
                  Publicar Todos los VIP
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-[#0A2540] hover:bg-[#12385E] text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors"
                >
                  Guardar y Volver a la Web
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
