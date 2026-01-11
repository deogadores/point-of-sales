import { redirect } from "next/navigation";
import { LoginForm } from "@/app/login/LoginForm";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto max-w-md p-4">
      <LoginForm />
    </main>
  );
}

