import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import { query } from "./db";

const COOKIE_NAME = "mv_session";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret"
);

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  workspaceId: string;
  workspaceName: string;
  businessType: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<string> {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .setIssuedAt()
    .sign(JWT_SECRET);

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await query(
    "INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)",
    [userId, token, expiresAt]
  );

  return token;
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    const result = await query<{
      id: string;
      email: string;
      name: string;
      workspace_id: string;
      workspace_name: string;
      business_type: string;
      role: string;
    }>(
      `SELECT u.id, u.email, u.name, u.workspace_id, w.name as workspace_name, w.business_type, u.role
       FROM users u
       JOIN workspaces w ON w.id = u.workspace_id
       WHERE u.id = $1 AND u.is_active = true`,
      [userId]
    );

    if (result.rows.length === 0) return null;

    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      name: user.name || "",
      workspaceId: user.workspace_id,
      workspaceName: user.workspace_name,
      businessType: user.business_type,
      role: user.role,
    };
  } catch {
    return null;
  }
}

export async function verifyToken(
  token: string
): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { userId: payload.userId as string };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    await query("DELETE FROM sessions WHERE token = $1", [token]);
  }

  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}
