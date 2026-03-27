import { redirect } from "next/navigation";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { stores, storeMembers, units } from "@/lib/db/schema";
import { getSession, setAuthCookie, clearAuthCookie } from "@/lib/auth/session";
import { loginWithCentralAuth, registerWithCentralAuth } from "@/lib/auth/api-client";
import { logAudit } from "@/lib/audit";

export const LoginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200)
});

export const RegisterSchema = z.object({
  registrationPhrase: z.string().trim().min(1).max(200),
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(200)
});

export const CreateStoreSchema = z.object({
  storeName: z.string().trim().min(2).max(80),
});

export const JoinStoreSchema = z.object({
  inviteCode: z.string().trim().min(1),
});

export type CurrentUser = {
  authUserId: string;
  memberId: number;
  storeId: number;
  storeName: string;
  storeSlug: string;
  storeCurrency: string;
  storeTimezone: string;
  liveNotifications: boolean;
  name: string;
  email: string;
  role: string;
};

async function lookupStoreMember(authUserId: string) {
  return db
    .select({
      memberId: storeMembers.id,
      storeId: storeMembers.storeId,
      storeName: stores.name,
      storeSlug: stores.slug,
      storeCurrency: stores.currency,
      storeTimezone: stores.timezone,
      liveNotifications: stores.liveNotifications,
      name: storeMembers.name,
      email: storeMembers.email,
      role: storeMembers.role,
    })
    .from(storeMembers)
    .innerJoin(stores, eq(stores.id, storeMembers.storeId))
    .where(eq(storeMembers.authUserId, authUserId))
    .limit(1)
    .then((rows) => rows[0] ?? null);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  if (!session) return null;

  const row = await lookupStoreMember(session.user.id);
  if (!row) return null;

  return { authUserId: session.user.id, ...row };
}

export async function requireAuth(): Promise<CurrentUser> {
  const session = await getSession();
  if (!session) redirect("/login");

  const row = await lookupStoreMember(session.user.id);
  if (!row) redirect("/store-setup");

  return { authUserId: session.user.id, ...row };
}

export async function login(input: unknown) {
  const data = LoginSchema.parse(input);
  const result = await loginWithCentralAuth(data.email, data.password);

  if (!result.success || !result.token) {
    throw new Error(result.error || "Invalid email or password.");
  }
  if (!result.toolAccess?.includes('simple-pos')) {
    throw new Error("You do not have access to this tool.");
  }

  await setAuthCookie(result.token);
}

export async function register(input: unknown) {
  const data = RegisterSchema.parse(input);
  const result = await registerWithCentralAuth(data);

  if (!result.success || !result.token) {
    throw new Error(result.error || "Registration failed.");
  }
  if (!result.toolAccess?.includes('simple-pos')) {
    throw new Error("Registration phrase is not valid for this tool.");
  }

  await setAuthCookie(result.token);
}

export async function logout() {
  await clearAuthCookie();
}

function toSlug(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export async function setupStore(authUserId: string, name: string, email: string, input: unknown) {
  const data = CreateStoreSchema.parse(input);
  const inviteCode = crypto.randomUUID();
  const slug = toSlug(data.storeName);

  await db.transaction(async (tx) => {
    let store: { id: number } | undefined;
    try {
      [store] = await tx
        .insert(stores)
        .values({ name: data.storeName, slug, inviteCode })
        .returning({ id: stores.id });
    } catch (e: any) {
      if (e?.message?.includes('UNIQUE')) throw new Error("A store with that name already exists.");
      throw e;
    }
    if (!store) throw new Error("Failed to create store.");

    await tx.insert(storeMembers).values({
      storeId: store.id,
      authUserId,
      name,
      email,
      role: 'Owner',
      isFounder: true,
    });

    await tx.insert(units).values([
      { storeId: store.id, name: 'Liter', symbol: 'L' },
      { storeId: store.id, name: 'Piece', symbol: 'pc' },
      { storeId: store.id, name: 'Pack', symbol: 'pck' },
    ]);
  });

  // Log after transaction — storeId is now stable
  const [created] = await db.select({ id: stores.id }).from(stores).where(eq(stores.name, data.storeName)).limit(1);
  if (created) {
    await logAudit(created.id, {
      actorName: name,
      action: "store.created",
      entityType: "store",
      detail: data.storeName,
    });
  }
}

export async function joinStore(authUserId: string, name: string, email: string, input: unknown) {
  const data = JoinStoreSchema.parse(input);

  const [store] = await db
    .select({ id: stores.id })
    .from(stores)
    .where(eq(stores.inviteCode, data.inviteCode))
    .limit(1);

  if (!store) throw new Error("Invalid invite code.");

  const [existing] = await db
    .select({ id: storeMembers.id })
    .from(storeMembers)
    .where(and(eq(storeMembers.authUserId, authUserId), eq(storeMembers.storeId, store.id)))
    .limit(1);

  if (existing) throw new Error("You are already a member of this store.");

  await db.insert(storeMembers).values({
    storeId: store.id,
    authUserId,
    name,
    email,
    role: 'Staff',
  });

  await logAudit(store.id, {
    actorName: name,
    action: "user.joined",
    entityType: "user",
    detail: `${name} joined as Staff`,
  });
}

export async function listUsersByStore(storeId: number) {
  return db
    .select({
      id: storeMembers.id,
      name: storeMembers.name,
      email: storeMembers.email,
      role: storeMembers.role,
      isFounder: storeMembers.isFounder,
      joined_at: storeMembers.joinedAt,
    })
    .from(storeMembers)
    .where(eq(storeMembers.storeId, storeId))
    .orderBy(desc(storeMembers.joinedAt), desc(storeMembers.id));
}

export async function updateStoreCurrency(storeId: number, currency: string) {
  await db.update(stores).set({ currency }).where(eq(stores.id, storeId));
}

export async function updateStoreTimezone(storeId: number, timezone: string) {
  await db.update(stores).set({ timezone }).where(eq(stores.id, storeId));
}

export async function updateLiveNotifications(storeId: number, enabled: boolean) {
  await db.update(stores).set({ liveNotifications: enabled }).where(eq(stores.id, storeId));
}

export async function renameStore(storeId: number, newName: string) {
  const slug = toSlug(newName);
  try {
    await db.update(stores).set({ name: newName, slug }).where(eq(stores.id, storeId));
  } catch (e: any) {
    if (e?.message?.includes('UNIQUE')) throw new Error("A store with that name already exists.");
    throw e;
  }
}

export async function changeUserRole(storeId: number, memberId: number, newRole: 'Owner' | 'Staff') {
  const [member] = await db
    .select({ id: storeMembers.id, isFounder: storeMembers.isFounder })
    .from(storeMembers)
    .where(and(eq(storeMembers.id, memberId), eq(storeMembers.storeId, storeId)))
    .limit(1);

  if (!member) throw new Error("Member not found.");
  if (member.isFounder) throw new Error("The founding owner's role cannot be changed.");

  await db
    .update(storeMembers)
    .set({ role: newRole })
    .where(eq(storeMembers.id, memberId));
}

export async function getStoreInviteCode(storeId: number): Promise<string | null> {
  const [store] = await db
    .select({ inviteCode: stores.inviteCode })
    .from(stores)
    .where(eq(stores.id, storeId))
    .limit(1);
  return store?.inviteCode ?? null;
}
