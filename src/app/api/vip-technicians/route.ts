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

export async function GET() {
  try {
    const rawSa = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!rawSa) {
      return NextResponse.json({ synced: false, users: [] });
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
      };
    });

    // Orden estricto idéntico a https://clientes-jireh-vip.vercel.app:
    // 1° por puntos descendente, 2° por totalSpent descendente
    users.sort((a, b) => b.points - a.points || b.totalSpent - a.totalSpent);

    return NextResponse.json({
      synced: true,
      users: users.slice(0, 36),
    });
  } catch (err: any) {
    return NextResponse.json(
      { synced: false, error: err?.message || "Sync error", users: [] },
      { status: 200 }
    );
  }
}
