import Link from "next/link";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { getCurrentUser } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";

export const runtime = "nodejs";

export default async function ForgotPasswordPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="relative flex flex-1 items-center justify-center p-4">
      <Link href="/login" className="absolute top-3 left-3 btn btn-ghost px-3 py-2 text-xs">
        ← Back
      </Link>
      <div className="absolute top-3 right-3">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
