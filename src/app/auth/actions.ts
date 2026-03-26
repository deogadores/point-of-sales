"use server";

import { redirect } from "next/navigation";
import { login, logout, register, setupStore, joinStore } from "@/lib/auth";
import { getSession } from "@/lib/auth/session";
import { requestToolAccess } from "@/lib/auth/api-client";

export type AuthState = { error?: string };

export async function loginAction(_: AuthState, formData: FormData): Promise<AuthState> {
  try {
    await login({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? "")
    });
  } catch (e: any) {
    return { error: e?.message ? String(e.message) : "Login failed." };
  }
  redirect("/dashboard");
}

export async function registerAction(_: AuthState, formData: FormData): Promise<AuthState> {
  try {
    await register({
      registrationPhrase: String(formData.get("registrationPhrase") ?? ""),
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? "")
    });
  } catch (e: any) {
    return { error: e?.message ? String(e.message) : "Registration failed." };
  }
  redirect("/store-setup");
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}

export async function setupStoreAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const session = await getSession();
  if (!session) redirect("/login");

  try {
    await setupStore(
      session.user.id,
      session.user.name || session.user.email,
      session.user.email,
      { storeName: String(formData.get("storeName") ?? "") }
    );
  } catch (e: any) {
    return { error: e?.message ? String(e.message) : "Failed to create store." };
  }
  redirect("/dashboard");
}

export async function requestAccessAction(formData: FormData): Promise<AuthState> {
  const result = await requestToolAccess({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    reason: String(formData.get("reason") ?? ""),
  });
  if (!result.success) {
    return { error: result.error || "Failed to submit request." };
  }
  return {};
}

export async function joinStoreAction(_: AuthState, formData: FormData): Promise<AuthState> {
  const session = await getSession();
  if (!session) redirect("/login");

  try {
    await joinStore(
      session.user.id,
      session.user.name || session.user.email,
      session.user.email,
      { inviteCode: String(formData.get("inviteCode") ?? "") }
    );
  } catch (e: any) {
    return { error: e?.message ? String(e.message) : "Failed to join store." };
  }
  redirect("/dashboard");
}
