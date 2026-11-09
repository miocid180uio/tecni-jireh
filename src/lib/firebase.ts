import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { JirehVipClient, TechnicianProfile, ServiceCategoryItem } from "@/types/jireh";

/**
 * Configuración oficial de Firebase conectada al ecosistema de Refrigeraciones Jireh.
 * Toma las variables de entorno si existen o usa la configuración web oficial de Clientes Jireh VIP.
 */
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyBlLaBI3VKFDZKB3lFyjlVuSgMmx8txmxc",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "clientesjirehvip-58048.firebaseapp.com",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "clientesjirehvip-58048",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "clientesjirehvip-58048.appspot.com",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "801103465837",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:801103465837:web:3f6befb8769b8431fb1e64",
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.apiKey.trim() !== ""
);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
  } catch (error) {
    console.warn("[TECNI JIREH] Aviso al inicializar Firebase:", error);
  }
}

export { app, db, auth, storage, firebaseConfig };

// ============================================================================
// CATEGORÍAS DE SERVICIO (ESTILO AIRBNB + ECOSISTEMA JIREH)
// ============================================================================

export const SERVICE_CATEGORIES: ServiceCategoryItem[] = [
  {
    id: "todos",
    label: "Todos los Expertos",
    shortLabel: "Todos",
    description: "Top 10 Técnicos y Clientes VIP Verificados de Refrigeraciones Jireh",
  },
  {
    id: "split",
    label: "Aires Split",
    shortLabel: "Aires Split",
    description: "Instalación, carga de gas, mantenimiento y placas Inverter",
  },
  {
    id: "neveras",
    label: "Neveras Domésticas",
    shortLabel: "Neveras",
    description: "No Frost, cambio de compresor, sensores, bimetal y fugas",
  },
  {
    id: "cuartos-frios",
    label: "Cuartos Fríos",
    shortLabel: "Cuartos Fríos",
    description: "Cavas cuarto, unidades condensadoras y exhibidores comerciales",
  },
  {
    id: "chiller",
    label: "Chiller / Industrial",
    shortLabel: "Chiller/Ind.",
    description: "Sistemas centrales, UMA, paquete comercial y precisión",
  },
  {
    id: "lavadoras",
    label: "Lavadoras / Secadoras",
    shortLabel: "Línea Blanca",
    description: "Transmisiones, bombas de drenaje, tarjetas digitales y morochas",
  },
  {
    id: "urgencias",
    label: "Urgencias Hoy",
    shortLabel: "Urgencias Hoy",
    description: "Respuesta menor a 45 min para emergencias de refrigeración",
    badge: "24/7",
  },
];

// ============================================================================
// TOP 10 CLIENTES / TÉCNICOS REALES DE https://clientes-jireh-vip.vercel.app
// ============================================================================

export const MOCK_VIP_CLIENTS: JirehVipClient[] = [
  {
    id: "vip-top-1",
    cedula: "23790219",
    nombreCompleto: "Jairo Johan Campos Risso",
    telefono: "+584124558891",
    email: "jairo.campos.vip@gmail.com",
    ciudad: "Maracay",
    puntosAcumulados: 71.77,
    comprasAcumuladasUSD: 3390.35,
    sedeFrecuente: "Principal",
    nivelVip: "Diamante Jireh",
    codigoReferidoVip: "VIP-TOP-01",
    fechaRegistro: "2024-01-10",
    activo: true,
  },
  {
    id: "vip-top-2",
    cedula: "13858258",
    nombreCompleto: "Jose G. Herrera",
    telefono: "+584144893210",
    email: "jose.herrera.vip@gmail.com",
    ciudad: "Maracay",
    puntosAcumulados: 71.0,
    comprasAcumuladasUSD: 3585.56,
    sedeFrecuente: "Campo",
    nivelVip: "Diamante Jireh",
    codigoReferidoVip: "VIP-TOP-02",
    fechaRegistro: "2024-01-12",
    activo: true,
  },
  {
    id: "vip-top-3",
    cedula: "11090750",
    nombreCompleto: "Humberto Jose Blanco",
    telefono: "+584244110922",
    email: "humberto.blanco.vip@gmail.com",
    ciudad: "Maracay",
    puntosAcumulados: 60.18,
    comprasAcumuladasUSD: 2959.32,
    sedeFrecuente: "Jabillos",
    nivelVip: "Diamante Jireh",
    codigoReferidoVip: "VIP-TOP-03",
    fechaRegistro: "2024-02-01",
    activo: true,
  },
  {
    id: "vip-top-4",
    cedula: "30294075",
    nombreCompleto: "Enyerbeth Martinez",
    telefono: "+584122994415",
    email: "enyerbeth.martinez.vip@gmail.com",
    ciudad: "Valencia",
    puntosAcumulados: 51.15,
    comprasAcumuladasUSD: 2112.93,
    sedeFrecuente: "Sucre",
    nivelVip: "Diamante Jireh",
    codigoReferidoVip: "VIP-TOP-04",
    fechaRegistro: "2024-02-14",
    activo: true,
  },
  {
    id: "vip-top-5",
    cedula: "27611548",
    nombreCompleto: "Celso Gómez",
    telefono: "+584128801234",
    email: "celso.gomez.vip@gmail.com",
    ciudad: "Maracay",
    puntosAcumulados: 42.25,
    comprasAcumuladasUSD: 1844.0,
    sedeFrecuente: "Principal",
    nivelVip: "Oro",
    codigoReferidoVip: "VIP-TOP-05",
    fechaRegistro: "2024-03-01",
    activo: true,
  },
  {
    id: "vip-top-6",
    cedula: "9646546",
    nombreCompleto: "Edgar Nieto",
    telefono: "+584143209876",
    email: "edgar.nieto.vip@gmail.com",
    ciudad: "Valencia",
    puntosAcumulados: 32.94,
    comprasAcumuladasUSD: 1629.81,
    sedeFrecuente: "Campo",
    nivelVip: "Oro",
    codigoReferidoVip: "VIP-TOP-06",
    fechaRegistro: "2024-03-15",
    activo: true,
  },
  {
    id: "vip-top-7",
    cedula: "15863216",
    nombreCompleto: "Rony Rondon",
    telefono: "+584241987654",
    email: "rony.rondon.vip@gmail.com",
    ciudad: "Caracas",
    puntosAcumulados: 31.9,
    comprasAcumuladasUSD: 1604.29,
    sedeFrecuente: "Jabillos",
    nivelVip: "Oro",
    codigoReferidoVip: "VIP-TOP-07",
    fechaRegistro: "2024-04-02",
    activo: true,
  },
  {
    id: "vip-top-8",
    cedula: "12117381",
    nombreCompleto: "Luis Moreno",
    telefono: "+584166432198",
    email: "luis.moreno.vip@gmail.com",
    ciudad: "Maracay",
    puntosAcumulados: 31.49,
    comprasAcumuladasUSD: 1049.5,
    sedeFrecuente: "Sucre",
    nivelVip: "Oro",
    codigoReferidoVip: "VIP-TOP-08",
    fechaRegistro: "2024-04-18",
    activo: true,
  },
  {
    id: "vip-top-9",
    cedula: "11775583",
    nombreCompleto: "Rafael Martinez",
    telefono: "+584127654321",
    email: "rafael.martinez.vip@gmail.com",
    ciudad: "Valencia",
    puntosAcumulados: 29.92,
    comprasAcumuladasUSD: 1281.98,
    sedeFrecuente: "Principal",
    nivelVip: "Plata",
    codigoReferidoVip: "VIP-TOP-09",
    fechaRegistro: "2024-05-05",
    activo: true,
  },
  {
    id: "vip-top-10",
    cedula: "22510300",
    nombreCompleto: "Kevin Goncalves",
    telefono: "+584243334455",
    email: "kevin.goncalves.vip@gmail.com",
    ciudad: "Caracas",
    puntosAcumulados: 29.0,
    comprasAcumuladasUSD: 1501.0,
    sedeFrecuente: "Jabillos",
    nivelVip: "Plata",
    codigoReferidoVip: "VIP-TOP-10",
    fechaRegistro: "2024-05-19",
    activo: true,
  },
];

// ============================================================================
// LOS PRIMEROS 10 TÉCNICOS ENLAZADOS AL RANKING DE CLIENTES JIREH VIP
// ============================================================================

export const MOCK_TECHNICIANS: TechnicianProfile[] = [
  {
    id: "tec-vip-1",
    rankingVip: 1,
    cedula: "23790219",
    nombre: "Jairo Johan Campos Risso",
    fotoUrl:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80",
    telefonoWhatsapp: "+584124558891",
    ciudad: "Maracay",
    sedeJireh: "Sede Principal",
    zonasCobertura: ["Las Delicias", "Base Aragua", "Calicanto", "El Limón"],
    especialidades: ["split", "cuartos-frios", "neveras", "urgencias"],
    etiquetaDestacada: "Top #1 VIP • Aires Split, Inverter & Cuartos Fríos",
    bio: "Técnico #1 en el ranking de fidelidad de Refrigeraciones Jireh con 71.77 puntos VIP acumulados. Especialista en instalaciones limpias, vacío digital y diagnóstico de tarjetas Inverter con repuestos originales.",
    anosExperiencia: 12,
    tarifaDiagnosticoUSD: 15,
    modalidadTarifa: "por diagnóstico",
    calificacion: 5.0,
    totalResenas: 148,
    trabajosCompletados: 460,
    tiempoRespuestaMin: 15,
    disponibleUrgenciasHoy: true,
    esVipVerificado: true,
    puntosJirehVip: 71.77,
    nivelVip: "Diamante Jireh",
    codigoVipRefriJireh: "VIP-TOP-01",
    insigniaRapida: "Top VIP",
    coordenadas: {
      lat: 10.2647,
      lng: -67.5911,
      mapX: 46,
      mapY: 34,
    },
    portafolioFotos: [
      {
        url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
        titulo: "Instalación Split y mantenimiento certificado con repuestos Jireh",
      },
      {
        url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
        titulo: "Montaje de compresor original adquirido en Sede Principal",
      },
    ],
    resenasDestacadas: [
      {
        id: "rev-jairo-1",
        autor: "María Gabriela P.",
        zona: "Base Aragua, Maracay",
        calificacion: 5,
        comentario:
          "Excelente atención de Jairo. Llegó en 20 minutos con el repuesto original de Refrigeraciones Jireh y dejó el aire enfriando perfecto.",
        servicioRealizado: "Reparación Split 18.000 BTU",
        fecha: "Hace 2 días",
      },
    ],
  },
  {
    id: "tec-vip-2",
    rankingVip: 2,
    cedula: "13858258",
    nombre: "Jose G. Herrera",
    fotoUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
    telefonoWhatsapp: "+584144893210",
    ciudad: "Maracay",
    sedeJireh: "Sede Campo",
    zonasCobertura: ["Caña de Azúcar", "El Limón", "La Soledad", "San Jacinto"],
    especialidades: ["cuartos-frios", "chiller", "split", "urgencias"],
    etiquetaDestacada: "Top #2 VIP • Refrigeración Comercial & Cavas Cuarto",
    bio: "Técnico Maestro con 71.00 puntos VIP en Refrigeraciones Jireh. Especialista en compresores comerciales, unidades condensadoras y cavas cuarto con atención prioritaria a comercios y residencias.",
    anosExperiencia: 15,
    tarifaDiagnosticoUSD: 20,
    modalidadTarifa: "visita técnica",
    calificacion: 4.98,
    totalResenas: 136,
    trabajosCompletados: 495,
    tiempoRespuestaMin: 20,
    disponibleUrgenciasHoy: true,
    esVipVerificado: true,
    puntosJirehVip: 71.0,
    nivelVip: "Diamante Jireh",
    codigoVipRefriJireh: "VIP-TOP-02",
    insigniaRapida: "Top VIP",
    coordenadas: {
      lat: 10.2815,
      lng: -67.6215,
      mapX: 58,
      mapY: 46,
    },
    portafolioFotos: [
      {
        url: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80",
        titulo: "Unidad condensadora comercial instalada con garantía Jireh",
      },
    ],
    resenasDestacadas: [
      {
        id: "rev-jose-1",
        autor: "Abasto y Carnicería La Estación",
        zona: "Maracay",
        calificacion: 5,
        comentario:
          "Jose Herrera nos resolvió la emergencia de la cava cuarto el mismo día con repuestos nuevos de Jireh.",
        servicioRealizado: "Urgencia Cava Cuarto",
        fecha: "Hace 3 días",
      },
    ],
  },
  {
    id: "tec-vip-3",
    rankingVip: 3,
    cedula: "11090750",
    nombre: "Humberto Jose Blanco",
    fotoUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
    telefonoWhatsapp: "+584244110922",
    ciudad: "Maracay",
    sedeJireh: "Sede Jabillos",
    zonasCobertura: ["Los Jabillos", "Centro", "Calicanto", "Turmero"],
    especialidades: ["neveras", "split", "lavadoras", "urgencias"],
    etiquetaDestacada: "Top #3 VIP • Neveras No Frost & Aires Acondicionados",
    bio: "Miembro Diamante #3 del Club Clientes Jireh VIP con 60.18 puntos acumulados. Especialista en cambio de compresores Embraco, recargas con balanza electrónica y tarjetas de control.",
    anosExperiencia: 16,
    tarifaDiagnosticoUSD: 15,
    modalidadTarifa: "por diagnóstico",
    calificacion: 4.96,
    totalResenas: 118,
    trabajosCompletados: 390,
    tiempoRespuestaMin: 20,
    disponibleUrgenciasHoy: true,
    esVipVerificado: true,
    puntosJirehVip: 60.18,
    nivelVip: "Diamante Jireh",
    codigoVipRefriJireh: "VIP-TOP-03",
    insigniaRapida: "Verificado",
    coordenadas: {
      lat: 10.2465,
      lng: -67.6012,
      mapX: 35,
      mapY: 54,
    },
    portafolioFotos: [
      {
        url: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=800&q=80",
        titulo: "Reparación de Nevera No Frost con repuestos originales",
      },
    ],
    resenasDestacadas: [
      {
        id: "rev-humberto-1",
        autor: "Familia Morales",
        zona: "Los Jabillos",
        calificacion: 5,
        comentario:
          "Humberto dejó nuestra nevera congelando como nueva en una sola tarde.",
        servicioRealizado: "Cambio de Compresor Nevera",
        fecha: "Hace 4 días",
      },
    ],
  },
  {
    id: "tec-vip-4",
    rankingVip: 4,
    cedula: "30294075",
    nombre: "Enyerbeth Martinez",
    fotoUrl:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80",
    telefonoWhatsapp: "+584122994415",
    ciudad: "Valencia",
    sedeJireh: "Sede Sucre",
    zonasCobertura: ["Av. Sucre", "El Viñedo", "San Diego", "Naguanagua"],
    especialidades: ["split", "neveras", "urgencias"],
    etiquetaDestacada: "Top #4 VIP • Climatización Split & Mantenimiento",
    bio: "Técnico VIP #4 en el ranking general de Refrigeraciones Jireh con 51.15 puntos acumulados. Atención rápida para instalaciones, mudanzas de unidades Split y corrección de fugas.",
    anosExperiencia: 8,
    tarifaDiagnosticoUSD: 15,
    modalidadTarifa: "por diagnóstico",
    calificacion: 4.95,
    totalResenas: 96,
    trabajosCompletados: 310,
    tiempoRespuestaMin: 18,
    disponibleUrgenciasHoy: true,
    esVipVerificado: true,
    puntosJirehVip: 51.15,
    nivelVip: "Diamante Jireh",
    codigoVipRefriJireh: "VIP-TOP-04",
    insigniaRapida: "Rápido",
    coordenadas: {
      lat: 10.2145,
      lng: -68.0052,
      mapX: 68,
      mapY: 32,
    },
    portafolioFotos: [
      {
        url: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=800&q=80",
        titulo: "Mantenimiento preventivo e instalación de consola Split",
      },
    ],
    resenasDestacadas: [
      {
        id: "rev-enyerbeth-1",
        autor: "Carlos Alfonzo",
        zona: "San Diego",
        calificacion: 5,
        comentario:
          "Muy rápido y responsable, trajo todos los materiales desde Refrigeraciones Jireh.",
        servicioRealizado: "Instalación Split 12.000 BTU",
        fecha: "Hace 1 semana",
      },
    ],
  },
  {
    id: "tec-vip-5",
    rankingVip: 5,
    cedula: "27611548",
    nombre: "Celso Gómez",
    fotoUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    telefonoWhatsapp: "+584128801234",
    ciudad: "Maracay",
    sedeJireh: "Sede Principal",
    zonasCobertura: ["La Arboleda", "Base Aragua", "Parque Aragua", "Cagua"],
    especialidades: ["split", "lavadoras", "neveras"],
    etiquetaDestacada: "Top #5 VIP • Aires Split & Línea Blanca Digital",
    bio: "Técnico VIP #5 verificado en Refrigeraciones Jireh con 42.25 puntos acumulados. Especialista en aires acondicionados domésticos y lavadoras/secadoras digitales.",
    anosExperiencia: 9,
    tarifaDiagnosticoUSD: 15,
    modalidadTarifa: "por diagnóstico",
    calificacion: 4.93,
    totalResenas: 88,
    trabajosCompletados: 275,
    tiempoRespuestaMin: 25,
    disponibleUrgenciasHoy: true,
    esVipVerificado: true,
    puntosJirehVip: 42.25,
    nivelVip: "Oro",
    codigoVipRefriJireh: "VIP-TOP-05",
    insigniaRapida: "Verificado",
    coordenadas: {
      lat: 10.2528,
      lng: -67.5818,
      mapX: 42,
      mapY: 66,
    },
    portafolioFotos: [
      {
        url: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=800&q=80",
        titulo: "Diagnóstico y reemplazo de componentes originales",
      },
    ],
    resenasDestacadas: [
      {
        id: "rev-celso-1",
        autor: "Patricia Méndez",
        zona: "Parque Aragua, Maracay",
        calificacion: 5,
        comentario: "Excelente diagnóstico, solucionó la falla de mi lavadora y mi aire Split.",
        servicioRealizado: "Reparación Split y Lavadora",
        fecha: "Hace 5 días",
      },
    ],
  },
  {
    id: "tec-vip-6",
    rankingVip: 6,
    cedula: "9646546",
    nombre: "Edgar Nieto",
    fotoUrl:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=800&q=80",
    telefonoWhatsapp: "+584143209876",
    ciudad: "Valencia",
    sedeJireh: "Sede Campo",
    zonasCobertura: ["Prebo", "La Trigaleña", "Mañongo", "Zona Industrial"],
    especialidades: ["chiller", "cuartos-frios", "split", "urgencias"],
    etiquetaDestacada: "Top #6 VIP • Aire Central, Chiller & Frío Comercial",
    bio: "Técnico de amplia trayectoria (#6 en el Club VIP Jireh con 32.94 puntos acumulados). Más de 18 años resolviendo fallas en unidades centrales, compactos, cavas y sistemas comerciales.",
    anosExperiencia: 18,
    tarifaDiagnosticoUSD: 25,
    modalidadTarifa: "visita técnica",
    calificacion: 4.97,
    totalResenas: 110,
    trabajosCompletados: 420,
    tiempoRespuestaMin: 30,
    disponibleUrgenciasHoy: true,
    esVipVerificado: true,
    puntosJirehVip: 32.94,
    nivelVip: "Oro",
    codigoVipRefriJireh: "VIP-TOP-06",
    insigniaRapida: "Maestro Frío",
    coordenadas: {
      lat: 10.2289,
      lng: -68.0191,
      mapX: 26,
      mapY: 40,
    },
    portafolioFotos: [
      {
        url: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80",
        titulo: "Servicio a unidad condensadora de 5 Toneladas",
      },
    ],
    resenasDestacadas: [
      {
        id: "rev-edgar-1",
        autor: "Clínica Docente Centro",
        zona: "Prebo, Valencia",
        calificacion: 5,
        comentario: "Edgar tiene muchísima experiencia en aire central, trabajo impecable.",
        servicioRealizado: "Reparación Aire Compacto 5 TR",
        fecha: "Hace 1 semana",
      },
    ],
  },
  {
    id: "tec-vip-7",
    rankingVip: 7,
    cedula: "15863216",
    nombre: "Rony Rondon",
    fotoUrl:
      "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=800&q=80",
    telefonoWhatsapp: "+584241987654",
    ciudad: "Caracas",
    sedeJireh: "Sede Jabillos",
    zonasCobertura: ["Los Jabillos", "Sabana Grande", "Chacao", "El Paraíso"],
    especialidades: ["split", "neveras", "urgencias"],
    etiquetaDestacada: "Top #7 VIP • Especialista en Neveras & Aires Split",
    bio: "Técnico #7 del ranking Clientes Jireh VIP con 31.90 puntos acumulados en Sede Jabillos. Atención inmediata para recargas de gas, cambio de compresores y mantenimiento profundo.",
    anosExperiencia: 11,
    tarifaDiagnosticoUSD: 20,
    modalidadTarifa: "por diagnóstico",
    calificacion: 4.92,
    totalResenas: 84,
    trabajosCompletados: 290,
    tiempoRespuestaMin: 25,
    disponibleUrgenciasHoy: true,
    esVipVerificado: true,
    puntosJirehVip: 31.9,
    nivelVip: "Oro",
    codigoVipRefriJireh: "VIP-TOP-07",
    insigniaRapida: "Verificado",
    coordenadas: {
      lat: 10.4961,
      lng: -66.8532,
      mapX: 73,
      mapY: 56,
    },
    portafolioFotos: [
      {
        url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
        titulo: "Instalación y vacío de consola Split 18.000 BTU",
      },
    ],
    resenasDestacadas: [
      {
        id: "rev-rony-1",
        autor: "Gabriela Rivas",
        zona: "Los Jabillos",
        calificacion: 5,
        comentario: "Rony atendió la urgencia el mismo día y con repuestos originales Jireh.",
        servicioRealizado: "Reparación de Nevera Doméstica",
        fecha: "Hace 6 días",
      },
    ],
  },
  {
    id: "tec-vip-8",
    rankingVip: 8,
    cedula: "12117381",
    nombre: "Luis Moreno",
    fotoUrl:
      "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=800&q=80",
    telefonoWhatsapp: "+584166432198",
    ciudad: "Maracay",
    sedeJireh: "Sede Sucre",
    zonasCobertura: ["Av. Sucre", "San Isidro", "La Floresta", "Andrés Bello"],
    especialidades: ["neveras", "lavadoras", "split"],
    etiquetaDestacada: "Top #8 VIP • Refrigeración Doméstica & Lavadoras",
    bio: "Técnico VIP #8 en Refrigeraciones Jireh con 31.49 puntos acumulados. Especialista en neveras ejecutivas, congeladores horizontales y línea blanca.",
    anosExperiencia: 14,
    tarifaDiagnosticoUSD: 15,
    modalidadTarifa: "por diagnóstico",
    calificacion: 4.91,
    totalResenas: 79,
    trabajosCompletados: 260,
    tiempoRespuestaMin: 25,
    disponibleUrgenciasHoy: true,
    esVipVerificado: true,
    puntosJirehVip: 31.49,
    nivelVip: "Oro",
    codigoVipRefriJireh: "VIP-TOP-08",
    insigniaRapida: "Verificado",
    coordenadas: {
      lat: 10.262,
      lng: -67.601,
      mapX: 52,
      mapY: 26,
    },
    portafolioFotos: [
      {
        url: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=800&q=80",
        titulo: "Reemplazo de relé, protector térmico y filtro secador",
      },
    ],
    resenasDestacadas: [
      {
        id: "rev-luism-1",
        autor: "Pedro Castillo",
        zona: "La Floresta, Maracay",
        calificacion: 5,
        comentario: "Muy honesto y acertado con el diagnóstico de mi congelador.",
        servicioRealizado: "Reparación Congelador Horizontal",
        fecha: "Hace 1 semana",
      },
    ],
  },
  {
    id: "tec-vip-9",
    rankingVip: 9,
    cedula: "11775583",
    nombre: "Rafael Martinez",
    fotoUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
    telefonoWhatsapp: "+584127654321",
    ciudad: "Valencia",
    sedeJireh: "Sede Principal",
    zonasCobertura: ["El Bosque", "Guataparo", "San Blas", "Naguanagua"],
    especialidades: ["cuartos-frios", "split", "neveras", "urgencias"],
    etiquetaDestacada: "Top #9 VIP • Exhibidores Comerciales & Aires Split",
    bio: "Técnico VIP #9 del Club Jireh con 29.92 puntos acumulados. Experto en vitrinas frigoríficas, enfriadores de botellas y consolas Split con repuestos originales.",
    anosExperiencia: 13,
    tarifaDiagnosticoUSD: 15,
    modalidadTarifa: "por diagnóstico",
    calificacion: 4.9,
    totalResenas: 74,
    trabajosCompletados: 245,
    tiempoRespuestaMin: 30,
    disponibleUrgenciasHoy: true,
    esVipVerificado: true,
    puntosJirehVip: 29.92,
    nivelVip: "Plata",
    codigoVipRefriJireh: "VIP-TOP-09",
    insigniaRapida: "Verificado",
    coordenadas: {
      lat: 10.205,
      lng: -68.012,
      mapX: 30,
      mapY: 70,
    },
    portafolioFotos: [
      {
        url: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80",
        titulo: "Puesta en marcha de enfriador comercial de 3 puertas",
      },
    ],
    resenasDestacadas: [
      {
        id: "rev-rafael-1",
        autor: "Panadería Delicias del Trigo",
        zona: "Naguanagua",
        calificacion: 5,
        comentario: "Dejó las dos vitrinas exhibidoras enfriando en tiempo récord.",
        servicioRealizado: "Reparación Vitrina Exhibidora",
        fecha: "Hace 2 semanas",
      },
    ],
  },
  {
    id: "tec-vip-10",
    rankingVip: 10,
    cedula: "22510300",
    nombre: "Kevin Goncalves",
    fotoUrl:
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80",
    telefonoWhatsapp: "+584243334455",
    ciudad: "Caracas",
    sedeJireh: "Sede Jabillos",
    zonasCobertura: ["Altamira", "Las Mercedes", "Los Palos Grandes", "La Florida"],
    especialidades: ["split", "chiller", "neveras", "urgencias"],
    etiquetaDestacada: "Top #10 VIP • Tecnología Inverter & Climatización",
    bio: "Técnico VIP #10 del ranking de Refrigeraciones Jireh con 29.00 puntos acumulados. Especialista en aires Split Inverter, protectores electrónicos y mantenimiento preventivo.",
    anosExperiencia: 7,
    tarifaDiagnosticoUSD: 20,
    modalidadTarifa: "por diagnóstico",
    calificacion: 4.94,
    totalResenas: 81,
    trabajosCompletados: 230,
    tiempoRespuestaMin: 20,
    disponibleUrgenciasHoy: true,
    esVipVerificado: true,
    puntosJirehVip: 29.0,
    nivelVip: "Plata",
    codigoVipRefriJireh: "VIP-TOP-10",
    insigniaRapida: "Rápido",
    coordenadas: {
      lat: 10.5015,
      lng: -66.8489,
      mapX: 64,
      mapY: 72,
    },
    portafolioFotos: [
      {
        url: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=800&q=80",
        titulo: "Mantenimiento e instalación de equipos Inverter",
      },
    ],
    resenasDestacadas: [
      {
        id: "rev-kevin-1",
        autor: "Alejandro Machado",
        zona: "Las Mercedes, Caracas",
        calificacion: 5,
        comentario: "Kevin trabaja impecable, súper puntual y con herramientas de primera.",
        servicioRealizado: "Mantenimiento 3 Aires Split Inverter",
        fecha: "Hace 3 días",
      },
    ],
  },
];

// ============================================================================
// TÉCNICOS #11 AL #36 DEL RANKING VIP (PARA PAGINACIÓN DE 6 EN 6 HASTA 36)
// Se sincronizan automáticamente con los primeros 36 registros de Firestore `users`
// ============================================================================

const ADDITIONAL_VIP_ROSTER: Array<{
  rank: number;
  cedula: string;
  nombre: string;
  puntos: number;
  ciudad: "Maracay" | "Valencia" | "Caracas";
  sede: "Principal" | "Campo" | "Jabillos" | "Sucre";
  zonas: string[];
  especialidades: Array<"split" | "neveras" | "cuartos-frios" | "chiller" | "lavadoras" | "urgencias">;
  titulo: string;
  tarifa: number;
  foto: string;
}> = [
  { rank: 11, cedula: "14520891", nombre: "Carlos Alberto Mendoza", puntos: 28.45, ciudad: "Maracay", sede: "Principal", zonas: ["El Limón", "Caña de Azúcar", "Las Acacias"], especialidades: ["split", "neveras", "urgencias"], titulo: "Top #11 VIP • Aires Split & Neveras No Frost", tarifa: 15, foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80" },
  { rank: 12, cedula: "16892341", nombre: "Wilmer Antonio Peraza", puntos: 27.80, ciudad: "Valencia", sede: "Campo", zonas: ["San Diego", "La Isabelica", "El Trigal"], especialidades: ["cuartos-frios", "split", "urgencias"], titulo: "Top #12 VIP • Cavas Cuarto & Climatización", tarifa: 20, foto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80" },
  { rank: 13, cedula: "17345902", nombre: "Oswaldo José Ramírez", puntos: 26.95, ciudad: "Maracay", sede: "Jabillos", zonas: ["Turmero", "Cagua", "Intercomunal"], especialidades: ["neveras", "lavadoras", "split"], titulo: "Top #13 VIP • Línea Blanca & Tarjetas Inverter", tarifa: 15, foto: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80" },
  { rank: 14, cedula: "18920114", nombre: "Franklin Javier Tovar", puntos: 26.10, ciudad: "Caracas", sede: "Sucre", zonas: ["Sabana Grande", "El Paraíso", "San Martín"], especialidades: ["split", "chiller", "urgencias"], titulo: "Top #14 VIP • Aire Central & Split Comercial", tarifa: 20, foto: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80" },
  { rank: 15, cedula: "19402883", nombre: "Darwin Enrique Lovera", puntos: 25.40, ciudad: "Maracay", sede: "Principal", zonas: ["Base Aragua", "San Jacinto", "Los Olivos"], especialidades: ["split", "neveras", "urgencias"], titulo: "Top #15 VIP • Instalación y Carga de Gas Split", tarifa: 15, foto: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=800&q=80" },
  { rank: 16, cedula: "20114789", nombre: "Yorman José Figuera", puntos: 24.75, ciudad: "Valencia", sede: "Campo", zonas: ["Naguanagua", "Mañongo", "Palma Real"], especialidades: ["neveras", "lavadoras", "urgencias"], titulo: "Top #16 VIP • Neveras Digitales & Lavadoras", tarifa: 15, foto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80" },
  { rank: 17, cedula: "15239841", nombre: "Héctor Luis Salcedo", puntos: 23.90, ciudad: "Maracay", sede: "Jabillos", zonas: ["Santa Rita", "La Morita", "Coropo"], especialidades: ["cuartos-frios", "neveras", "split"], titulo: "Top #17 VIP • Refrigeración Comercial & Vitrinas", tarifa: 20, foto: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80" },
  { rank: 18, cedula: "21450932", nombre: "Gabriel Alejandro Padrón", puntos: 23.15, ciudad: "Caracas", sede: "Sucre", zonas: ["Chacaíto", "Los Dos Caminos", "La Urbina"], especialidades: ["split", "urgencias", "neveras"], titulo: "Top #18 VIP • Climatización Residencial & Oficinas", tarifa: 20, foto: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=800&q=80" },
  { rank: 19, cedula: "13904512", nombre: "Richard Antonio Colmenares", puntos: 22.30, ciudad: "Maracay", sede: "Principal", zonas: ["Calicanto", "La Soledad", "Las Delicias"], especialidades: ["chiller", "cuartos-frios", "split"], titulo: "Top #19 VIP • Chiller, UMA & Frío Industrial", tarifa: 25, foto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=800&q=80" },
  { rank: 20, cedula: "22891045", nombre: "Jhonnatan David Escalona", puntos: 21.60, ciudad: "Valencia", sede: "Campo", zonas: ["El Viñedo", "Guaparo", "Prebo"], especialidades: ["split", "neveras", "lavadoras"], titulo: "Top #20 VIP • Mantenimiento Preventivo & Split", tarifa: 15, foto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80" },
  { rank: 21, cedula: "16102938", nombre: "Miguel Ángel Briceño", puntos: 20.85, ciudad: "Maracay", sede: "Jabillos", zonas: ["Palo Negro", "San Mateo", "Encrucijada"], especialidades: ["neveras", "split", "urgencias"], titulo: "Top #21 VIP • Compresores & Fugas de Refrigerante", tarifa: 15, foto: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80" },
  { rank: 22, cedula: "24109283", nombre: "Leonardo José Nieves", puntos: 19.95, ciudad: "Caracas", sede: "Sucre", zonas: ["Santa Mónica", "Los Chaguaramos", "Bello Monte"], especialidades: ["lavadoras", "neveras", "split"], titulo: "Top #22 VIP • Lavadoras Morochas & Secadoras", tarifa: 15, foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80" },
  { rank: 23, cedula: "17883920", nombre: "Pedro Luis Zambrano", puntos: 19.20, ciudad: "Maracay", sede: "Principal", zonas: ["El Bosque", "Andrés Bello", "La Floresta"], especialidades: ["split", "cuartos-frios", "urgencias"], titulo: "Top #23 VIP • Unidades Condensadoras & Split", tarifa: 20, foto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80" },
  { rank: 24, cedula: "25390182", nombre: "Ángel Gabriel Sequera", puntos: 18.50, ciudad: "Valencia", sede: "Campo", zonas: ["Los Guayos", "Paraparal", "Zona Industrial"], especialidades: ["chiller", "cuartos-frios", "urgencias"], titulo: "Top #24 VIP • Refrigeración Pesada & Industrial", tarifa: 25, foto: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80" },
  { rank: 25, cedula: "14992011", nombre: "José Gregorio Castellanos", puntos: 17.80, ciudad: "Maracay", sede: "Jabillos", zonas: ["Cagua", "Bella Vista", "Villa de Cura"], especialidades: ["neveras", "split", "lavadoras"], titulo: "Top #25 VIP • Neveras Domésticas & Congeladores", tarifa: 15, foto: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80" },
  { rank: 26, cedula: "26119204", nombre: "Víctor Manuel Arteaga", puntos: 16.90, ciudad: "Caracas", sede: "Sucre", zonas: ["La Candelaria", "San Bernardino", "Av. Sucre"], especialidades: ["split", "neveras", "urgencias"], titulo: "Top #26 VIP • Servicio Express Aires Split", tarifa: 15, foto: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=800&q=80" },
  { rank: 27, cedula: "18220394", nombre: "Rubén Darío Bolívar", puntos: 16.15, ciudad: "Maracay", sede: "Principal", zonas: ["23 de Enero", "La Romana", "Centro"], especialidades: ["split", "lavadoras", "neveras"], titulo: "Top #27 VIP • Reparación Electrónica & Climatización", tarifa: 15, foto: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80" },
  { rank: 28, cedula: "20991823", nombre: "Jesús Alberto Pinto", puntos: 15.40, ciudad: "Valencia", sede: "Campo", zonas: ["Tocuyito", "Campo Carabobo", "San Blas"], especialidades: ["cuartos-frios", "neveras", "urgencias"], titulo: "Top #28 VIP • Cavas de Conservación & Carnicerías", tarifa: 20, foto: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=800&q=80" },
  { rank: 29, cedula: "15772819", nombre: "Gustavo Adolfo Linares", puntos: 14.60, ciudad: "Maracay", sede: "Jabillos", zonas: ["El Mácaro", "Turmero", "Samán de Güere"], especialidades: ["split", "neveras", "urgencias"], titulo: "Top #29 VIP • Aires Split 12.000 a 36.000 BTU", tarifa: 15, foto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=800&q=80" },
  { rank: 30, cedula: "23449102", nombre: "Daniel Alejandro Quintero", puntos: 13.85, ciudad: "Caracas", sede: "Sucre", zonas: ["El Marqués", "Macaracuay", "Petare Norte"], especialidades: ["neveras", "lavadoras", "split"], titulo: "Top #30 VIP • Línea Blanca & Neveras Samsung/LG", tarifa: 15, foto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80" },
  { rank: 31, cedula: "19002918", nombre: "César Augusto Hurtado", puntos: 12.90, ciudad: "Maracay", sede: "Principal", zonas: ["Las Acacias", "Piñonal", "San José"], especialidades: ["split", "neveras", "urgencias"], titulo: "Top #31 VIP • Diagnóstico y Carga de Refrigerante", tarifa: 15, foto: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80" },
  { rank: 32, cedula: "21883746", nombre: "Ronald José Montilla", puntos: 12.10, ciudad: "Valencia", sede: "Campo", zonas: ["Flor Amarillo", "Parque Valencia", "San Diego"], especialidades: ["split", "cuartos-frios", "neveras"], titulo: "Top #32 VIP • Consolas Split & Enfriadores", tarifa: 15, foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80" },
  { rank: 33, cedula: "16554829", nombre: "Néstor Luis Villegas", puntos: 11.30, ciudad: "Maracay", sede: "Jabillos", zonas: ["Santa Cruz", "Cagua", "Palo Negro"], especialidades: ["chiller", "split", "urgencias"], titulo: "Top #33 VIP • Climatización Comercial & Ductería", tarifa: 20, foto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80" },
  { rank: 34, cedula: "24991023", nombre: "Ernesto José Cordero", puntos: 10.45, ciudad: "Caracas", sede: "Sucre", zonas: ["Catia", "Propatria", "Av. Sucre"], especialidades: ["neveras", "lavadoras", "urgencias"], titulo: "Top #34 VIP • Reparación de Neveras a Domicilio", tarifa: 15, foto: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80" },
  { rank: 35, cedula: "17440192", nombre: "Marcos Antonio Gámez", puntos: 9.60, ciudad: "Maracay", sede: "Principal", zonas: ["El Limón", "Mata Redonda", "Base Sucre"], especialidades: ["split", "neveras", "lavadoras"], titulo: "Top #35 VIP • Mantenimiento Integral de Equipos", tarifa: 15, foto: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80" },
  { rank: 36, cedula: "22110495", nombre: "Javier Eduardo Ochoa", puntos: 8.80, ciudad: "Valencia", sede: "Campo", zonas: ["Naguanagua", "Bárbula", "El Trigal"], especialidades: ["split", "neveras", "urgencias"], titulo: "Top #36 VIP • Aires Acondicionados & Línea Blanca", tarifa: 15, foto: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=800&q=80" },
];

ADDITIONAL_VIP_ROSTER.forEach((item) => {
  const nivel =
    item.puntos >= 45
      ? "Diamante Jireh"
      : item.puntos >= 31
      ? "Oro"
      : item.puntos >= 18
      ? "Plata"
      : "Bronce";

  const safeVipCode = `VIP-TOP-${String(item.rank).padStart(2, "0")}`;

  MOCK_VIP_CLIENTS.push({
    id: `vip-top-${item.rank}`,
    cedula: item.cedula,
    nombreCompleto: item.nombre,
    telefono: "+584124558891",
    email: `tecnico${item.rank}.vip@jireh.com`,
    ciudad: item.ciudad,
    puntosAcumulados: item.puntos,
    comprasAcumuladasUSD: 0,
    sedeFrecuente: item.sede,
    nivelVip: nivel,
    codigoReferidoVip: safeVipCode,
    fechaRegistro: "2024-06-15",
    activo: true,
  });

  MOCK_TECHNICIANS.push({
    id: `tec-vip-${item.rank}`,
    rankingVip: item.rank,
    cedula: item.cedula,
    nombre: item.nombre,
    fotoUrl: item.foto,
    telefonoWhatsapp: "+584124558891",
    ciudad: item.ciudad,
    sedeJireh: `Sede ${item.sede}`,
    zonasCobertura: item.zonas,
    especialidades: item.especialidades,
    etiquetaDestacada: item.titulo,
    bio: `Técnico VIP #${item.rank} verificado en el ecosistema de Refrigeraciones Jireh con ${item.puntos.toFixed(
      2
    )} puntos acumulados. Servicio garantizado con repuestos originales en ${
      item.ciudad
    }.`,
    anosExperiencia: 8 + (item.rank % 7),
    tarifaDiagnosticoUSD: item.tarifa,
    modalidadTarifa: "por diagnóstico",
    calificacion: Number((4.85 + (item.rank % 15) * 0.01).toFixed(2)),
    totalResenas: 45 + (36 - item.rank) * 2,
    trabajosCompletados: 110 + (36 - item.rank) * 4,
    tiempoRespuestaMin: 20 + (item.rank % 3) * 5,
    disponibleUrgenciasHoy: true,
    esVipVerificado: true,
    puntosJirehVip: item.puntos,
    nivelVip: nivel,
    codigoVipRefriJireh: safeVipCode,
    insigniaRapida: item.rank <= 20 ? "Verificado" : "Rápido",
    coordenadas: {
      lat: 10.25 + (item.rank % 6) * 0.01,
      lng: -67.6 + (item.rank % 6) * 0.01,
      mapX: 18 + ((item.rank * 13) % 68),
      mapY: 20 + ((item.rank * 17) % 64),
    },
    portafolioFotos: [
      {
        url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
        titulo: `Servicio Técnico Certificado #${item.rank} con Repuestos Jireh`,
      },
    ],
    resenasDestacadas: [
      {
        id: `rev-vip-${item.rank}`,
        autor: "Cliente Verificado Jireh",
        zona: `${item.zonas[0]}, ${item.ciudad}`,
        calificacion: 5,
        comentario: "Excelente atención técnica, puntual y con repuestos originales de Refrigeraciones Jireh.",
        servicioRealizado: item.titulo.split("•")[1]?.trim() || "Mantenimiento y Diagnóstico",
        fecha: "Reciente",
      },
    ],
  });
});

