import Link from "next/link";
import { Suspense } from "react";
import { RegisterForm } from "@/app/register/RegisterForm";
import { ThemeToggle } from "@/components/theme-toggle";

export const runtime = "nodejs";

export default function RegisterPage() {
  return (
    <main className="relative flex flex-1 items-center justify-center p-4">
      <Link href="/" className="absolute top-3 left-3 btn btn-ghost px-3 py-2 text-xs">
        ← Back
      </Link>
      <div className="absolute top-3 right-3">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <Suspense>
          <RegisterForm />
        </Suspense>
      </div>
    </main>
  );
}
