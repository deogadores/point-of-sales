import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto max-w-3xl p-4">
      <div className="card">
        <h1 className="text-2xl font-semibold tracking-tight">Simple POS</h1>
        <p className="mt-1 text-sm text-slate-600">
          A lightweight POS with products, stock, sales, and profit tracking.
        </p>
        <p className="mt-4 text-sm text-slate-600">
          Continue to{" "}
          <Link className="underline" href="/login">
            login
          </Link>{" "}
          or{" "}
          <Link className="underline" href="/register">
            create a store
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

