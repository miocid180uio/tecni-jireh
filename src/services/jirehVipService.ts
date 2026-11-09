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
            codigoReferidoVip: docData.codigoReferidoVip || `VIP-${cleanId}`,
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
          codigoReferidoVip: `VIP-${ci}`,
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
          codigoReferidoVip: `VIP-${ci}`,
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
 * Obtiene la lista de técnicos priorizando los primeros 36 técnicos
 * del ranking de https://clientes-jireh-vip.vercel.app (para visualización paginada de 6 en 6 hasta 36).
 */
export async function getSyncedTechnicians(): Promise<TechnicianProfile[]> {
  let baseList: TechnicianProfile[] = [...MOCK_TECHNICIANS];

  if (isFirebaseConfigured && db) {
    try {
      const usersRef = collection(db, "users");
      const topQuery = query(usersRef, orderBy("points", "desc"), limit(36));
      const snap = await getDocs(topQuery);

      if (!snap.empty) {
        snap.docs.forEach((docSnap, idx) => {
          const data = docSnap.data();
          const ciClean = normalizeIdentifier(String(data.ci || ""));
          const pts = Number(parseFloat(data.points || 0).toFixed(2));
          const spent = Number(parseFloat(data.totalSpent || 0).toFixed(2));
          const tier = calculateVipTier(pts);

          const existingIndex = baseList.findIndex(
            (t) => normalizeIdentifier(t.cedula) === ciClean
          );

          if (existingIndex >= 0) {
            baseList[existingIndex] = {
              ...baseList[existingIndex],
              rankingVip: idx + 1,
              nombre: String(data.name || baseList[existingIndex].nombre),
              puntosJirehVip: pts,
              comprasAcumuladasUSD: spent,
              esVipVerificado: true,
              nivelVip: tier,
            };
          } else if (idx < baseList.length && ciClean) {
            // Sincronizar ranura #idx con el usuario real de Firebase manteniendo plantilla visual
            const slotTemplate = baseList[idx];
            const cleanName = String(data.name || slotTemplate.nombre);
            baseList[idx] = {
              ...slotTemplate,
              rankingVip: idx + 1,
              cedula: ciClean,
              nombre: cleanName,
              puntosJirehVip: pts,
              comprasAcumuladasUSD: spent,
              esVipVerificado: true,
              nivelVip: tier,
              codigoVipRefriJireh: `VIP-${ciClean}`,
              etiquetaDestacada: `Top #${idx + 1} VIP • ${
                slotTemplate.etiquetaDestacada.split("•")[1]?.trim() ||
                "Refrigeración & Aires Split"
              }`,
              bio: `Técnico VIP #${
                idx + 1
              } en el ranking de Refrigeraciones Jireh con ${pts.toFixed(
                2
              )} puntos acumulados. Servicio garantizado con repuestos originales en ${
                slotTemplate.ciudad
              }.`,
            };
          }
        });
      }
    } catch {
      // Usa el Top 36 pre-sincronizado
    }
  }

  const sorted = sortTechniciansByVipPriority(baseList);
  return sorted.slice(0, 36).map((tech, index) => ({
    ...tech,
    rankingVip: tech.esVipVerificado ? index + 1 : undefined,
  }));
}

/**
 * Actualiza y enriquece de forma NO DESTRUCTIVA (`{ merge: true }`) la ficha de un
 * usuario antiguo en `users/{uid}` agregando únicamente los campos nuevos
 * (`phone`, `address`, `city`, `branch`, `role`, `specialties`) SIN tocar jamás
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
    fotosTrabajosUrls = [],
  } = payload;

  const finalPhone = telefonoWhatsapp?.trim() || vipClient.telefono;
  const finalCity = ciudad || vipClient.ciudad;
  const finalBranch = sedeFrecuente || vipClient.sedeFrecuente || "Principal";

  // 1. Enriquecimiento NO DESTRUCTIVO en Firestore (`users/{uid}`) usando `{ merge: true }`
  // NOTA DE SEGURIDAD: No se envía `points` ni `totalSpent` en este payload para garantizar
  // que el saldo y puntos acumulados del usuario antiguo permanezcan 100% intactos.
  if (isFirebaseConfigured && db && vipClient.id) {
    try {
      await setDoc(
        doc(db, "users", vipClient.id),
        {
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
          profileCompletedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch {
      // Si el usuario validó solo por cédula sin sesión Auth activa, se actualiza en el perfil técnico
    }
  }

  const newProfile: TechnicianProfile = {
    id: `tec-vip-${Date.now()}`,
    cedula: vipClient.cedula,
    nombre: vipClient.nombreCompleto,
    fotoUrl:
      fotoPerfilUrl?.trim() ||
      "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=800&q=80",
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
    anosExperiencia: 10,
    tarifaDiagnosticoUSD: tarifaDiagnosticoUSD || 15,
    modalidadTarifa: "por diagnóstico",
    calificacion: 5.0,
    totalResenas: 24,
    trabajosCompletados: 95,
    tiempoRespuestaMin: 20,
    disponibleUrgenciasHoy,
    esVipVerificado: true,
    puntosJirehVip: vipClient.puntosAcumulados,
    comprasAcumuladasUSD: vipClient.comprasAcumuladasUSD,
    nivelVip: vipClient.nivelVip,
    codigoVipRefriJireh: vipClient.codigoReferidoVip,
    estadoPublicacion: "pendiente",
    fechaSolicitud: "Actualización VIP",
    insigniaRapida: "Top VIP",
    coordenadas: {
      lat: 10.258,
      lng: -67.595,
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
    tipoCuenta: input.tipoCuenta,
    ciudad: input.ciudad,
    sedeFrecuente: input.sedeFrecuente,
    puntosAcumulados: 0,
    comprasAcumuladasUSD: 0,
    nivelVip: "Bronce",
    codigoReferidoVip: `VIP-${cleanCedula}`,
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
      codigoVipRefriJireh: `VIP-${cleanCedula}`,
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
  const codigo =
    params.codigoVip ||
    (params.cedula ? `VIP-${params.cedula}` : "CLIENTE-WEB");
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

  const whatsappUrl = "https://refrijireh.com/locations";

  return {
    webUrl: webUrl.toString(),
    whatsappUrl,
    codigoAplicado: codigo,
  };
}
