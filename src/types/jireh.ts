export type ServiceCategoryId =
  | "todos"
  | "split"
  | "neveras"
  | "cuartos-frios"
  | "chiller"
  | "lavadoras"
  | "urgencias";

export type JirehCity = "Todas" | "Maracay" | "Valencia" | "Caracas";

export type VipTier = "Bronce" | "Plata" | "Oro" | "Diamante Jireh";

export type JirehAccountRole = "tecnico" | "usuario";

export type JirehBranch = "Principal" | "Campo" | "Jabillos" | "Sucre";

/**
 * Estados de control de calidad del Administrador de Refrigeraciones Jireh:
 * - "publicado": Visible públicamente en la cartelera y mapa de TECNI JIREH.
 * - "pendiente": Recién registrado o postulado; esperando revisión del Administrador.
 * - "pausado": Oculto temporalmente o suspendido por el Administrador.
 */
export type TechnicianPublicationStatus = "publicado" | "pendiente" | "pausado";

/**
 * Representa al cliente o técnico registrado en el ecosistema de
 * Refrigeraciones Jireh (https://clientes-jireh-vip.vercel.app)
 */
export interface JirehVipClient {
  id: string;
  cedula: string; // CI/RUC en Clientes Jireh VIP (ej. "23790219")
  nombreCompleto: string;
  telefono: string;
  email?: string;
  direccion?: string;
  tipoCuenta?: JirehAccountRole;
  ciudad: Exclude<JirehCity, "Todas">;
  puntosAcumulados: number; // Ej: 71.77, 71.00, 60.18
  comprasAcumuladasUSD?: number; // Ej: 3390.35, 3585.56
  sedeFrecuente?: JirehBranch;
  nivelVip: VipTier;
  codigoReferidoVip: string; // Código para descuentos y puntos en refrijireh.com
  fechaRegistro: string;
  comprasRecientesRepuestos?: string[];
  activo: boolean;
}

/**
 * Datos del formulario de Registro Unificado (Club VIP Jireh + TECNI JIREH)
 */
export interface NewJirehEcosystemRegistration {
  nombreCompleto: string;
  cedula: string;
  telefono: string;
  direccion: string;
  ciudad: Exclude<JirehCity, "Todas">;
  sedeFrecuente: JirehBranch;
  tipoCuenta: JirehAccountRole;
  email: string;
  password: string;
  // Campos adicionales si se registra como Técnico
  especialidades?: ServiceCategoryId[];
  etiquetaDestacada?: string;
  tarifaDiagnosticoUSD?: number;
  anosExperiencia?: number;
  disponibleUrgenciasHoy?: boolean;
}

export interface TechnicianReview {
  id: string;
  autor: string;
  zona: string;
  calificacion: number;
  comentario: string;
  servicioRealizado: string;
  fecha: string;
}

/**
 * Une la cuenta del Cliente VIP de Refrigeraciones Jireh con su Perfil Técnico público en TECNI JIREH
 */
export interface TechnicianProfile {
  id: string;
  rankingVip?: number; // Posición #1 al #10 en el ranking de Clientes Jireh VIP
  cedula: string;
  nombre: string;
  fotoUrl: string;
  telefonoWhatsapp: string;
  ciudad: Exclude<JirehCity, "Todas">;
  sedeJireh?: string; // Principal, Campo, Jabillos, Sucre
  zonasCobertura: string[];
  especialidades: ServiceCategoryId[];
  etiquetaDestacada: string;
  bio: string;
  anosExperiencia: number;
  tarifaDiagnosticoUSD: number;
  modalidadTarifa: "por diagnóstico" | "por servicio base" | "visita técnica";
  calificacion: number;
  totalResenas: number;
  trabajosCompletados: number;
  tiempoRespuestaMin: number;
  disponibleUrgenciasHoy: boolean;

  // Sincronización con Portal VIP (https://clientes-jireh-vip.vercel.app)
  esVipVerificado: boolean;
  puntosJirehVip: number;
  comprasAcumuladasUSD?: number;
  nivelVip?: VipTier;
  codigoVipRefriJireh?: string;

  // Control de Publicación del Administrador de Refrigeraciones Jireh
  estadoPublicacion?: TechnicianPublicationStatus;
  destacadoManualAdmin?: boolean;
  notaInternaAdmin?: string;
  fechaSolicitud?: string;

  // Coordenadas para el Mapa Interactivo
  coordenadas: {
    lat: number;
    lng: number;
    /** Posición porcentual relativa dentro del mapa interactivo de la zona */
    mapX: number;
    mapY: number;
  };

  portafolioFotos: {
    url: string;
    titulo: string;
  }[];

  resenasDestacadas: TechnicianReview[];
  insigniaRapida?: "Verificado" | "Rápido" | "Top VIP" | "Maestro Frío";
}

export interface ServiceCategoryItem {
  id: ServiceCategoryId;
  label: string;
  shortLabel: string;
  description: string;
  badge?: string;
}

export interface SparePartQuoteRequest {
  tecnicoId: string;
  tecnicoNombre: string;
  codigoVip?: string;
  equipoMarcaModelo: string;
  repuestoRequerido: string;
  ciudadEntrega: string;
  urgencia: "Inmediata (Hoy)" | "24-48 Horas" | "Consulta de Precio";
}
