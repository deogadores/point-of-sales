import Link from "next/link";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { ThemeToggle } from "@/components/theme-toggle";

export const runtime = "nodejs";

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;
  if (!token) redirect("/forgot-password");

  return (
    <main className="relative flex flex-1 items-center justify-center p-4">
      <Link href="/login" className="absolute top-3 left-3 btn btn-ghost px-3 py-2 text-xs">
        ← Back
      </Link>
      <div className="absolute top-3 right-3">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <ResetPasswordForm token={token} />
      </div>
    </main>
  );
}
