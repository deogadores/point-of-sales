import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, ensureSchema } from "@/lib/db";

const SESSION_COOKIE = "pos_session";
const SESSION_DAYS = 30;

function toSqliteDateTime(d: Date) {
  // YYYY-MM-DD HH:MM:SS (UTC)
  return d.toISOString().slice(0, 19).replace("T", " ");
}

function addDays(d: Date, days: number) {
  const next = new Date(d.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export const RegisterSchema = z.object({
  storeName: z.string().trim().min(2).max(80),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(200)
});

export const LoginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200)
});

export const CreateUserSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(200),
  role: z.enum(["owner", "staff"]).default("staff")
});

export type CurrentUser = {
  id: number;
  storeId: number;
  storeName: string;
  name: string;
  email: string;
  role: string;
};

async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * SESSION_DAYS
  });
}

async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  await ensureSchema();
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const res = await db.execute({
    sql: `
      SELECT
        u.id AS id,
        u.store_id AS storeId,
        s.name AS storeName,
        u.name AS name,
        u.email AS email,
        u.role AS role
      FROM sessions se
      JOIN users u ON u.id = se.user_id
      JOIN stores s ON s.id = u.store_id
      WHERE se.token = ?
        AND se.expires_at > datetime('now')
      LIMIT 1;
    `,
    args: [token]
  });

  const row = (res.rows as any[])[0];
  if (!row) return null;

  return {
    id: Number(row.id),
    storeId: Number(row.storeId),
    storeName: String(row.storeName),
    name: String(row.name),
    email: String(row.email),
    role: String(row.role)
  };
}

export async function requireAuth(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function logout() {
  await ensureSchema();
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.execute({ sql: `DELETE FROM sessions WHERE token = ?;`, args: [token] });
  }
  await clearSessionCookie();
}

async function createSession(userId: number) {
  const token = crypto.randomUUID();
  const expiresAt = toSqliteDateTime(addDays(new Date(), SESSION_DAYS));
  await db.execute({
    sql: `INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?);`,
    args: [userId, token, expiresAt]
  });
  await setSessionCookie(token);
}

export async function registerStoreAndOwner(input: unknown) {
  await ensureSchema();
  const data = RegisterSchema.parse(input);

  const passwordHash = await bcrypt.hash(data.password, 10);

  await db.execute(`BEGIN;`);
  try {
    const storeRes = await db.execute({
      sql: `INSERT INTO stores (name) VALUES (?) RETURNING id;`,
      args: [data.storeName]
    });
    const storeId = Number((storeRes.rows as any[])[0]?.id);
    if (!storeId) throw new Error("Failed to create store.");

    const userRes = await db.execute({
      sql: `
        INSERT INTO users (store_id, name, email, password_hash, role)
        VALUES (?, ?, ?, ?, 'owner')
        RETURNING id;
      `,
      args: [storeId, data.name, data.email, passwordHash]
    });
    const userId = Number((userRes.rows as any[])[0]?.id);
    if (!userId) throw new Error("Failed to create user.");

    await db.execute(`COMMIT;`);
    await createSession(userId);
  } catch (e) {
    await db.execute(`ROLLBACK;`);
    throw e;
  }
}

export async function login(input: unknown) {
  await ensureSchema();
  const data = LoginSchema.parse(input);

  const res = await db.execute({
    sql: `SELECT id, password_hash FROM users WHERE email = ? LIMIT 1;`,
    args: [data.email]
  });
  const row = (res.rows as any[])[0];
  if (!row) throw new Error("Invalid email or password.");

  const ok = await bcrypt.compare(data.password, String(row.password_hash));
  if (!ok) throw new Error("Invalid email or password.");

  await createSession(Number(row.id));
}

export async function listUsersByStore(storeId: number) {
  await ensureSchema();
  const res = await db.execute({
    sql: `
      SELECT id, name, email, role, created_at
      FROM users
      WHERE store_id = ?
      ORDER BY created_at DESC, id DESC;
    `,
    args: [storeId]
  });
  return res.rows as any[];
}

export async function createUserInStore(storeId: number, input: unknown) {
  await ensureSchema();
  const data = CreateUserSchema.parse(input);
  const passwordHash = await bcrypt.hash(data.password, 10);
  await db.execute({
    sql: `
      INSERT INTO users (store_id, name, email, password_hash, role)
      VALUES (?, ?, ?, ?, ?);
    `,
    args: [storeId, data.name, data.email, passwordHash, data.role]
  });
}

