"use server";

import { redirect } from "next/navigation";
import { login, logout, registerStoreAndOwner } from "@/lib/auth";

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

export async function registerAction(
  _: AuthState,
  formData: FormData
): Promise<AuthState> {
  try {
    await registerStoreAndOwner({
      storeName: String(formData.get("storeName") ?? ""),
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? "")
    });
  } catch (e: any) {
    return { error: e?.message ? String(e.message) : "Registration failed." };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}

