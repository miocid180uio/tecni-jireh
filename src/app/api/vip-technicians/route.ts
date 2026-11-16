import { NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

interface RawFirestoreUser {
  uid: string;
  name: string;
  ci: string;
  email: string;
  points: number;
  totalSpent: number;
  phone: string;
  city: string;
  branch: string;
  address: string;
  photoUrl: string;
  specialtyTitle: string;
  diagnosticFeeUSD: number;
}

async function getAccessTokenFromServiceAccount(sa: {
  client_email: string;
  private_key: string;
}): Promise<string> {
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" })
  ).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/datastore",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  ).toString("base64url");

  const sign = crypto.createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(sa.private_key, "base64url");
  const assertion = `${header}.${payload}.${signature}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${assertion}`,
    cache: "no-store",
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error("Could not obtain Firestore access token");
  }
  return tokenData.access_token;
}

export async function GET(request: Request) {
  try {
    const rawSa = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!rawSa) {
      return NextResponse.json(
        { synced: false, users: [] },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    const sa = JSON.parse(rawSa.trim());
    const accessToken = await getAccessTokenFromServiceAccount(sa);
    const projectId = sa.project_id || "clientesjirehvip-58048";

    const allDocs: any[] = [];
    let pageToken = "";

    do {
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users?pageSize=300${
        pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""
      }`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      if (!res.ok) break;
      const data = await res.json();
      if (data.documents) {
        allDocs.push(...data.documents);
      }
      pageToken = data.nextPageToken || "";
    } while (pageToken);

    const getVal = (v: any) =>
      v ? v.stringValue ?? v.doubleValue ?? v.integerValue ?? "" : "";

    const users: RawFirestoreUser[] = allDocs.map((d) => {
      const f = d.fields || {};
      return {
        uid: String(d.name || "").split("/").pop() || "",
        name: String(getVal(f.name)).trim(),
        ci: String(getVal(f.ci)).trim(),
        email: String(getVal(f.email)).trim(),
        points: Number(parseFloat(String(getVal(f.points) || "0")).toFixed(2)),
        totalSpent: Number(
          parseFloat(String(getVal(f.totalSpent) || "0")).toFixed(2)
        ),
        phone: String(getVal(f.phone)).trim(),
        city: String(getVal(f.city)).trim(),
        branch: String(getVal(f.branch)).trim(),
        address: String(getVal(f.address)).trim(),
        photoUrl: String(getVal(f.photoUrl)).trim(),
        specialtyTitle: String(getVal(f.specialtyTitle)).trim(),
        diagnosticFeeUSD: Number(getVal(f.diagnosticFeeUSD) || 0),
      };
    });

    // Orden estricto idéntico a https://clientes-jireh-vip.vercel.app:
    // 1° por puntos descendente, 2° por totalSpent descendente
    users.sort((a, b) => b.points - a.points || b.totalSpent - a.totalSpent);

    const { searchParams } = new URL(request.url);
    const ciFilter = searchParams.get("ci")?.replace(/\D/g, "");

    if (ciFilter) {
      const match = users.find((u) => u.ci.replace(/\D/g, "") === ciFilter);
      return NextResponse.json(
        { synced: true, user: match || null },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    return NextResponse.json(
      {
        synced: true,
        updatedAt: new Date().toISOString(),
        users: users.slice(0, 36),
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err: any) {
    return NextResponse.json(
      { synced: false, error: err?.message || "Sync error", users: [] },
      { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}

/**
 * POST /api/vip-technicians
 * Actualiza de forma NO DESTRUCTIVA los campos de perfil e imagen (`photoUrl`, `phone`, `city`,
 * `branch`, `address`, `role`, `specialtyTitle`, `diagnosticFeeUSD`) en `users/{uid}` en Firestore,
 * manteniendo 100% intactos `points`, `totalSpent` y `ci`.
 */
export async function POST(request: Request) {
  try {
    const rawSa = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!rawSa) {
      return NextResponse.json({ updated: false, reason: "No SA configured" });
    }

    const body = await request.json();
    const {
      uid,
      phone,
      city,
      branch,
      address,
      role,
      specialtyTitle,
      diagnosticFeeUSD,
      photoUrl,
    } = body || {};

    if (!uid) {
      return NextResponse.json(
        { updated: false, error: "Missing uid" },
        { status: 400 }
      );
    }

    const sa = JSON.parse(rawSa.trim());
    const accessToken = await getAccessTokenFromServiceAccount(sa);
    const projectId = sa.project_id || "clientesjirehvip-58048";

    const fields: Record<string, any> = {};
    const maskPaths: string[] = [];

    if (typeof phone === "string" && phone.trim()) {
      fields.phone = { stringValue: phone.trim() };
      maskPaths.push("phone");
    }
    if (typeof city === "string" && city.trim()) {
      fields.city = { stringValue: city.trim() };
      maskPaths.push("city");
    }
    if (typeof branch === "string" && branch.trim()) {
      fields.branch = { stringValue: branch.trim() };
      maskPaths.push("branch");
    }
    if (typeof address === "string" && address.trim()) {
      fields.address = { stringValue: address.trim() };
      maskPaths.push("address");
    }
    if (typeof role === "string" && role.trim()) {
      fields.role = { stringValue: role.trim() };
      maskPaths.push("role");
    }
    if (typeof specialtyTitle === "string" && specialtyTitle.trim()) {
      fields.specialtyTitle = { stringValue: specialtyTitle.trim() };
      maskPaths.push("specialtyTitle");
    }
    if (typeof diagnosticFeeUSD === "number" && diagnosticFeeUSD > 0) {
      fields.diagnosticFeeUSD = { integerValue: String(Math.round(diagnosticFeeUSD)) };
      maskPaths.push("diagnosticFeeUSD");
    }
    if (typeof photoUrl === "string" && photoUrl.trim()) {
      fields.photoUrl = { stringValue: photoUrl.trim() };
      maskPaths.push("photoUrl");
    }

    if (maskPaths.length === 0) {
      return NextResponse.json({ updated: true });
    }

    const queryMask = maskPaths
      .map((p) => `updateMask.fieldPaths=${encodeURIComponent(p)}`)
      .join("&");

    const patchUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${encodeURIComponent(
      uid
    )}?${queryMask}`;

    const patchRes = await fetch(patchUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
      cache: "no-store",
    });

    return NextResponse.json({
      updated: patchRes.ok,
      status: patchRes.status,
    });
  } catch (err: any) {
    return NextResponse.json(
      { updated: false, error: err?.message || "Update error" },
      { status: 200 }
    );
  }
}
