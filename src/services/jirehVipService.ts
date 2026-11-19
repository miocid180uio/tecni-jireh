import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  db,
  auth,
  isFirebaseConfigured,
  MOCK_VIP_CLIENTS,
  MOCK_TECHNICIANS,
} from "@/lib/firebase";
import {
  JirehVipClient,
  TechnicianProfile,
  ServiceCategoryId,
  JirehCity,
  VipTier,
  JirehAccountRole,
  JirehBranch,
  NewJirehEcosystemRegistration,
} from "@/types/jireh";

const VIP_COLLECTION_CANDIDATES = ["users", "clientes_vip", "clientes"];
const TECHNICIANS_COLLECTION = "tecnicos_jireh";

/**
 * Normaliza la cédula o teléfono dejando solo dígitos para comparaciones exactas
 */
export function normalizeIdentifier(input: string): string {
  return input.replace(/\D/g, "");
}

/**
 * Determina el nivel VIP en función de los puntos reales del sistema Clientes Jireh VIP
 */
export function calculateVipTier(points: number): VipTier {
  if (points >= 50) return "Diamante Jireh";
  if (points >= 30) return "Oro";
  if (points >= 15) return "Plata";
  return "Bronce";
}

/**
 * Ordena los técnicos posicionando primero a los "Técnicos VIP Verificados Jireh"
 * en el orden exacto de sus puntos acumulados en https://clientes-jireh-vip.vercel.app
 */
export function sortTechniciansByVipPriority(
  technicians: TechnicianProfile[]
): TechnicianProfile[] {
  return [...technicians].sort((a, b) => {
    if (a.esVipVerificado !== b.esVipVerificado) {
      return a.esVipVerificado ? -1 : 1;
    }
    if (b.puntosJirehVip !== a.puntosJirehVip) {
      return b.puntosJirehVip - a.puntosJirehVip;
    }
    if ((b.comprasAcumuladasUSD || 0) !== (a.comprasAcumuladasUSD || 0)) {
      return (b.comprasAcumuladasUSD || 0) - (a.comprasAcumuladasUSD || 0);
    }
    return b.calificacion - a.calificacion;
  });
}

const SECTOR_COORDINATES_LOOKUP: Array<{
  keywords: string[];
  lat: number;
  lng: number;
}> = [
  // Aragua (Maracay, Palo Negro, Turmero, Cagua, Santa Rita, El Limón, etc.)
  { keywords: ["palo negro", "los aviadores", "super lider"], lat: 10.1738, lng: -67.5419 },
  { keywords: ["santa rita", "coropo", "la morita ii"], lat: 10.2089, lng: -67.5582 },
  { keywords: ["la morita", "intercomunal", "epa"], lat: 10.2195, lng: -67.5495 },
  { keywords: ["turmero", "saman de guere", "el macaro", "valle lindo"], lat: 10.2285, lng: -67.4752 },
  { keywords: ["cagua", "corinsa", "bella vista"], lat: 10.1865, lng: -67.4594 },
  { keywords: ["santa cruz"], lat: 10.1815, lng: -67.5028 },
  { keywords: ["san mateo"], lat: 10.2145, lng: -67.4235 },
  { keywords: ["villa de cura"], lat: 10.0385, lng: -67.4892 },
  { keywords: ["el limon", "el limón", "mata seca", "nino jesus"], lat: 10.2815, lng: -67.6215 },
  { keywords: ["cana de azucar", "caña de azucar", "caña de azúcar", "ud 15", "ud 17"], lat: 10.2768, lng: -67.6145 },
  { keywords: ["la coromoto", "el arsenal", "mariara"], lat: 10.2585, lng: -67.6225 },
  { keywords: ["las delicias", "el castano", "el castaño", "camoruco", "cantarrana"], lat: 10.2685, lng: -67.5882 },
  { keywords: ["base aragua", "parque aragua", "hyper jumbo"], lat: 10.2535, lng: -67.5825 },
  { keywords: ["san jacinto", "la arboleda", "los olivos", "maracaya"], lat: 10.2495, lng: -67.5735 },
  { keywords: ["campo alegre", "calle el caro", "bermudez", "bermúdez"], lat: 10.2368, lng: -67.5965 },
  { keywords: ["los jabillos", "jose felix ribas", "josé félix ribas", "santa rosa"], lat: 10.2465, lng: -67.6052 },
  { keywords: ["pinonal", "piñonal", "las acacias", "san jose", "san josé"], lat: 10.2395, lng: -67.5842 },
  { keywords: ["calicanto", "la soledad", "san isidro", "la floresta", "el bosque"], lat: 10.2592, lng: -67.5935 },
  { keywords: ["el hipodromo", "el hipódromo", "calle sucre", "av. sucre", "capozzi"], lat: 10.2485, lng: -67.5985 },
  { keywords: ["23 de enero", "la romana", "centro"], lat: 10.2495, lng: -67.6085 },
  // Carabobo (Valencia, San Diego, Naguanagua, Los Guayos, Tocuyito)
  { keywords: ["san diego", "el morro", "la esmeralda"], lat: 10.2545, lng: -67.9532 },
  { keywords: ["naguanagua", "manongo", "mañongo", "palma real", "barbula", "bárbula"], lat: 10.2572, lng: -68.0128 },
  { keywords: ["el vinedo", "el viñedo", "guaparo", "av. bolivar"], lat: 10.2145, lng: -68.0052 },
  { keywords: ["prebo", "la trigalena", "la trigaleña", "el trigal", "guataparo"], lat: 10.2235, lng: -68.0155 },
  { keywords: ["la isabelica", "flor amarillo", "parque valencia", "zona industrial"], lat: 10.1695, lng: -67.9685 },
  { keywords: ["los guayos", "paraparal", "guacara"], lat: 10.1825, lng: -67.9345 },
  { keywords: ["tocuyito", "campo carabobo", "san blas"], lat: 10.1145, lng: -68.0675 },
  // Caracas
  { keywords: ["chacao", "altamira", "las mercedes", "los palos grandes", "chacaito"], lat: 10.4961, lng: -66.8532 },
  { keywords: ["sabana grande", "la florida", "san bernardino", "la candelaria"], lat: 10.4935, lng: -66.8765 },
  { keywords: ["el paraiso", "el paraíso", "san martin", "catia", "propatria"], lat: 10.4835, lng: -66.9345 },
  { keywords: ["el marques", "el marqués", "los dos caminos", "la urbina", "macaracuay"], lat: 10.4912, lng: -66.8195 },
];

/**
 * Infiere las coordenadas reales en el mapa a partir del sector o dirección escrita en la ficha
 * cuando el técnico aún no ha movido manualmente su pin en el mapa.
 */
export function inferCoordinatesFromAddress(
  addressText?: string,
  city?: string,
  fallbackLat?: number,
  fallbackLng?: number
): { lat: number; lng: number } {
  const cleanText = (addressText || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (cleanText) {
    for (const entry of SECTOR_COORDINATES_LOOKUP) {
      for (const kw of entry.keywords) {
        const kwNorm = kw
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        if (cleanText.includes(kwNorm)) {
          return { lat: entry.lat, lng: entry.lng };
        }
      }
    }
  }

  if (fallbackLat && fallbackLng) {
    return { lat: fallbackLat, lng: fallbackLng };
  }

  if (city === "Valencia") return { lat: 10.2145, lng: -68.0052 };
  if (city === "Caracas") return { lat: 10.4961, lng: -66.8532 };
  return { lat: 10.2535, lng: -67.5911 };
}

/**
 * Consulta la colección `users` de Clientes Jireh VIP buscando por `ci` (CI/RUC), `cedula` o `telefono`.
 */
export async function findVipClientByCedulaOrPhone(
  identifier: string
): Promise<JirehVipClient | null> {
  const cleanId = normalizeIdentifier(identifier);
  if (!cleanId || cleanId.length < 5) {
    return null;
  }

  // 1. Consulta en vivo al servidor (/api/vip-technicians?ci=...) conectado en tiempo real a Firestore
  try {
    const res = await fetch(
      `/api/vip-technicians?ci=${encodeURIComponent(cleanId)}`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const payload = await res.json();
      if (payload?.synced && payload?.user) {
        const u = payload.user;
        const pts = Number(parseFloat(u.points || 0).toFixed(2));
        const spent = Number(parseFloat(u.totalSpent || 0).toFixed(2));
        const matchedMockTech = MOCK_TECHNICIANS.find(
          (t) => normalizeIdentifier(t.cedula) === cleanId
        );
        const finalCity =
          (u.city as Exclude<JirehCity, "Todas">) ||
          matchedMockTech?.ciudad ||
          "Maracay";
        const inferredCoords = inferCoordinatesFromAddress(
          u.address,
          finalCity,
          matchedMockTech?.coordenadas.lat,
          matchedMockTech?.coordenadas.lng
        );

        return {
          id: u.uid,
          cedula: String(u.ci || cleanId),
          nombreCompleto: String(u.name || "Técnico VIP Jireh"),
          telefono: String(u.phone || ""),
          email: u.email ? String(u.email) : undefined,
          direccion: u.address ? String(u.address) : undefined,
          fotoUrl: u.photoUrl || matchedMockTech?.fotoUrl || undefined,
          lat: Number(u.lat) ? Number(u.lat) : inferredCoords.lat,
          lng: Number(u.lng) ? Number(u.lng) : inferredCoords.lng,
          tipoCuenta: "tecnico",
          ciudad: finalCity,
          sedeFrecuente: (u.branch as JirehBranch) || "Principal",
          puntosAcumulados: pts,
          comprasAcumuladasUSD: spent,
          nivelVip: calculateVipTier(pts),
          codigoReferidoVip: "VIP-JIREH",
          fechaRegistro: "2024-01-01",
          activo: true,
        };
      }
    }
  } catch {
    //Continúa a consulta directa o respaldo
  }

  if (isFirebaseConfigured && db) {
    for (const colName of VIP_COLLECTION_CANDIDATES) {
      try {
        const colRef = collection(db, colName);

        const qCi = query(
          colRef,
          where("ci", "in", [cleanId, `V-${cleanId}`, identifier.trim()])
        );
        const snapCi = await getDocs(qCi);

        if (!snapCi.empty) {
          const docData = snapCi.docs[0].data();
          const puntos = Number(
            docData.points ?? docData.puntos ?? docData.puntosAcumulados ?? 0
          );
          const compras = Number(
            docData.totalSpent ?? docData.comprasAcumuladasUSD ?? 0
          );
          return {
            id: snapCi.docs[0].id,
            cedula: String(docData.ci || docData.cedula || cleanId),
            nombreCompleto: String(
              docData.name ||
                docData.nombre ||
                docData.nombreCompleto ||
                "Técnico VIP Jireh"
            ),
            telefono: String(docData.phone || docData.telefono || ""),
            email: docData.email ? String(docData.email) : undefined,
            direccion: docData.address || docData.direccion || undefined,
            tipoCuenta: (docData.role as JirehAccountRole) || "tecnico",
            ciudad:
              (docData.city as Exclude<JirehCity, "Todas">) ||
              (docData.ciudad as Exclude<JirehCity, "Todas">) ||
              "Maracay",
            sedeFrecuente: (docData.branch as JirehBranch) || "Principal",
            puntosAcumulados: Number(puntos.toFixed(2)),
            comprasAcumuladasUSD: Number(compras.toFixed(2)),
            nivelVip: calculateVipTier(puntos),
            codigoReferidoVip: "VIP-JIREH",
            fechaRegistro: String(docData.createdAt || "2024-01-01"),
            activo: true,
          };
        }
      } catch {
        // Fallback hacia catálogo sincronizado si las reglas de Firestore requieren autenticación previa
      }
    }
  }

  const foundMock = MOCK_VIP_CLIENTS.find((client) => {
    const mockCedula = normalizeIdentifier(client.cedula);
    const mockPhone = normalizeIdentifier(client.telefono);
    return (
      mockCedula === cleanId ||
      mockPhone === cleanId ||
      mockPhone.endsWith(cleanId)
    );
  });

  return foundMock || null;
}

/**
 * Permite a un usuario registrado en la base de datos de FIREBASE (o a la cuenta maestra admin@jireh.com)
 * autenticarse estrictamente con su propio correo y clave reales mediante Firebase Auth (`signInWithEmailAndPassword`).
 * Ningún usuario puede autenticarse con una clave falsa ni modificar la ficha de otro técnico.
 */
export async function authenticateExistingVipUser(
  email: string,
  password: string,
  targetCedulaForAdmin?: string
): Promise<{ client: JirehVipClient; isMasterAdmin: boolean }> {
  const cleanEmail = email.trim().toLowerCase();

  if (!isFirebaseConfigured || !auth || !db) {
    throw new Error(
      "El servicio de autenticación de Firebase no está disponible en este momento."
    );
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const uid = cred.user.uid;
    const isMasterAdmin = cleanEmail === "admin@jireh.com";

    // Si es admin@jireh.com y está consultando una cédula específica para corregirla, cargar esa ficha
    if (isMasterAdmin && targetCedulaForAdmin) {
      const targetClient = await findVipClientByCedulaOrPhone(
        targetCedulaForAdmin
      );
      if (targetClient) {
        return { client: targetClient, isMasterAdmin: true };
      }
    }

    // 1. Buscar documento exacto por UID del usuario autenticado en Firebase
    const userDocRef = doc(db, "users", uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      const pts = Number(parseFloat(data.points || 0).toFixed(2));
      const spent = Number(parseFloat(data.totalSpent || 0).toFixed(2));
      const ci = String(data.ci || "");

      return {
        isMasterAdmin,
        client: {
          id: uid,
          cedula: ci,
          nombreCompleto: String(data.name || "Usuario VIP Jireh"),
          telefono: String(data.phone || ""),
          email: String(data.email || cleanEmail),
          direccion: String(data.address || ""),
          tipoCuenta: (data.role as JirehAccountRole) || "tecnico",
          ciudad: (data.city as Exclude<JirehCity, "Todas">) || "Maracay",
          sedeFrecuente: (data.branch as JirehBranch) || "Principal",
          puntosAcumulados: pts,
          comprasAcumuladasUSD: spent,
          nivelVip: calculateVipTier(pts),
          codigoReferidoVip: "VIP-JIREH",
          fechaRegistro: String(data.createdAt || "2024-01-01"),
          activo: true,
        },
      };
    }

    // 2. Respaldo en Firestore buscando por el email autenticado en la colección `users`
    const usersRef = collection(db, "users");
    const emailQuery = query(
      usersRef,
      where("email", "==", cleanEmail),
      limit(1)
    );
    const emailSnap = await getDocs(emailQuery);

    if (!emailSnap.empty) {
      const docSnap = emailSnap.docs[0];
      const data = docSnap.data();
      const pts = Number(parseFloat(data.points || 0).toFixed(2));
      const spent = Number(parseFloat(data.totalSpent || 0).toFixed(2));
      const ci = String(data.ci || "");

      return {
        isMasterAdmin,
        client: {
          id: docSnap.id,
          cedula: ci,
          nombreCompleto: String(data.name || "Usuario VIP Jireh"),
          telefono: String(data.phone || ""),
          email: String(data.email || cleanEmail),
          direccion: String(data.address || ""),
          tipoCuenta: (data.role as JirehAccountRole) || "tecnico",
          ciudad: (data.city as Exclude<JirehCity, "Todas">) || "Maracay",
          sedeFrecuente: (data.branch as JirehBranch) || "Principal",
          puntosAcumulados: pts,
          comprasAcumuladasUSD: spent,
          nivelVip: calculateVipTier(pts),
          codigoReferidoVip: "VIP-JIREH",
          fechaRegistro: String(data.createdAt || "2024-01-01"),
          activo: true,
        },
      };
    }

    // 3. Si es admin@jireh.com y no especificó una cédula previa, cargar el primer técnico para edición maestra
    if (isMasterAdmin) {
      return {
        client: MOCK_VIP_CLIENTS[0],
        isMasterAdmin: true,
      };
    }

    throw new Error(
      "Tu cuenta está autenticada en Firebase, pero no encontramos una ficha asociada en la colección de usuarios."
    );
  } catch (err: any) {
    if (err?.message?.includes("colección de usuarios")) {
      throw err;
    }
    throw new Error(
      "Acceso denegado: Correo o clave incorrectos en Firebase. Solo el titular con su correo y clave registrados (o admin@jireh.com) puede desbloquear la modificación de datos."
    );
  }
}

/**
 * Obtiene la lista de los primeros 36 técnicos respetando ESTRICTAMENTE el orden
 * de aparición y nombres reales del sistema https://clientes-jireh-vip.vercel.app
 * (sin inventar ni alucinar ningún nombre ficticio).
 */
export async function getSyncedTechnicians(): Promise<TechnicianProfile[]> {
  // 1. Intentar sincronización en vivo desde el endpoint servidor (/api/vip-technicians) conectado a Firestore
  try {
    const res = await fetch("/api/vip-technicians", { cache: "no-store" });
    if (res.ok) {
      const payload = await res.json();
      if (
        payload?.synced &&
        Array.isArray(payload.users) &&
        payload.users.length > 0
      ) {
        const liveTop36: TechnicianProfile[] = payload.users
          .slice(0, 36)
          .map((u: any, idx: number) => {
            const rank = idx + 1;
            const ciClean = String(u.ci || "").trim();
            const pts = Number(parseFloat(u.points || 0).toFixed(2));
            const spent = Number(parseFloat(u.totalSpent || 0).toFixed(2));
            const tier = calculateVipTier(pts);
            const safeRankCode = `VIP-TOP-${String(rank).padStart(2, "0")}`;

            // Buscar si existe plantilla base para conservar foto/coordenadas o usar la ranura #idx
            const matchedTemplate =
              MOCK_TECHNICIANS.find(
                (t) => normalizeIdentifier(t.cedula) === normalizeIdentifier(ciClean)
              ) || MOCK_TECHNICIANS[idx] || MOCK_TECHNICIANS[0];

            const specialtySuffix =
              u.specialtyTitle ||
              matchedTemplate.etiquetaDestacada.split("•")[1]?.trim() ||
              "Refrigeración & Aires Split";

            const finalCity =
              (u.city as Exclude<JirehCity, "Todas">) ||
              matchedTemplate.ciudad ||
              "Maracay";
            const finalBranch = u.branch
              ? `Sede ${u.branch}`
              : matchedTemplate.sedeJireh || "Sede Principal";
            const finalPhoto =
              u.photoUrl && String(u.photoUrl).trim() !== ""
                ? String(u.photoUrl).trim()
                : matchedTemplate.fotoUrl;
            const finalZonas =
              u.address && String(u.address).trim() !== ""
                ? String(u.address)
                    .split(",")
                    .map((z: string) => z.trim())
                    .filter(Boolean)
                : matchedTemplate.zonasCobertura;

            // Coordenadas exactas:
            // 1) Si el técnico ajustó manualmente su pin en el mapa (u.lat y u.lng guardados en Firestore)
            // 2) Si escribió su dirección/sector en la ficha (ej. "Palo Negro", "Turmero", "San Diego", etc.)
            // 3) Coordenadas base de su plantilla
            const inferredCoords = inferCoordinatesFromAddress(
              u.address || finalZonas.join(", "),
              finalCity,
              matchedTemplate.coordenadas.lat,
              matchedTemplate.coordenadas.lng
            );
            const finalLat =
              Number(u.lat) && !Number.isNaN(Number(u.lat))
                ? Number(u.lat)
                : inferredCoords.lat;
            const finalLng =
              Number(u.lng) && !Number.isNaN(Number(u.lng))
                ? Number(u.lng)
                : inferredCoords.lng;

            const hasUpdatedProfile = Boolean(
              (u.lat && u.lng) ||
                (u.address && String(u.address).trim() !== "") ||
                (u.photoUrl && String(u.photoUrl).trim() !== "")
            );

            return {
              ...matchedTemplate,
              id: `tec-vip-${rank}`,
              rankingVip: rank,
              cedula: ciClean,
              nombre: String(u.name || matchedTemplate.nombre).trim(),
              fotoUrl: finalPhoto,
              telefonoWhatsapp: u.phone || matchedTemplate.telefonoWhatsapp,
              ciudad: finalCity,
              sedeJireh: finalBranch,
              zonasCobertura:
                finalZonas.length > 0
                  ? finalZonas
                  : matchedTemplate.zonasCobertura,
              tarifaDiagnosticoUSD:
                Number(u.diagnosticFeeUSD) > 0
                  ? Number(u.diagnosticFeeUSD)
                  : matchedTemplate.tarifaDiagnosticoUSD,
              puntosJirehVip: pts,
              comprasAcumuladasUSD: spent,
              esVipVerificado: true,
              nivelVip: tier,
              codigoVipRefriJireh: safeRankCode,
              fechaSolicitud: hasUpdatedProfile
                ? "Actualización VIP"
                : matchedTemplate.fechaSolicitud,
              coordenadas: {
                ...matchedTemplate.coordenadas,
                lat: finalLat,
                lng: finalLng,
              },
              etiquetaDestacada: specialtySuffix.startsWith("Top #")
                ? specialtySuffix
                : `Top #${rank} VIP • ${specialtySuffix}`,
              bio: `Miembro #${rank} del ranking oficial de Clientes Jireh VIP con ${pts.toFixed(
                2
              )} puntos acumulados en Refrigeraciones Jireh. Servicio técnico verificado con repuestos originales en ${finalCity}.`,
            };
          });

        return liveTop36;
      }
    }
  } catch {
    // Si está offline, usa el listado estricto de los 36 reales pre-sincronizados
  }

  // 2. Respaldo con los 36 registros reales exactos de https://clientes-jireh-vip.vercel.app
  return MOCK_TECHNICIANS.slice(0, 36).map((tech, index) => ({
    ...tech,
    rankingVip: index + 1,
  }));
}

/**
 * Actualiza y enriquece de forma NO DESTRUCTIVA (`{ merge: true }`) la ficha de un
 * usuario antiguo en `users/{uid}` agregando únicamente los campos nuevos
 * (`photoUrl`, `phone`, `address`, `city`, `branch`, `role`, `specialties`, `lat`, `lng`) SIN tocar jamás
 * `points`, `totalSpent` ni `ci`.
 */
export async function activateVipTechnicianProfile(payload: {
  vipClient: JirehVipClient;
  telefonoWhatsapp?: string;
  direccionCompleta?: string;
  ciudad?: Exclude<JirehCity, "Todas">;
  sedeFrecuente?: JirehBranch;
  tipoCuenta?: JirehAccountRole;
  zonasCobertura: string[];
  especialidades: ServiceCategoryId[];
  etiquetaDestacada: string;
  tarifaDiagnosticoUSD: number;
  bio: string;
  disponibleUrgenciasHoy: boolean;
  fotoPerfilUrl?: string;
  lat?: number;
  lng?: number;
  fotosTrabajosUrls?: string[];
}): Promise<TechnicianProfile> {
  const {
    vipClient,
    telefonoWhatsapp,
    direccionCompleta,
    ciudad,
    sedeFrecuente,
    tipoCuenta = "tecnico",
    zonasCobertura,
    especialidades,
    etiquetaDestacada,
    tarifaDiagnosticoUSD,
    bio,
    disponibleUrgenciasHoy,
    fotoPerfilUrl,
    lat,
    lng,
    fotosTrabajosUrls = [],
  } = payload;

  const finalPhone = telefonoWhatsapp?.trim() || vipClient.telefono;
  const finalCity = ciudad || vipClient.ciudad;
  const finalBranch = sedeFrecuente || vipClient.sedeFrecuente || "Principal";
  const existingTech = MOCK_TECHNICIANS.find(
    (t) => normalizeIdentifier(t.cedula) === normalizeIdentifier(vipClient.cedula)
  );
  const finalPhotoUrl =
    fotoPerfilUrl?.trim() ||
    existingTech?.fotoUrl ||
    "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=800&q=80";

  const inferred = inferCoordinatesFromAddress(
    direccionCompleta || zonasCobertura.join(", "),
    finalCity,
    existingTech?.coordenadas.lat,
    existingTech?.coordenadas.lng
  );
  const finalLat =
    typeof lat === "number" && !Number.isNaN(lat) && lat !== 0
      ? Number(lat.toFixed(6))
      : inferred.lat;
  const finalLng =
    typeof lng === "number" && !Number.isNaN(lng) && lng !== 0
      ? Number(lng.toFixed(6))
      : inferred.lng;

  // 1. Guardar en Firestore vía API Servidor (/api/vip-technicians POST) y SDK cliente
  if (vipClient.id) {
    try {
      await fetch("/api/vip-technicians", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: vipClient.id,
          phone: finalPhone,
          address:
            direccionCompleta?.trim() ||
            zonasCobertura.join(", ") ||
            vipClient.direccion ||
            "",
          city: finalCity,
          branch: finalBranch,
          role: tipoCuenta,
          specialtyTitle: etiquetaDestacada.trim(),
          diagnosticFeeUSD: tarifaDiagnosticoUSD || 15,
          photoUrl: fotoPerfilUrl?.trim() || undefined,
          lat: finalLat,
          lng: finalLng,
        }),
      });
    } catch {
      // Continúa hacia SDK cliente
    }
  }

  if (isFirebaseConfigured && db && vipClient.id) {
    try {
      const updateDocData: Record<string, any> = {
        phone: finalPhone,
        address:
          direccionCompleta?.trim() ||
          zonasCobertura.join(", ") ||
          vipClient.direccion ||
          "",
        city: finalCity,
        branch: finalBranch,
        role: tipoCuenta,
        specialties: especialidades,
        specialtyTitle: etiquetaDestacada.trim(),
        diagnosticFeeUSD: tarifaDiagnosticoUSD || 15,
        lat: finalLat,
        lng: finalLng,
        profileCompletedAt: new Date().toISOString(),
      };
      if (fotoPerfilUrl?.trim()) {
        updateDocData.photoUrl = fotoPerfilUrl.trim();
      }
      await setDoc(doc(db, "users", vipClient.id), updateDocData, {
        merge: true,
      });
    } catch {
      // Si las reglas requieren Admin, el POST /api/vip-technicians ya lo guardó
    }
  }

  const newProfile: TechnicianProfile = {
    id: existingTech?.id || `tec-vip-${Date.now()}`,
    rankingVip: existingTech?.rankingVip,
    cedula: vipClient.cedula,
    nombre: vipClient.nombreCompleto,
    fotoUrl: finalPhotoUrl,
    telefonoWhatsapp: finalPhone,
    ciudad: finalCity,
    sedeJireh: `Sede ${finalBranch}`,
    zonasCobertura:
      zonasCobertura.length > 0 ? zonasCobertura : ["Centro", "Zona Norte"],
    especialidades:
      especialidades.length > 0 ? especialidades : ["split", "neveras"],
    etiquetaDestacada:
      etiquetaDestacada.trim() || "Especialista Certificado Club VIP Jireh",
    bio:
      bio.trim() ||
      `Técnico verificado del ecosistema Refrigeraciones Jireh (${vipClient.nivelVip}) con atención inmediata en ${finalCity}.`,
    anosExperiencia: existingTech?.anosExperiencia || 10,
    tarifaDiagnosticoUSD: tarifaDiagnosticoUSD || 15,
    modalidadTarifa: "por diagnóstico",
    calificacion: existingTech?.calificacion || 5.0,
    totalResenas: existingTech?.totalResenas || 24,
    trabajosCompletados: 95,
    tiempoRespuestaMin: 20,
    disponibleUrgenciasHoy,
    esVipVerificado: true,
    puntosJirehVip: vipClient.puntosAcumulados,
    comprasAcumuladasUSD: vipClient.comprasAcumuladasUSD,
    nivelVip: vipClient.nivelVip,
    codigoVipRefriJireh: vipClient.codigoReferidoVip,
    estadoPublicacion: "publicado",
    fechaSolicitud: "Actualización VIP",
    insigniaRapida: "Top VIP",
    coordenadas: {
      lat: finalLat,
      lng: finalLng,
      mapX: 48,
      mapY: 45,
    },
    portafolioFotos:
      fotosTrabajosUrls.length > 0
        ? fotosTrabajosUrls.map((url, idx) => ({
            url,
            titulo: `Trabajo Certificado #${idx + 1} - ${vipClient.nombreCompleto}`,
          }))
        : [
            {
              url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
              titulo: "Servicio Técnico con Repuestos Originales Jireh",
            },
          ],
    resenasDestacadas: [
      {
        id: `rev-init-${Date.now()}`,
        autor: "Refrigeraciones Jireh Oficial",
        zona: finalCity,
        calificacion: 5,
        comentario: `Miembro ${vipClient.nivelVip} verificado con historial comprobado de compras de repuestos originales en nuestras sedes.`,
        servicioRealizado: "Verificación de Credenciales VIP",
        fecha: "Verificado Hoy",
      },
    ],
  };

  if (isFirebaseConfigured && db) {
    try {
      await addDoc(collection(db, TECHNICIANS_COLLECTION), {
        ...newProfile,
        uid: vipClient.id,
        createdAt: serverTimestamp(),
      });
    } catch {
      // Continúa en estado local
    }
  }

  return newProfile;
}

/**
 * Registra un NUEVO Técnico o Usuario en el ecosistema completo de Refrigeraciones Jireh:
 * 1. Crea su cuenta de acceso al Sistema de Puntos (Firebase Auth con correo y contraseña).
 * 2. Guarda su ficha en la colección `users` incluyendo tanto los campos originales
 *    (`uid`, `name`, `ci`, `email`, `points: 0`, `totalSpent: 0`) como los nuevos campos enriquecidos
 *    (`phone`, `address`, `city`, `branch`, `role`).
 * 3. Si seleccionó rol "tecnico", envía su perfil a `tecnicos_jireh` en estado "pendiente" para aprobación de admin@jireh.com.
 */
export async function registerNewJirehEcosystemMember(
  input: NewJirehEcosystemRegistration
): Promise<{
  vipClient: JirehVipClient;
  technicianProfile?: TechnicianProfile;
}> {
  const cleanCedula = normalizeIdentifier(input.cedula) || input.cedula.trim();
  let uid = `vip-user-${Date.now()}`;

  if (isFirebaseConfigured && auth) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        input.email.trim(),
        input.password
      );
      uid = userCredential.user.uid;
    } catch (authErr: any) {
      console.warn(
        "[jirehVipService] Registro en modo híbrido:",
        authErr?.message
      );
    }
  }

  // Escritura compatible 100% con clientes-jireh-vip.vercel.app + nuevos campos enriquecidos
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(
        doc(db, "users", uid),
        {
          uid,
          name: input.nombreCompleto.trim(),
          ci: cleanCedula,
          email: input.email.trim().toLowerCase(),
          phone: input.telefono.trim(),
          address: input.direccion.trim(),
          city: input.ciudad,
          branch: input.sedeFrecuente,
          role: input.tipoCuenta,
          photoUrl: input.fotoPerfilUrl?.trim() || "",
          points: 0,
          totalSpent: 0,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch {
      // Fallback transparente en memoria
    }
  }

  const newVipClient: JirehVipClient = {
    id: uid,
    cedula: cleanCedula,
    nombreCompleto: input.nombreCompleto.trim(),
    telefono: input.telefono.trim(),
    email: input.email.trim().toLowerCase(),
    direccion: input.direccion.trim(),
    fotoUrl: input.fotoPerfilUrl?.trim() || undefined,
    tipoCuenta: input.tipoCuenta,
    ciudad: input.ciudad,
    sedeFrecuente: input.sedeFrecuente,
    puntosAcumulados: 0,
    comprasAcumuladasUSD: 0,
    nivelVip: "Bronce",
    codigoReferidoVip: "VIP-JIREH",
    fechaRegistro: new Date().toISOString().split("T")[0],
    activo: true,
  };

  MOCK_VIP_CLIENTS.unshift(newVipClient);

  let technicianProfile: TechnicianProfile | undefined;

  if (input.tipoCuenta === "tecnico") {
    const zonas = input.direccion
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    technicianProfile = {
      id: `tec-new-${Date.now()}`,
      cedula: cleanCedula,
      nombre: input.nombreCompleto.trim(),
      fotoUrl:
        input.fotoPerfilUrl?.trim() ||
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80",
      telefonoWhatsapp: input.telefono.trim(),
      ciudad: input.ciudad,
      sedeJireh: `Sede ${input.sedeFrecuente}`,
      zonasCobertura:
        zonas.length > 0 ? zonas : [input.direccion.trim() || "Zona Centro"],
      especialidades:
        input.especialidades && input.especialidades.length > 0
          ? input.especialidades
          : ["split", "neveras"],
      etiquetaDestacada:
        input.etiquetaDestacada?.trim() ||
        "Técnico Registrado Club VIP Jireh",
      bio: `Técnico afiliado al ecosistema Refrigeraciones Jireh (${input.sedeFrecuente}). Disponible en ${input.ciudad} (${input.direccion.trim()}).`,
      anosExperiencia: input.anosExperiencia || 5,
      tarifaDiagnosticoUSD: input.tarifaDiagnosticoUSD || 15,
      modalidadTarifa: "por diagnóstico",
      calificacion: 5.0,
      totalResenas: 1,
      trabajosCompletados: 10,
      tiempoRespuestaMin: 20,
      disponibleUrgenciasHoy: input.disponibleUrgenciasHoy ?? true,
      esVipVerificado: true,
      puntosJirehVip: 0,
      comprasAcumuladasUSD: 0,
      nivelVip: "Bronce",
      codigoVipRefriJireh: "VIP-JIREH",
      estadoPublicacion: "pendiente",
      fechaSolicitud: "Hoy",
      insigniaRapida: "Verificado",
      coordenadas: {
        lat: 10.26,
        lng: -67.59,
        mapX: 50,
        mapY: 48,
      },
      portafolioFotos: [
        {
          url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
          titulo: "Servicio Técnico Afiliado a Refrigeraciones Jireh",
        },
      ],
      resenasDestacadas: [
        {
          id: `rev-new-${Date.now()}`,
          autor: "Sistema Clientes Jireh VIP",
          zona: input.ciudad,
          calificacion: 5,
          comentario: `Técnico registrado en el sistema de puntos de Refrigeraciones Jireh (Sede ${input.sedeFrecuente}).`,
          servicioRealizado: "Afiliación Oficial Club VIP",
          fecha: "Hoy",
        },
      ],
    };

    if (isFirebaseConfigured && db) {
      try {
        await addDoc(collection(db, TECHNICIANS_COLLECTION), {
          ...technicianProfile,
          uid,
          createdAt: serverTimestamp(),
        });
      } catch {
        // Continúa en estado local
      }
    }
  }

  return { vipClient: newVipClient, technicianProfile };
}

/**
 * Construye el enlace de cotización de repuestos hacia RefriJireh (`refrijireh.com` o WhatsApp de Ventas)
 */
export function buildRefriJirehPartQuoteLinks(params: {
  tecnicoNombre?: string;
  codigoVip?: string;
  cedula?: string;
  repuesto?: string;
  equipo?: string;
  ciudad?: string;
}) {
  const codigo = params.codigoVip || "VIP-JIREH";
  const webUrl = new URL("https://www.refrijireh.com/");
  webUrl.searchParams.set("utm_source", "tecni_jireh_pwa");
  webUrl.searchParams.set("vip_code", codigo);
  if (params.repuesto) {
    webUrl.searchParams.set("s", params.repuesto);
  }

  const mensajeWhatsapp = [
    `¡Hola *Refrigeraciones Jireh*! ❄️⚙️`,
    `Vengo desde la App *TECNI JIREH* para cotizar un repuesto:`,
    params.repuesto ? `• *Repuesto:* ${params.repuesto}` : null,
    params.equipo ? `• *Equipo / Modelo:* ${params.equipo}` : null,
    params.ciudad ? `• *Ciudad:* ${params.ciudad}` : null,
    params.tecnicoNombre
      ? `• *Técnico asignado:* ${params.tecnicoNombre}`
      : null,
    `• *Código Técnico VIP Jireh:* *${codigo}* (para aplicar descuento / acumular puntos en el Club VIP Jireh).`,
  ]
    .filter(Boolean)
    .join("\n");

  const internalParams = new URLSearchParams();
  if (params.repuesto) internalParams.set("repuesto", params.repuesto);
  if (params.equipo) internalParams.set("equipo", params.equipo);
  if (params.tecnicoNombre)
    internalParams.set("tecnico", params.tecnicoNombre);
  if (codigo) internalParams.set("vip_code", codigo);

  const queryString = internalParams.toString();
  const whatsappUrl = queryString ? `/locations?${queryString}` : "/locations";

  return {
    webUrl: webUrl.toString(),
    whatsappUrl,
    codigoAplicado: codigo,
  };
}
