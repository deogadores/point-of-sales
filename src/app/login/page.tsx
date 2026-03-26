import { redirect } from "next/navigation";
import { LoginForm } from "@/app/login/LoginForm";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </main>
  );
}

