"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Snowflake,
  Settings,
  Search,
  MapPin,
  Award,
  Sparkles,
  Wind,
  Refrigerator,
  Box,
  Factory,
  WashingMachine,
  Zap,
  LayoutGrid,
  Map as MapIcon,
  Wrench,
  CreditCard,
  Instagram,
  CheckCircle2,
  ExternalLink,
  SlidersHorizontal,
  ShieldCheck,
  MessageCircle,
  ChevronRight,
  Database,
} from "lucide-react";
import {
  TechnicianProfile,
  ServiceCategoryId,
  JirehCity,
  JirehVipClient,
} from "@/types/jireh";
import {
  SERVICE_CATEGORIES,
  isFirebaseConfigured,
  MOCK_TECHNICIANS,
} from "@/lib/firebase";
import {
  getSyncedTechnicians,
  sortTechniciansByVipPriority,
} from "@/services/jirehVipService";
import TechnicianCard from "@/components/TechnicianCard";
import InteractiveMapView from "@/components/InteractiveMapView";
import TechnicianDetailModal from "@/components/TechnicianDetailModal";
import VipActivationModal from "@/components/VipActivationModal";
import SparePartQuoteModal from "@/components/SparePartQuoteModal";
import AdminControlModal from "@/components/AdminControlModal";

const QUICK_FAULT_SUGGESTIONS = [
  { label: "❄️ Mi nevera no congela", query: "nevera", category: "neveras" as ServiceCategoryId },
  { label: "💨 Mantenimiento Split 12.000 BTU", query: "Split", category: "split" as ServiceCategoryId },
  { label: "⚡ Urgencia Cava Cuarto", query: "Cava", category: "cuartos-frios" as ServiceCategoryId },
  { label: "🌀 Lavadora no drena", query: "lavadora", category: "lavadoras" as ServiceCategoryId },
];

function CategoryIcon({
  id,
  className = "w-5 h-5",
}: {
  id: ServiceCategoryId;
  className?: string;
}) {
  switch (id) {
    case "split":
      return <Wind className={className} />;
    case "neveras":
      return <Refrigerator className={className} />;
    case "cuartos-frios":
      return <Box className={className} />;
    case "chiller":
      return <Factory className={className} />;
    case "lavadoras":
      return <WashingMachine className={className} />;
    case "urgencias":
      return <Zap className={className} />;
    default:
      return <Sparkles className={className} />;
  }
}

function TecniJirehContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Estado principal de Técnicos (Paginación de 6 en 6 hasta los primeros 36 técnicos)
  const PAGE_STEP = 6;
  const MAX_TECHNICIANS_LIMIT = 36;
  const [technicians, setTechnicians] =
    useState<TechnicianProfile[]>(MOCK_TECHNICIANS);
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_STEP);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<ServiceCategoryId>("todos");
  const [selectedCity, setSelectedCity] = useState<JirehCity>("Todas");
  const [onlyVipVerified, setOnlyVipVerified] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [showTopMapBanner, setShowTopMapBanner] = useState(true);

  // Modales Interactivos y Estado de Sesión (Modos 1, 2 y 3)
  const [selectedTechnician, setSelectedTechnician] =
    useState<TechnicianProfile | null>(null);
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [vipModalInitialTab, setVipModalInitialTab] = useState<
    "validate" | "register"
  >("validate");
  const [presetCedulaToLoad, setPresetCedulaToLoad] = useState<string | null>(
    null
  );
  const [authenticatedVipClient, setAuthenticatedVipClient] =
    useState<JirehVipClient | null>(null);
  const [quoteModalTech, setQuoteModalTech] =
    useState<TechnicianProfile | null>(null);
  const [isPartQuoteModalOpen, setIsPartQuoteModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isMasterAdminLogged, setIsMasterAdminLogged] = useState(false);
  const [activationBannerMessage, setActivationBannerMessage] = useState<
    string | null
  >(null);

  // Reiniciar a los primeros 6 técnicos cada vez que el usuario cambia un filtro
  useEffect(() => {
    setVisibleCount(PAGE_STEP);
  }, [selectedCity, selectedCategory, onlyVipVerified, searchQuery]);

  // 1. Carga y sincronización inicial con Firebase / Catálogo VIP Jireh
  useEffect(() => {
    let mounted = true;
    getSyncedTechnicians().then((synced) => {
      if (mounted) {
        setTechnicians(synced);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // 2. Sincronización automática con enlaces desde Historias de Instagram (@refrigeracionesjireh)
  useEffect(() => {
    const catParam = searchParams.get("categoria")?.toLowerCase();
    const zonaParam = searchParams.get("zona")?.toLowerCase();
    const qParam = searchParams.get("q");

    if (catParam) {
      const validCat = SERVICE_CATEGORIES.find((c) => c.id === catParam);
      if (validCat) {
        setSelectedCategory(validCat.id);
      }
    }

    if (zonaParam) {
      if (zonaParam.includes("maracay")) setSelectedCity("Maracay");
      else if (zonaParam.includes("valencia")) setSelectedCity("Valencia");
      else if (zonaParam.includes("caracas")) setSelectedCity("Caracas");
      else setSearchQuery(zonaParam);
    }

    if (qParam) {
      setSearchQuery(qParam);
    }
  }, [searchParams]);

  // Cantidad de técnicos pendientes por aprobación del Administrador
  const pendingApprovalCount = useMemo(
    () =>
      technicians.filter((t) => t.estadoPublicacion === "pendiente").length,
    [technicians]
  );

  // 3. Filtrado y Ordenamiento (SOLO se muestran públicamente los que tienen estadoPublicacion === "publicado", hasta los primeros 36)
  const filteredTechnicians = useMemo(() => {
    const queryClean = searchQuery.trim().toLowerCase();

    const filtered = technicians.filter((tech) => {
      // Regla de Gobernanza del Administrador: Solo mostrar publicados en la web pública
      const pubStatus = tech.estadoPublicacion || "publicado";
      if (pubStatus !== "publicado") {
        return false;
      }

      // Filtro por ciudad
      if (selectedCity !== "Todas" && tech.ciudad !== selectedCity) {
        return false;
      }

      // Filtro por solo VIP verificados
      if (onlyVipVerified && !tech.esVipVerificado) {
        return false;
      }

      // Filtro por categoría
      if (selectedCategory !== "todos") {
        if (selectedCategory === "urgencias") {
          if (!tech.disponibleUrgenciasHoy) return false;
        } else if (!tech.especialidades.includes(selectedCategory)) {
          return false;
        }
      }

      // Filtro por buscador de falla, equipo, nombre o urbanización
      if (queryClean) {
        const haystack = [
          tech.nombre,
          tech.ciudad,
          tech.etiquetaDestacada,
          tech.bio,
          ...tech.zonasCobertura,
          ...tech.especialidades,
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(queryClean);
      }

      return true;
    });

    return sortTechniciansByVipPriority(filtered).slice(
      0,
      MAX_TECHNICIANS_LIMIT
    );
  }, [
    technicians,
    selectedCity,
    onlyVipVerified,
    selectedCategory,
    searchQuery,
  ]);

  // Técnicos visibles actualmente en pantalla (de 6 en 6 hasta 36)
  const visibleTechnicians = useMemo(
    () => filteredTechnicians.slice(0, visibleCount),
    [filteredTechnicians, visibleCount]
  );

  // Manejo de nuevo perfil activado o registrado con Cédula VIP
  const handleProfileActivated = (
    newProfile: TechnicianProfile,
    customMessage?: string
  ) => {
    setTechnicians((prev) =>
      sortTechniciansByVipPriority([
        newProfile,
        ...prev.filter((t) => t.cedula !== newProfile.cedula),
      ])
    );
    setSelectedCity(newProfile.ciudad);
    setSelectedCategory("todos");
    setActivationBannerMessage(
      customMessage ||
        `¡Perfil activado con éxito! ${newProfile.nombre} ahora aparece primero con la insignia "Técnico VIP Verificado Jireh" (${newProfile.puntosJirehVip.toFixed(
          2
        )} pts).`
    );
  };

  // Actualizar estado de publicación o badge VIP desde el Panel de Administrador
  const handleAdminUpdateTechnician = (
    techId: string,
    changes: Partial<TechnicianProfile>
  ) => {
    setTechnicians((prev) =>
      sortTechniciansByVipPriority(
        prev.map((t) => (t.id === techId ? { ...t, ...changes } : t))
      )
    );
  };

  const handleBulkPublishTopVip = () => {
    setTechnicians((prev) =>
      prev.map((t) =>
        t.esVipVerificado ? { ...t, estadoPublicacion: "publicado" } : t
      )
    );
  };

  // Simulador rápido de enlaces de historias de Instagram (@refrigeracionesjireh)
  const applyInstagramStoryPreset = (
    cat: ServiceCategoryId,
    city: JirehCity
  ) => {
    setSelectedCategory(cat);
    setSelectedCity(city);
    const params = new URLSearchParams();
    if (cat !== "todos") params.set("categoria", cat);
    if (city !== "Todas") params.set("zona", city.toLowerCase());
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] pb-24 md:pb-12">
      {/* =====================================================================
          1. BARRA SUPERIOR DISCRETA (SOLO ESCRITORIO PARA NO SATURAR MÓVILES)
         ===================================================================== */}
      <div className="hidden md:block bg-[#07192C] text-cyan-100 text-[11px] py-1.5 px-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/20 text-[#00B4D8] font-bold">
              <Database className="w-3 h-3" />
              Sincronizado en Vivo • Club VIP Jireh
            </span>
            <span className="text-slate-300">
              • Respaldado por <strong>Refrigeraciones Jireh</strong>
            </span>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <a
              href="https://www.refrijireh.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white inline-flex items-center gap-1 font-semibold text-cyan-300"
            >
              <span>Tienda refrijireh.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <a
              href="https://clientes-jireh-vip.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white inline-flex items-center gap-1 font-bold text-amber-300"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Portal VIP</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={() => setIsAdminModalOpen(true)}
              className={`px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 transition-colors ${
                isMasterAdminLogged
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40"
                  : "bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white"
              }`}
              title="Acceso exclusivo para admin@jireh.com"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>{isMasterAdminLogged ? "Panel Admin" : "Admin"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. HEADER COMPACTO & ELEGANTE (OPTIMIZADO PARA SMARTPHONE)
         ===================================================================== */}
      <header className="bg-gradient-to-br from-[#0A2540] via-[#0D3156] to-[#0096C7] text-white shadow-md relative overflow-hidden">
        <div className="pointer-events-none absolute -right-12 -top-12 opacity-10">
          <Snowflake className="w-52 h-52 text-white" />
        </div>

        <div className="max-w-7xl mx-auto px-3.5 sm:px-4 pt-3 pb-3.5 sm:py-4 relative z-10 space-y-3">
          {/* Fila 1: Marca TECNI JIREH a la izquierda + Botones Compactos a la derecha */}
          <div className="flex items-center justify-between gap-2">
            <div
              onClick={() => {
                setSelectedCategory("todos");
                setSelectedCity("Todas");
                setSearchQuery("");
                router.replace("/", { scroll: false });
              }}
              className="flex items-center gap-2 cursor-pointer group min-w-0"
            >
              <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/25 flex items-center justify-center shadow-sm shrink-0">
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-[#00B4D8] animate-spin-slow" />
                <Snowflake className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white absolute" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-lg sm:text-2xl font-black tracking-tight text-white">
                    TECNI
                  </span>
                  <span className="text-lg sm:text-2xl font-black tracking-tight text-[#00B4D8]">
                    JIREH
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-cyan-100/90 font-medium -mt-1 truncate">
                  Técnicos Verificados • Refrigeraciones Jireh
                </p>
              </div>
            </div>

            {/* Acciones Derecha en una sola línea limpia */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setVipModalInitialTab("validate");
                  setIsVipModalOpen(true);
                }}
                className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0A2540] font-extrabold text-[11px] sm:text-xs px-3 py-2 rounded-xl shadow-md flex items-center gap-1.5 active:scale-95 transition-transform"
              >
                <Award className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">
                  Activar mi Perfil con Cédula VIP
                </span>
                <span className="sm:hidden">Soy VIP</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAdminModalOpen(true)}
                className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1 border transition-colors ${
                  isMasterAdminLogged
                    ? "bg-emerald-500/25 text-emerald-200 border-emerald-300/50"
                    : "bg-white/10 hover:bg-white/20 text-cyan-100 border-white/15"
                }`}
                title="Panel Administrador (admin@jireh.com)"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {isMasterAdminLogged ? "Panel Admin" : "Admin"}
                </span>
                {isMasterAdminLogged && pendingApprovalCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] px-1.5 rounded-full">
                    +{pendingApprovalCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Fila 2: Buscador Estilo Airbnb con Selector de Ciudad Integrado */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl p-1 sm:p-1.5 shadow-floating flex items-center gap-1.5 border border-cyan-200/40">
              <div className="pl-2.5 text-[#00B4D8] shrink-0">
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar falla, aire split, nevera o zona..."
                className="w-full py-2 px-1 text-slate-800 placeholder:text-slate-400 text-xs sm:text-sm font-medium focus:outline-none min-w-0"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-[11px] text-slate-400 hover:text-slate-600 px-1.5 shrink-0"
                >
                  ✕
                </button>
              )}

              {/* Selector de Ciudad Integrado dentro de la barra de búsqueda */}
              <div className="flex items-center bg-slate-100 hover:bg-slate-200/70 rounded-xl px-2.5 py-1.5 shrink-0 border border-slate-200/80">
                <MapPin className="w-3.5 h-3.5 text-[#0096C7] mr-1 shrink-0" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value as JirehCity)}
                  aria-label="Seleccionar ciudad"
                  className="bg-transparent text-[#0A2540] text-[11px] sm:text-xs font-extrabold focus:outline-none cursor-pointer"
                >
                  <option value="Todas">Todas</option>
                  <option value="Maracay">Maracay</option>
                  <option value="Valencia">Valencia</option>
                  <option value="Caracas">Caracas</option>
                </select>
              </div>
            </div>

            {/* Sugerencias rápidas solo en pantallas medianas/grandes para mantener limpio el smartphone */}
            <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2">
              <span className="text-[11px] text-cyan-200 font-semibold shrink-0 mr-1">
                Fallas frecuentes:
              </span>
              {QUICK_FAULT_SUGGESTIONS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setSearchQuery(item.query);
                    setSelectedCategory(item.category);
                  }}
                  className="text-[11px] bg-white/10 hover:bg-white/20 text-white px-2.5 py-0.5 rounded-full whitespace-nowrap transition-colors border border-white/15"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* =====================================================================
          3. CARRUSEL DE CATEGORÍAS (ESTILO AIRBNB) + CONTROLES DE VISTA
         ===================================================================== */}
      <section className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          {/* Carrusel Horizontal de Categorías */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {SERVICE_CATEGORIES.map((category) => {
              const isActive = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? "bg-[#0A2540] text-white shadow-sm"
                      : "bg-slate-100/80 hover:bg-slate-200/70 text-slate-600"
                  }`}
                >
                  <CategoryIcon
                    id={category.id}
                    className={`w-4 h-4 ${
                      isActive
                        ? "text-[#00B4D8]"
                        : "text-slate-500 group-hover:text-[#0A2540]"
                    }`}
                  />
                  <span>{category.label}</span>
                  {category.badge && (
                    <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
                      {category.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Controles Derecha: Filtro Solo VIP + Toggle Lista / Mapa */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setOnlyVipVerified(!onlyVipVerified)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                onlyVipVerified
                  ? "bg-amber-50 border-amber-400 text-amber-900 shadow-sm"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Award
                className={`w-4 h-4 ${
                  onlyVipVerified ? "text-amber-500" : "text-slate-400"
                }`}
              />
              <span>Solo VIP Jireh</span>
            </button>

            <div className="bg-slate-100 p-1 rounded-xl flex items-center">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === "grid"
                    ? "bg-white text-[#0A2540] shadow-sm"
                    : "text-slate-600 hover:text-[#0A2540]"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Lista</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === "map"
                    ? "bg-[#0A2540] text-white shadow-sm"
                    : "text-slate-600 hover:text-[#0A2540]"
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Mapa</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. CONTENIDO PRINCIPAL: MAPA DE RADAR + TARJETAS DE TÉCNICOS
         ===================================================================== */}
      <main className="max-w-7xl mx-auto w-full px-4 pt-5 flex-1 space-y-6">
        {/* Notificación cuando un Técnico activa su perfil con Cédula VIP */}
        {activationBannerMessage && (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-amber-300" />
              <span>{activationBannerMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setActivationBannerMessage(null)}
              className="text-xs underline opacity-90 hover:opacity-100 shrink-0"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Vista Previa del Mapa Interactivo arriba (fiel al mockup móvil enviado) */}
        {viewMode === "grid" && showTopMapBanner && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-[#0A2540]">
                  Mapa de Técnicos Cercanos a Ti
                </h2>
                <span className="text-[11px] bg-cyan-100 text-[#0096C7] font-bold px-2.5 py-0.5 rounded-full">
                  Tarifa en vivo
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode("map")}
                  className="text-xs font-bold text-[#0096C7] hover:underline flex items-center gap-0.5"
                >
                  <span>Abrir mapa completo</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <InteractiveMapView
              technicians={filteredTechnicians}
              selectedCity={selectedCity}
              onSelectTechnician={(tech) => setSelectedTechnician(tech)}
              compactPreview={true}
              onExpandMap={() => setViewMode("map")}
            />
          </section>
        )}

        {/* Encabezado de Sección: Técnicos Destacados de @refrigeracionesjireh */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black text-[#0A2540]">
                  Técnicos Destacados de{" "}
                  <span className="text-[#00B4D8]">refrigeracionesjireh</span>
                </h1>
                <Snowflake className="w-5 h-5 text-[#00B4D8] hidden sm:inline" />
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Los técnicos con insignia{" "}
                <strong className="text-[#0A2540]">
                  Técnico VIP Verificado Jireh
                </strong>{" "}
                aparecen primero por su historial comprobado de compras de
                repuestos originales en{" "}
                <strong className="text-[#0A2540]">
                  Refrigeraciones Jireh
                </strong>
                .
              </p>
            </div>

            {/* Controles Rápidos en Móvil */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <button
                type="button"
                onClick={() => setOnlyVipVerified(!onlyVipVerified)}
                className={`lg:hidden px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                  onlyVipVerified
                    ? "bg-amber-50 border-amber-400 text-amber-900"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Solo VIP ({filteredTechnicians.filter((t) => t.esVipVerificado).length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setQuoteModalTech(null);
                  setIsPartQuoteModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#0A2540] hover:bg-[#12385E] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Wrench className="w-3.5 h-3.5 text-[#00B4D8]" />
                <span>Cotizar Repuesto en RefriJireh</span>
              </button>
            </div>
          </div>

          {/* Vista de Mapa Completo o Cuadrícula de Tarjetas */}
          {viewMode === "map" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-[#0A2540]">
                  Mostrando {filteredTechnicians.length} técnicos en el mapa
                  interactivo
                </span>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className="bg-[#0A2540] text-white text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-[#00B4D8]" />
                  <span>Volver a Cuadrícula</span>
                </button>
              </div>

              <InteractiveMapView
                technicians={filteredTechnicians}
                selectedCity={selectedCity}
                onSelectTechnician={(tech) => setSelectedTechnician(tech)}
                compactPreview={false}
              />
            </div>
          ) : filteredTechnicians.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center max-w-lg mx-auto my-6 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-[#00B4D8] flex items-center justify-center mx-auto">
                <Snowflake className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-extrabold text-[#0A2540]">
                No encontramos técnicos con ese filtro exacto
              </h3>
              <p className="text-xs text-slate-500">
                Prueba seleccionando &ldquo;Todas las Ciudades&rdquo; o limpia la
                búsqueda para ver todos los Técnicos VIP Verificados.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("todos");
                  setSelectedCity("Todas");
                  setSearchQuery("");
                  setOnlyVipVerified(false);
                }}
                className="bg-[#00B4D8] text-white font-bold text-xs px-4 py-2.5 rounded-xl"
              >
                Mostrar Todos los Técnicos
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Indicador Superior de Paginación para Smartphone y Escritorio */}
              <div className="bg-white border border-slate-200/90 rounded-2xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0A2540]">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-[#0A2540] text-amber-300 font-black text-[11px]">
                    {visibleTechnicians.length}
                  </span>
                  <span>
                    Mostrando{" "}
                    <strong className="text-[#0096C7]">
                      1–{visibleTechnicians.length}
                    </strong>{" "}
                    de <strong>{filteredTechnicians.length}</strong> Técnicos
                    VIP
                  </span>
                </div>

                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-[11px] text-slate-500 hidden sm:inline mr-1">
                    Ver de 6 en 6:
                  </span>
                  {[6, 12, 18, 24, 30, 36]
                    .filter(
                      (step) =>
                        step <= filteredTechnicians.length ||
                        step - PAGE_STEP < filteredTechnicians.length
                    )
                    .map((step) => {
                      const target = Math.min(step, filteredTechnicians.length);
                      const isActive =
                        visibleTechnicians.length === target ||
                        (visibleCount >= step &&
                          visibleCount < step + PAGE_STEP);
                      return (
                        <button
                          key={step}
                          type="button"
                          onClick={() => setVisibleCount(step)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all ${
                            isActive
                              ? "bg-[#0A2540] text-amber-300 shadow-sm"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                          }`}
                        >
                          {step}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Cuadrícula Responsive (1 col en Smartphone, 2 en Tablet, 3 en Desktop) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {visibleTechnicians.map((tech) => (
                  <TechnicianCard
                    key={tech.id}
                    technician={tech}
                    onSelect={(t) => setSelectedTechnician(t)}
                    onQuotePart={(t) => {
                      setQuoteModalTech(t);
                      setIsPartQuoteModalOpen(true);
                    }}
                  />
                ))}
              </div>

              {/* Panel Inferior de Carga de 6 en 6 (Especializado para Smartphone) */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-card space-y-3.5 text-center max-w-xl mx-auto">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span>
                    Visualizando{" "}
                    <strong className="text-[#0A2540]">
                      {visibleTechnicians.length}
                    </strong>{" "}
                    de{" "}
                    <strong className="text-[#0A2540]">
                      {filteredTechnicians.length}
                    </strong>{" "}
                    técnicos disponibles
                  </span>
                  <span className="text-[#0096C7] font-extrabold">
                    Bloque{" "}
                    {Math.min(
                      Math.ceil(visibleTechnicians.length / PAGE_STEP),
                      6
                    )}{" "}
                    de{" "}
                    {Math.max(
                      1,
                      Math.ceil(filteredTechnicians.length / PAGE_STEP)
                    )}
                  </span>
                </div>

                {/* Barra de progreso visual */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#0A2540] via-[#0096C7] to-[#00B4D8] rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (visibleTechnicians.length /
                            Math.max(1, filteredTechnicians.length)) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
                  {visibleCount < filteredTechnicians.length ? (
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleCount((prev) =>
                          Math.min(prev + PAGE_STEP, MAX_TECHNICIANS_LIMIT)
                        )
                      }
                      className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#0A2540] via-[#12385E] to-[#0096C7] hover:from-[#12385E] hover:to-[#00B4D8] active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                      <span>
                        Ver 6 Técnicos Más (+6) • Mostrar{" "}
                        {Math.min(
                          visibleCount + PAGE_STEP,
                          filteredTechnicians.length
                        )}{" "}
                        de {filteredTechnicians.length}
                      </span>
                    </button>
                  ) : (
                    <div className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Estás viendo todos los {filteredTechnicians.length}{" "}
                        primeros técnicos del Ranking VIP
                      </span>
                    </div>
                  )}

                  {visibleCount > PAGE_STEP && (
                    <button
                      type="button"
                      onClick={() => {
                        setVisibleCount(PAGE_STEP);
                        window.scrollTo({ top: 320, behavior: "smooth" });
                      }}
                      className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-[#0A2540] font-bold text-xs transition-colors shrink-0"
                    >
                      Volver a primeros 6
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* =====================================================================
            5. BANNER DE SINCRONIZACIÓN CLUB VIP & TIENDA REFRIJIREH
           ===================================================================== */}
        <section className="bg-gradient-to-r from-[#0A2540] via-[#0F345B] to-[#0096C7] rounded-3xl p-6 sm:p-8 text-white shadow-card relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-2.5">
              <span className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 border border-amber-300/30 px-3 py-1 rounded-full text-xs font-extrabold">
                <Award className="w-4 h-4" />
                ECOSISTEMA REFRIGERACIONES JIREH
              </span>
              <h2 className="text-xl sm:text-2xl font-black leading-tight">
                ¿Eres Técnico y ya compras en Refrigeraciones Jireh?
              </h2>
              <p className="text-xs sm:text-sm text-cyan-100 leading-relaxed max-w-2xl">
                Conecta tu Cédula VIP con <strong>TECNI JIREH</strong> en menos
                de 1 minuto. El sistema valida tus puntos acumulados en{" "}
                <span className="underline">clientes-jireh-vip.vercel.app</span>,
                activa tu insignia <strong>Técnico VIP Verificado Jireh</strong> y
                te posiciona de primero en Maracay, Valencia o Caracas.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setVipModalInitialTab("register");
                  setIsVipModalOpen(true);
                }}
                className="w-full py-3.5 px-5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-[#0A2540] font-extrabold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>Registrarme Nuevo en Jireh VIP</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setVipModalInitialTab("validate");
                  setIsVipModalOpen(true);
                }}
                className="w-full py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Award className="w-4 h-4 text-amber-300" />
                <span>Ya tengo Cédula VIP • Activar Perfil</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* =====================================================================
          6. BOTÓN FLOTANTE DE WHATSAPP / AYUDA RÁPIDA (COMO EN EL MOCKUP)
         ===================================================================== */}
      <button
        type="button"
        onClick={() => {
          setQuoteModalTech(null);
          setIsPartQuoteModalOpen(true);
        }}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 w-13 h-13 p-3.5 rounded-full bg-gradient-to-tr from-[#0A2540] to-[#00B4D8] text-white shadow-floating border-2 border-white flex items-center justify-center hover:scale-105 transition-transform"
        title="Asistencia y Cotización Rápida RefriJireh"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* =====================================================================
          7. BOTTOM NAVIGATION BAR (MÓVIL - ESTILO PWA AIRBNB)
          Explorar | Mapa | Pedir Repuesto (refrijireh.com) | Mi Tarjeta VIP
         ===================================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-lg">
        <div className="grid grid-cols-4 gap-1 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-colors ${
              viewMode === "grid"
                ? "text-[#00B4D8] font-bold"
                : "text-slate-500 hover:text-[#0A2540]"
            }`}
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Explorar</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode(viewMode === "map" ? "grid" : "map")}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-colors ${
              viewMode === "map"
                ? "text-[#00B4D8] font-bold"
                : "text-slate-500 hover:text-[#0A2540]"
            }`}
          >
            <MapPin className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Mapa</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setQuoteModalTech(null);
              setIsPartQuoteModalOpen(true);
            }}
            className="flex flex-col items-center justify-center py-1 rounded-xl text-slate-500 hover:text-[#0A2540] transition-colors"
          >
            <Wrench className="w-5 h-5 text-[#0096C7]" />
            <span className="text-[10px] mt-0.5 font-semibold">
              Pedir Repuesto
            </span>
          </button>

          <a
            href="https://clientes-jireh-vip.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center py-1 rounded-xl text-amber-600 hover:text-amber-700 font-bold transition-colors"
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Mi Tarjeta VIP</span>
          </a>
        </div>
      </nav>

      {/* =====================================================================
          8. MODALES INTERACTIVOS
         ===================================================================== */}
      <TechnicianDetailModal
        technician={selectedTechnician}
        onClose={() => setSelectedTechnician(null)}
        onOpenPartQuoteModal={(tech) => {
          setSelectedTechnician(null);
          setQuoteModalTech(tech);
          setIsPartQuoteModalOpen(true);
        }}
        isMasterAdminLogged={isMasterAdminLogged}
        authenticatedVipClient={authenticatedVipClient}
        onRequestEditTechnician={(cedula) => {
          setPresetCedulaToLoad(cedula);
          setVipModalInitialTab("validate");
          setIsVipModalOpen(true);
        }}
      />

      <VipActivationModal
        isOpen={isVipModalOpen}
        onClose={() => {
          setIsVipModalOpen(false);
          setPresetCedulaToLoad(null);
        }}
        onProfileActivated={handleProfileActivated}
        initialTab={vipModalInitialTab}
        isMasterAdminLogged={isMasterAdminLogged}
        authenticatedVipClient={authenticatedVipClient}
        presetCedulaToLoad={presetCedulaToLoad}
        onUserAuthenticated={(client, isAdmin) => {
          if (isAdmin) {
            setIsMasterAdminLogged(true);
          } else {
            setAuthenticatedVipClient(client);
          }
        }}
      />

      <SparePartQuoteModal
        isOpen={isPartQuoteModalOpen}
        onClose={() => setIsPartQuoteModalOpen(false)}
        preselectedTech={quoteModalTech}
      />

      <AdminControlModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        technicians={technicians}
        onUpdateTechnician={handleAdminUpdateTechnician}
        onBulkPublishTopVip={handleBulkPublishTopVip}
        onAdminSessionChange={setIsMasterAdminLogged}
        onEditTechnicianData={(cedula) => {
          setPresetCedulaToLoad(cedula);
          setVipModalInitialTab("validate");
          setIsVipModalOpen(true);
        }}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A2540] text-white flex flex-col items-center justify-center gap-3">
          <Snowflake className="w-10 h-10 text-[#00B4D8] animate-spin" />
          <p className="text-sm font-bold tracking-wider">
            Cargando TECNI JIREH...
          </p>
        </div>
      }
    >
      <TecniJirehContent />
    </Suspense>
  );
}
