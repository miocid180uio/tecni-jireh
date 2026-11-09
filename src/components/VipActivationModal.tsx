"use client";

import React, { useState } from "react";
import {
  X,
  Award,
  Search,
  CheckCircle2,
  UserCheck,
  UserPlus,
  AlertCircle,
  Loader2,
  User,
  CreditCard,
  Phone,
  MapPin,
  Mail,
  Lock,
  Wrench,
  Building2,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import {
  JirehVipClient,
  ServiceCategoryId,
  TechnicianProfile,
  JirehAccountRole,
  JirehBranch,
  JirehCity,
} from "@/types/jireh";
import {
  findVipClientByCedulaOrPhone,
  authenticateExistingVipUser,
  activateVipTechnicianProfile,
  registerNewJirehEcosystemMember,
} from "@/services/jirehVipService";
import { SERVICE_CATEGORIES, MOCK_VIP_CLIENTS } from "@/lib/firebase";

interface VipActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileActivated: (
    newTech: TechnicianProfile,
    customMessage?: string
  ) => void;
  initialTab?: "validate" | "register";
  isMasterAdminLogged?: boolean;
  authenticatedVipClient?: JirehVipClient | null;
  onUserAuthenticated?: (
    client: JirehVipClient,
    isMasterAdmin: boolean
  ) => void;
  presetCedulaToLoad?: string | null;
}

export default function VipActivationModal({
  isOpen,
  onClose,
  onProfileActivated,
  initialTab = "validate",
  isMasterAdminLogged = false,
  authenticatedVipClient = null,
  onUserAuthenticated,
  presetCedulaToLoad = null,
}: VipActivationModalProps) {
  const [activeTab, setActiveTab] = useState<"validate" | "register">(
    initialTab
  );

  // =========================================================================
  // ESTADO PESTAÑA 1: CONSULTA (MODO 1) Y EDICIÓN AUTORIZADA (MODO 2 Y 3)
  // =========================================================================
  const [verifyMode, setVerifyMode] = useState<"cedula" | "login">("cedula");
  const [identifierInput, setIdentifierInput] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLegacyPass, setShowLegacyPass] = useState(false);

  const [isSearching, setIsSearching] = useState(false);
  const [foundVip, setFoundVip] = useState<JirehVipClient | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [legacyUserOnlySuccess, setLegacyUserOnlySuccess] =
    useState<JirehVipClient | null>(null);

  // Sesión verificada en Firebase (Titular o admin@jireh.com)
  const [verifiedOwnerSession, setVerifiedOwnerSession] =
    useState<JirehVipClient | null>(authenticatedVipClient);
  const [localMasterAdmin, setLocalMasterAdmin] =
    useState<boolean>(isMasterAdminLogged);

  // Nuevos campos a completar o corregir (sin tocar points ni totalSpent)
  const [updateTelefono, setUpdateTelefono] = useState("");
  const [updateCiudad, setUpdateCiudad] =
    useState<Exclude<JirehCity, "Todas">>("Maracay");
  const [updateSede, setUpdateSede] = useState<JirehBranch>("Principal");
  const [updateTipoCuenta, setUpdateTipoCuenta] =
    useState<JirehAccountRole>("tecnico");
  const [selectedCategories, setSelectedCategories] = useState<
    ServiceCategoryId[]
  >(["split", "neveras"]);
  const [zonasText, setZonasText] = useState(
    "Las Delicias, Base Aragua, El Limón, Centro"
  );
  const [etiquetaDestacada, setEtiquetaDestacada] = useState(
    "Especialista en Refrigeración & Aires Split"
  );
  const [tarifaDiagnostico, setTarifaDiagnostico] = useState(15);
  const [bio, setBio] = useState("");
  const [urgenciasHoy, setUrgenciasHoy] = useState(true);
  const [isActivating, setIsActivating] = useState(false);

  // =========================================================================
  // ESTADO PESTAÑA 2: NUEVO REGISTRO COMPLETO EN EL ECOSISTEMA JIREH VIP
  // =========================================================================
  const [regNombre, setRegNombre] = useState("");
  const [regCedula, setRegCedula] = useState("");
  const [regTelefono, setRegTelefono] = useState("");
  const [regDireccion, setRegDireccion] = useState("");
  const [regCiudad, setRegCiudad] =
    useState<Exclude<JirehCity, "Todas">>("Maracay");
  const [regSede, setRegSede] = useState<JirehBranch>("Principal");
  const [regTipoCuenta, setRegTipoCuenta] =
    useState<JirehAccountRole>("tecnico");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [regCategories, setRegCategories] = useState<ServiceCategoryId[]>([
    "split",
    "neveras",
  ]);
  const [regEspecialidadTitulo, setRegEspecialidadTitulo] = useState(
    "Instalación y Reparación de Aires Split & Neveras"
  );
  const [regTarifa, setRegTarifa] = useState(15);
  const [regExperiencia, setRegExperiencia] = useState(5);
  const [regUrgencias, setRegUrgencias] = useState(true);

  const [isRegistering, setIsRegistering] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccessUserOnly, setRegSuccessUserOnly] =
    useState<JirehVipClient | null>(null);

  React.useEffect(() => {
    setLocalMasterAdmin(isMasterAdminLogged);
  }, [isMasterAdminLogged]);

  React.useEffect(() => {
    if (authenticatedVipClient) {
      setVerifiedOwnerSession(authenticatedVipClient);
    }
  }, [authenticatedVipClient]);

  React.useEffect(() => {
    if (isOpen && presetCedulaToLoad) {
      setActiveTab("validate");
      setIdentifierInput(presetCedulaToLoad);
      findVipClientByCedulaOrPhone(presetCedulaToLoad).then((res) => {
        if (res) populateLegacyClientFields(res);
      });
    }
  }, [isOpen, presetCedulaToLoad]);

  if (!isOpen) return null;

  // =========================================================================
  // CÁLCULO ESTRICTO DE LOS 3 MODOS DE VISUALIZACIÓN Y PERMISOS:
  // Modo 1: Solo Consulta (Sin opción de modificar) -> Usuario no registrado o usuario distinto
  // Modo 2: Edición Propia -> Titular ingresó con su propio correo y clave registrados en Firebase
  // Modo 3: Edición Maestra -> Cuenta administradora admin@jireh.com
  // =========================================================================
  const isAdminActive = isMasterAdminLogged || localMasterAdmin;
  const activeOwner = verifiedOwnerSession || authenticatedVipClient;
  const isOwnAuthenticatedProfile = Boolean(
    foundVip &&
      activeOwner &&
      (activeOwner.cedula.replace(/\D/g, "") ===
        foundVip.cedula.replace(/\D/g, "") ||
        activeOwner.id === foundVip.id)
  );

  const accessMode: 1 | 2 | 3 = isAdminActive
    ? 3
    : isOwnAuthenticatedProfile
    ? 2
    : 1;

  const canModifyData = accessMode === 2 || accessMode === 3;

  const populateLegacyClientFields = (result: JirehVipClient) => {
    setFoundVip(result);
    setLegacyUserOnlySuccess(null);
    setUpdateTelefono(result.telefono || "+58412");
    setUpdateCiudad(result.ciudad || "Maracay");
    setUpdateSede(result.sedeFrecuente || "Principal");
    setUpdateTipoCuenta(result.tipoCuenta || "tecnico");
    setBio(
      `Técnico certificado y miembro ${
        result.nivelVip
      } del Club VIP Refrigeraciones Jireh (${result.puntosAcumulados.toFixed(
        2
      )} pts). Especialista en diagnóstico preciso con repuestos originales en ${
        result.ciudad
      }.`
    );
    if (result.direccion) {
      setZonasText(result.direccion);
    } else if (result.ciudad === "Valencia") {
      setZonasText("El Viñedo, Naguanagua, San Diego, Prebo");
    } else if (result.ciudad === "Caracas") {
      setZonasText("Chacao, Altamira, Las Mercedes, Los Jabillos");
    } else {
      setZonasText("Las Delicias, Base Aragua, Calicanto, El Limón");
    }
  };

  // --- Búsqueda por Cédula (Modo 1 por defecto: Solo Consulta, salvo que sea admin@jireh.com o ya haya autenticado esa misma cédula) ---
  const handleLookupVip = async (e?: React.FormEvent, presetCedula?: string) => {
    if (e) e.preventDefault();
    const queryValue = presetCedula ?? identifierInput;
    if (!queryValue.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const result = await findVipClientByCedulaOrPhone(queryValue);
      if (result) {
        populateLegacyClientFields(result);
      } else {
        setFoundVip(null);
        setSearchError(
          "No encontramos esa cédula en el Club VIP Jireh. Si aún no estás registrado, cambia a la pestaña 'Soy Nuevo (Crear Cuenta VIP)' arriba."
        );
      }
    } catch {
      setSearchError("Ocurrió un error al consultar la base de datos VIP.");
    } finally {
      setIsSearching(false);
    }
  };

  // --- Autenticación segura en Firebase por Correo + Clave (Activa Modo 2 para el propio titular o Modo 3 para admin@jireh.com) ---
  const handleLegacyLoginVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    try {
      const { client, isMasterAdmin } = await authenticateExistingVipUser(
        loginEmail,
        loginPassword,
        foundVip?.cedula || identifierInput
      );

      if (isMasterAdmin) {
        setLocalMasterAdmin(true);
      } else {
        setVerifiedOwnerSession(client);
      }

      onUserAuthenticated?.(client, isMasterAdmin);
      populateLegacyClientFields(client);
      setLoginPassword("");
    } catch (err: any) {
      setSearchError(
        err?.message ||
          "Correo o contraseña incorrectos en Firebase. Solo el titular con su correo y clave registrados o admin@jireh.com pueden desbloquear la modificación de datos."
      );
    } finally {
      setIsSearching(false);
    }
  };

  const toggleCategory = (
    catId: ServiceCategoryId,
    list: ServiceCategoryId[],
    setter: React.Dispatch<React.SetStateAction<ServiceCategoryId[]>>
  ) => {
    if (catId === "todos" || !canModifyData) return;
    setter(
      list.includes(catId) ? list.filter((c) => c !== catId) : [...list, catId]
    );
  };

  // --- Guardar modificación / enriquecimiento (BLOQUEADO si está en Modo 1 Solo Consulta) ---
  const handleCompleteActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundVip || !canModifyData) return;

    setIsActivating(true);
    try {
      const zonasArray = zonasText
        .split(",")
        .map((z) => z.trim())
        .filter(Boolean);

      const createdProfile = await activateVipTechnicianProfile({
        vipClient: foundVip,
        telefonoWhatsapp: updateTelefono,
        direccionCompleta: zonasText,
        ciudad: updateCiudad,
        sedeFrecuente: updateSede,
        tipoCuenta: updateTipoCuenta,
        zonasCobertura: zonasArray,
        especialidades: selectedCategories,
        etiquetaDestacada,
        tarifaDiagnosticoUSD: Number(tarifaDiagnostico) || 15,
        bio,
        disponibleUrgenciasHoy: urgenciasHoy,
      });

      if (updateTipoCuenta === "usuario") {
        setLegacyUserOnlySuccess({
          ...foundVip,
          telefono: updateTelefono,
          ciudad: updateCiudad,
          sedeFrecuente: updateSede,
          direccion: zonasText,
          tipoCuenta: "usuario",
        });
      } else {
        onProfileActivated(
          createdProfile,
          accessMode === 3
            ? `¡Datos corregidos por Administrador (admin@jireh.com) para ${
                foundVip.nombreCompleto
              }! Sus ${foundVip.puntosAcumulados.toFixed(
                2
              )} PTS permanecen intactos.`
            : `¡Ficha VIP actualizada con éxito por su titular (${
                foundVip.nombreCompleto
              })! Tus ${foundVip.puntosAcumulados.toFixed(
                2
              )} PTS están 100% protegidos.`
        );
        onClose();
      }
    } finally {
      setIsActivating(false);
    }
  };

  // --- Lógica Pestaña 2: Formulario de Nuevo Registro ---
  const handleNewRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccessUserOnly(null);

    if (
      !regNombre.trim() ||
      !regCedula.trim() ||
      !regTelefono.trim() ||
      !regDireccion.trim() ||
      !regEmail.trim() ||
      regPassword.length < 6
    ) {
      setRegError(
        "Por favor completa todos los campos obligatorios. La clave de acceso al sistema de puntos debe tener al menos 6 caracteres."
      );
      return;
    }

    setIsRegistering(true);
    try {
      const { vipClient, technicianProfile } =
        await registerNewJirehEcosystemMember({
          nombreCompleto: regNombre,
          cedula: regCedula,
          telefono: regTelefono,
          direccion: regDireccion,
          ciudad: regCiudad,
          sedeFrecuente: regSede,
          tipoCuenta: regTipoCuenta,
          email: regEmail,
          password: regPassword,
          especialidades: regCategories,
          etiquetaDestacada: regEspecialidadTitulo,
          tarifaDiagnosticoUSD: Number(regTarifa) || 15,
          anosExperiencia: Number(regExperiencia) || 5,
          disponibleUrgenciasHoy: regUrgencias,
        });

      setVerifiedOwnerSession(vipClient);
      onUserAuthenticated?.(vipClient, false);

      if (regTipoCuenta === "tecnico" && technicianProfile) {
        onProfileActivated(
          technicianProfile,
          `¡Registro recibido, ${vipClient.nombreCompleto}! Tu cuenta de puntos (CI: ${vipClient.cedula}) fue creada con todos los nuevos campos y tu perfil técnico quedó en "Pendiente de Aprobación" para el Administrador.`
        );
        onClose();
      } else {
        setRegSuccessUserOnly(vipClient);
      }
    } catch (err: any) {
      setRegError(
        err?.message || "No se pudo completar el registro. Intenta nuevamente."
      );
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A2540]/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[94vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera con Selector de Pestañas */}
        <div className="bg-gradient-to-r from-[#0A2540] via-[#0e3358] to-[#00B4D8] p-5 text-white relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-1.5 rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-amber-300 text-xs font-extrabold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>Ecosistema de Puntos & Técnicos • Refrigeraciones Jireh</span>
          </div>
          <h2 className="text-xl font-extrabold">
            {activeTab === "validate"
              ? "Consulta y Actualización Segura de Ficha VIP"
              : "Registro Oficial en Club Jireh VIP & Tecni Jireh"}
          </h2>
          <p className="text-xs text-cyan-100 mt-1">
            {activeTab === "validate"
              ? "La búsqueda por cédula está en Modo Solo Consulta. Para modificar o corregir datos debes autenticarte con tu propio correo y clave de Firebase o como admin@jireh.com."
              : "Crea tu cuenta de acceso al sistema de puntos VIP con todos tus datos completos."}
          </p>

          {/* Tabs: Ya soy Cliente VIP (Consultar / Completar Datos) vs Soy Nuevo */}
          <div className="grid grid-cols-2 gap-2 mt-4 bg-[#07192C]/60 p-1.5 rounded-2xl border border-white/15">
            <button
              type="button"
              onClick={() => {
                setActiveTab("validate");
                setRegError(null);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "validate"
                  ? "bg-white text-[#0A2540] shadow-md"
                  : "text-cyan-100 hover:bg-white/10"
              }`}
            >
              <UserCheck className="w-4 h-4 text-[#00B4D8]" />
              <span>Ya soy Usuario VIP (Consultar / Editar)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("register");
                setSearchError(null);
              }}
              className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === "register"
                  ? "bg-amber-400 text-[#0A2540] shadow-md"
                  : "text-amber-200 hover:bg-white/10"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Soy Nuevo (Crear Cuenta VIP)</span>
            </button>
          </div>
        </div>

        {/* Cuerpo Scrollable según la Pestaña Activa */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {activeTab === "validate" ? (
            <>
              {/* Selector de modo: 1) Consultar por Cédula (Solo Lectura) vs 2) Autenticar con Correo y Clave Firebase (Habilitar Edición) */}
              <div className="flex items-center justify-between gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setVerifyMode("cedula");
                    setSearchError(null);
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    verifyMode === "cedula"
                      ? "bg-white text-[#0A2540] shadow-sm"
                      : "text-slate-600 hover:text-[#0A2540]"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 text-[#0096C7]" />
                  <span>1. Consultar por Cédula (Solo Lectura)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVerifyMode("login");
                    setSearchError(null);
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    verifyMode === "login"
                      ? "bg-[#0A2540] text-white shadow-sm"
                      : "text-slate-600 hover:text-[#0A2540]"
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>2. Correo y Clave Firebase (Modificar Datos)</span>
                </button>
              </div>

              {verifyMode === "cedula" ? (
                <form onSubmit={(e) => handleLookupVip(e)} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#0A2540] uppercase tracking-wider">
                      Consultar Ficha por Cédula (CI/RUC)
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {isAdminActive
                        ? "🛡️ Sesión Admin Activa: Edición Habilitada"
                        : "👁️ Modo Solo Consulta"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={identifierInput}
                        onChange={(e) => setIdentifierInput(e.target.value)}
                        placeholder="Ej: 23790219 o 13858258"
                        className="w-full pl-3.5 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] font-medium"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSearching}
                      className="bg-[#0A2540] hover:bg-[#12385E] text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      {isSearching ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4 text-[#00B4D8]" />
                      )}
                      <span>Consultar Ficha</span>
                    </button>
                  </div>
                </form>
              ) : (
                <form
                  onSubmit={handleLegacyLoginVerify}
                  className="space-y-3 bg-slate-50 border-2 border-[#0A2540]/15 rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#0A2540] uppercase tracking-wider">
                      Autenticación en Firebase para Modificar / Corregir Datos
                    </label>
                    <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                      Titular o admin@jireh.com
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Ingresa con tu <strong>propio correo y clave</strong> tal como estás registrado en la base de datos de Firebase (o con la cuenta maestra{" "}
                    <strong className="text-[#0A2540]">admin@jireh.com</strong>) para habilitar la edición de datos.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="Tu correo registrado o admin@jireh.com"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
                      />
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type={showLegacyPass ? "text" : "password"}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Tu contraseña en Firebase"
                        className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLegacyPass(!showLegacyPass)}
                        className="absolute right-2.5 top-2.5 text-slate-400"
                      >
                        {showLegacyPass ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="w-full py-2.5 rounded-xl bg-[#0A2540] hover:bg-[#12385E] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    )}
                    <span>
                      Verificar en Firebase y Desbloquear Edición de Datos
                    </span>
                  </button>
                </form>
              )}

              {searchError && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1.5">
                    <p>{searchError}</p>
                    {verifyMode === "cedula" && (
                      <button
                        type="button"
                        onClick={() => {
                          setRegCedula(identifierInput);
                          setActiveTab("register");
                        }}
                        className="inline-flex items-center gap-1 font-extrabold text-[#0A2540] underline"
                      >
                        <span>Registrarme como nuevo miembro VIP</span>
                        <UserPlus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {legacyUserOnlySuccess && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 space-y-2">
                  <div className="flex items-center gap-2 font-extrabold text-sm text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>
                      ¡Ficha de Cliente actualizada para{" "}
                      {legacyUserOnlySuccess.nombreCompleto}!
                    </span>
                  </div>
                  <p>
                    Se actualizaron tu teléfono (
                    <strong>{legacyUserOnlySuccess.telefono}</strong>), ciudad (
                    <strong>{legacyUserOnlySuccess.ciudad}</strong>) y dirección
                    en tu perfil, manteniendo intactos tus{" "}
                    <strong>
                      {legacyUserOnlySuccess.puntosAcumulados.toFixed(2)} PTS
                    </strong>
                    .
                  </p>
                </div>
              )}

              {foundVip && (
                <div className="space-y-4 pt-2 border-t border-slate-200 animate-in fade-in duration-200">
                  {/* BANNER DEL MODO DE VISUALIZACIÓN ACTUAL (MODO 1, MODO 2 O MODO 3) */}
                  {accessMode === 1 && (
                    <div className="bg-slate-100 border-2 border-slate-300 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0A2540]">
                          <Lock className="w-4 h-4 text-amber-600" />
                          <span>
                            MODO 1: SOLO CONSULTA (SIN OPCIÓN DE MODIFICAR)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">
                          {activeOwner &&
                          activeOwner.cedula.replace(/\D/g, "") !==
                            foundVip.cedula.replace(/\D/g, "")
                            ? `Has iniciado sesión como ${activeOwner.nombreCompleto}. Por seguridad, no puedes modificar ni corregir los datos de otro técnico.`
                            : `Estás visualizando los datos de ${foundVip.nombreCompleto} en modo lectura. Para modificar o corregir esta ficha debes iniciar sesión con el correo y clave de este titular en Firebase o como admin@jireh.com.`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setVerifyMode("login");
                          if (foundVip.email) setLoginEmail(foundVip.email);
                        }}
                        className="bg-[#0A2540] hover:bg-[#12385E] text-white text-xs font-extrabold px-3.5 py-2.5 rounded-xl shrink-0 flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ingresar Clave para Modificar</span>
                      </button>
                    </div>
                  )}

                  {accessMode === 2 && (
                    <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-900">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>
                            MODO 2: EDICIÓN HABILITADA (TITULAR AUTENTICADO EN FIREBASE)
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800">
                          Identidad verificada con tu correo y clave. Puedes modificar y corregir tus propios datos de perfil.
                        </p>
                      </div>
                    </div>
                  )}

                  {accessMode === 3 && (
                    <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#0A2540]">
                          <ShieldCheck className="w-4 h-4 text-amber-600" />
                          <span>
                            MODO 3: EDICIÓN Y CORRECCIÓN MAESTRA (admin@jireh.com)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700">
                          Sesión administradora verificada. Tienes autorización para modificar o corregir los datos de este técnico.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tarjeta Protegida: Puntos Intactos (Solo Lectura) */}
                  <div className="bg-gradient-to-r from-emerald-950 via-[#0A2540] to-[#0e355c] text-white rounded-2xl p-4 border border-emerald-400/40 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                        <Lock className="w-3 h-3" />
                        Puntos VIP Protegidos (Solo Lectura)
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-300">
                        {canModifyData
                          ? `CI/RUC: ${foundVip.cedula}`
                          : "Documento Protegido 🔒"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h4 className="text-lg font-extrabold">
                          {foundVip.nombreCompleto}
                        </h4>
                        <p className="text-xs text-cyan-200">
                          Sede {foundVip.sedeFrecuente || "Principal"} •{" "}
                          {foundVip.ciudad}
                        </p>
                      </div>
                      <div className="text-right bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
                        <p className="text-base font-extrabold text-amber-300">
                          {foundVip.puntosAcumulados.toFixed(2)} PTS
                        </p>
                        <p className="text-[10px] uppercase tracking-wider text-cyan-100 font-bold">
                          Nivel {foundVip.nivelVip}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* =========================================================
                      SI ESTÁ EN MODO 1 (SOLO CONSULTA): MOSTRAR FICHA BLOQUEADA
                      SIN OPCIÓN DE MODIFICAR NI GUARDAR
                     ========================================================= */}
                  {!canModifyData ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-xs font-extrabold text-[#0A2540] uppercase tracking-wider flex items-center gap-1.5">
                          <Eye className="w-4 h-4 text-[#0096C7]" />
                          Datos Registrados del Técnico (Solo Consulta)
                        </span>
                        <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full">
                          Edición Bloqueada
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                        <div className="bg-white border border-slate-200/80 rounded-xl p-2.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            Tipo de Cuenta
                          </p>
                          <p className="font-bold text-[#0A2540] mt-0.5 capitalize">
                            {foundVip.tipoCuenta === "usuario"
                              ? "Cliente / Usuario VIP"
                              : "Técnico Especialista VIP"}
                          </p>
                        </div>

                        <div className="bg-white border border-slate-200/80 rounded-xl p-2.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            Ciudad & Sede Jireh
                          </p>
                          <p className="font-bold text-[#0A2540] mt-0.5">
                            {foundVip.ciudad} • Sede{" "}
                            {foundVip.sedeFrecuente || "Principal"}
                          </p>
                        </div>

                        <div className="bg-white border border-slate-200/80 rounded-xl p-2.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            Código Referido VIP
                          </p>
                          <p className="font-mono font-bold text-[#0096C7] mt-0.5">
                            {foundVip.codigoReferidoVip}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 text-xs">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          Zonas de Cobertura / Dirección Registrada
                        </p>
                        <p className="font-semibold text-slate-700 mt-0.5">
                          {zonasText}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* =========================================================
                       SI ESTÁ EN MODO 2 (PROPIO TITULAR) O MODO 3 (ADMIN@JIREH.COM):
                       MOSTRAR FORMULARIO HABILITADO PARA MODIFICACIÓN Y CORRECCIÓN
                       ========================================================= */
                    <form
                      onSubmit={handleCompleteActivation}
                      className="space-y-4"
                    >
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-extrabold text-[#0A2540] uppercase tracking-wider">
                            2. Modificar / Corregir Datos del Perfil
                          </p>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {accessMode === 3
                              ? "Edición Maestra Admin"
                              : "Edición Titular Verificado"}
                          </span>
                        </div>

                        {/* Rol del Usuario Antiguo: Técnico o Cliente/Usuario */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setUpdateTipoCuenta("tecnico")}
                            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                              updateTipoCuenta === "tecnico"
                                ? "bg-[#0A2540] text-white border-[#0A2540]"
                                : "bg-white text-slate-600 border-slate-200"
                            }`}
                          >
                            <Wrench className="w-3.5 h-3.5 text-[#00B4D8]" />
                            <span>Soy Técnico Especialista</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setUpdateTipoCuenta("usuario")}
                            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                              updateTipoCuenta === "usuario"
                                ? "bg-[#0A2540] text-white border-[#0A2540]"
                                : "bg-white text-slate-600 border-slate-200"
                            }`}
                          >
                            <User className="w-3.5 h-3.5 text-[#00B4D8]" />
                            <span>Soy Cliente / Usuario</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Teléfono WhatsApp *
                            </label>
                            <input
                              type="tel"
                              required
                              value={updateTelefono}
                              onChange={(e) =>
                                setUpdateTelefono(e.target.value)
                              }
                              placeholder="+584121234567"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Ciudad *
                            </label>
                            <select
                              value={updateCiudad}
                              onChange={(e) =>
                                setUpdateCiudad(e.target.value as any)
                              }
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                            >
                              <option value="Maracay">Maracay</option>
                              <option value="Valencia">Valencia</option>
                              <option value="Caracas">Caracas</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Sede Jireh Frecuente *
                            </label>
                            <select
                              value={updateSede}
                              onChange={(e) =>
                                setUpdateSede(e.target.value as any)
                              }
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                            >
                              <option value="Principal">Sede Principal</option>
                              <option value="Campo">Sede Campo</option>
                              <option value="Jabillos">Sede Jabillos</option>
                              <option value="Sucre">Sede Sucre</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Dirección / Zonas de Cobertura en {updateCiudad} *
                          </label>
                          <input
                            type="text"
                            required
                            value={zonasText}
                            onChange={(e) => setZonasText(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                          />
                        </div>
                      </div>

                      {updateTipoCuenta === "tecnico" && (
                        <>
                          <div>
                            <label className="block text-xs font-bold text-[#0A2540] uppercase tracking-wider mb-2">
                              3. Selecciona las Especialidades Técnicas
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {SERVICE_CATEGORIES.filter(
                                (c) => c.id !== "todos"
                              ).map((cat) => {
                                const active = selectedCategories.includes(
                                  cat.id
                                );
                                return (
                                  <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() =>
                                      toggleCategory(
                                        cat.id,
                                        selectedCategories,
                                        setSelectedCategories
                                      )
                                    }
                                    className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all flex items-center justify-between ${
                                      active
                                        ? "bg-[#0A2540] text-white border-[#0A2540] shadow-sm"
                                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                    }`}
                                  >
                                    <span>{cat.shortLabel}</span>
                                    {active && (
                                      <CheckCircle2 className="w-4 h-4 text-[#00B4D8] shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Especialidad Principal (Visible en Tarjeta)
                              </label>
                              <input
                                type="text"
                                value={etiquetaDestacada}
                                onChange={(e) =>
                                  setEtiquetaDestacada(e.target.value)
                                }
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Tarifa Revisión (USD)
                              </label>
                              <input
                                type="number"
                                min={5}
                                max={100}
                                value={tarifaDiagnostico}
                                onChange={(e) =>
                                  setTarifaDiagnostico(Number(e.target.value))
                                }
                                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      <button
                        type="submit"
                        disabled={isActivating}
                        className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#00B4D8] to-[#0096C7] hover:from-[#0096C7] hover:to-[#0A2540] text-white font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
                      >
                        {isActivating ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <UserCheck className="w-5 h-5" />
                        )}
                        <span>
                          Guardar Cambios en la Ficha (Manteniendo{" "}
                          {foundVip.puntosAcumulados.toFixed(2)} PTS)
                        </span>
                      </button>
                    </form>
                  )}
                </div>
              )}
            </>
          ) : (
            /* ===============================================================
               PESTAÑA 2: FORMULARIO COMPLETO DE REGISTRO NUEVO EN JIREH VIP
               =============================================================== */
            <form
              onSubmit={handleNewRegistrationSubmit}
              className="space-y-4 animate-in fade-in duration-200"
            >
              <div>
                <label className="block text-xs font-bold text-[#0A2540] uppercase tracking-wider mb-2">
                  1. ¿Cómo deseas registrarte en el ecosistema Jireh?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRegTipoCuenta("tecnico")}
                    className={`p-3 rounded-2xl border-2 text-left transition-all flex items-start gap-3 ${
                      regTipoCuenta === "tecnico"
                        ? "border-[#00B4D8] bg-cyan-50/60 shadow-sm"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl ${
                        regTipoCuenta === "tecnico"
                          ? "bg-[#00B4D8] text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-[#0A2540]">
                        Soy Técnico Especialista
                      </p>
                      <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                        Quiero acumular puntos VIP en repuestos y aparecer en la
                        lista de técnicos de TECNI JIREH.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegTipoCuenta("usuario")}
                    className={`p-3 rounded-2xl border-2 text-left transition-all flex items-start gap-3 ${
                      regTipoCuenta === "usuario"
                        ? "border-[#00B4D8] bg-cyan-50/60 shadow-sm"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl ${
                        regTipoCuenta === "usuario"
                          ? "bg-[#00B4D8] text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-[#0A2540]">
                        Soy Cliente / Usuario
                      </p>
                      <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                        Quiero contratar técnicos verificados y acumular puntos
                        VIP en mis compras en Jireh.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <label className="block text-xs font-bold text-[#0A2540] uppercase tracking-wider">
                  2. Datos Personales y Ubicación
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nombre y Apellido Completo *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={regNombre}
                        onChange={(e) => setRegNombre(e.target.value)}
                        placeholder="Ej: Carlos Eduardo Pérez"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cédula de Identidad (CI) o RUC *
                    </label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={regCedula}
                        onChange={(e) => setRegCedula(e.target.value)}
                        placeholder="Ej: 18452910"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Teléfono WhatsApp *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        required
                        value={regTelefono}
                        onChange={(e) => setRegTelefono(e.target.value)}
                        placeholder="+584121234567"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ciudad *
                    </label>
                    <select
                      value={regCiudad}
                      onChange={(e) => setRegCiudad(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] bg-white"
                    >
                      <option value="Maracay">Maracay</option>
                      <option value="Valencia">Valencia</option>
                      <option value="Caracas">Caracas</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Sede Jireh Frecuente *
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <select
                        value={regSede}
                        onChange={(e) => setRegSede(e.target.value as any)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8] bg-white"
                      >
                        <option value="Principal">Sede Principal</option>
                        <option value="Campo">Sede Campo</option>
                        <option value="Jabillos">Sede Jabillos</option>
                        <option value="Sucre">Sede Sucre</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dirección / Urbanización o Zonas de Cobertura *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={regDireccion}
                      onChange={(e) => setRegDireccion(e.target.value)}
                      placeholder="Ej: Las Delicias, Base Aragua, Calicanto (Maracay)"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#0A2540] uppercase tracking-wider">
                    3. Credenciales de Acceso al Sistema de Puntos VIP
                  </label>
                  <span className="text-[10px] font-bold text-[#0096C7] bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
                    Válido en clientes-jireh-vip.vercel.app
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Correo Electrónico *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="tucorreo@ejemplo.com"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Clave de Acceso (mín. 6 caracteres) *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {regTipoCuenta === "tecnico" && (
                <div className="space-y-3 pt-1 border-t border-slate-200">
                  <label className="block text-xs font-bold text-[#0A2540] uppercase tracking-wider">
                    4. Perfil de Servicios para aparecer en TECNI JIREH
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SERVICE_CATEGORIES.filter((c) => c.id !== "todos").map(
                      (cat) => {
                        const active = regCategories.includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() =>
                              toggleCategory(
                                cat.id,
                                regCategories,
                                setRegCategories
                              )
                            }
                            className={`p-2 rounded-xl text-left border text-xs font-bold transition-all flex items-center justify-between ${
                              active
                                ? "bg-[#0A2540] text-white border-[#0A2540]"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <span>{cat.shortLabel}</span>
                            {active && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#00B4D8] shrink-0" />
                            )}
                          </button>
                        );
                      }
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Título de Especialidad
                      </label>
                      <input
                        type="text"
                        value={regEspecialidadTitulo}
                        onChange={(e) =>
                          setRegEspecialidadTitulo(e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Diagnóstico ($)
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={100}
                        value={regTarifa}
                        onChange={(e) => setRegTarifa(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Experiencia (Años)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={regExperiencia}
                        onChange={(e) =>
                          setRegExperiencia(Number(e.target.value))
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#00B4D8]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {regError && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              {regSuccessUserOnly && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 space-y-2">
                  <div className="flex items-center gap-2 font-extrabold text-sm text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>
                      ¡Cuenta de Cliente VIP creada para{" "}
                      {regSuccessUserOnly.nombreCompleto}!
                    </span>
                  </div>
                  <p>
                    Tu cédula <strong>{regSuccessUserOnly.cedula}</strong> y tu
                    correo <strong>{regSuccessUserOnly.email}</strong> ya están
                    habilitados para acumular puntos en tus compras en{" "}
                    <strong>Refrigeraciones Jireh</strong>.
                  </p>
                  <div className="pt-1 flex gap-2">
                    <a
                      href="https://clientes-jireh-vip.vercel.app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#0A2540] text-white font-bold px-3 py-2 rounded-xl inline-flex items-center gap-1.5"
                    >
                      <span>Abrir mi Tarjeta VIP</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={onClose}
                      className="bg-emerald-600 text-white font-bold px-3 py-2 rounded-xl"
                    >
                      Explorar Técnicos
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isRegistering}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0A2540] font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                {isRegistering ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <UserPlus className="w-5 h-5" />
                )}
                <span>
                  {regTipoCuenta === "tecnico"
                    ? "Crear mi Cuenta de Puntos VIP y Postular mi Perfil Técnico"
                    : "Crear mi Cuenta en el Sistema de Puntos Jireh VIP"}
                </span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
