import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getSession } from "@/lib/auth/session";
import { StoreSetupForm } from "./StoreSetupForm";

export const runtime = "nodejs";

export default async function StoreSetupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <StoreSetupForm />
      </div>
    </main>
  );
}
