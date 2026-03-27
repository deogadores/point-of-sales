import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/app/login/LoginForm";
import { getCurrentUser } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";

export const runtime = "nodejs";

interface LoginPageProps {
  searchParams: Promise<{ reset?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const { reset } = await searchParams;

  return (
    <main className="relative flex flex-1 items-center justify-center p-4">
      <Link href="/" className="absolute top-3 left-3 btn btn-ghost px-3 py-2 text-xs">
        ← Back
      </Link>
      <div className="absolute top-3 right-3">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        {reset === "1" && (
          <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400">
            Password reset successfully. You can now sign in with your new password.
          </div>
        )}
        <LoginForm />
      </div>
    </main>
  );
}

