import Link from "next/link";
import { redirect } from "next/navigation";
import { RequestAccessForm } from "./RequestAccessForm";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <div className="max-w-md">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Simple POS</h1>
          <p className="mt-3 text-slate-500">
            Manage products, track stock, record sales, and monitor profit — all in one place.
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm text-slate-500">
            {["Products & pricing", "Stock tracking", "Sales & profit", "Reservations"].map((f) => (
              <span key={f} className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                {f}
              </span>
            ))}
          </div>

          <div className="mt-8 flex justify-center gap-3">
            <Link href="/login" className="btn btn-primary px-5 py-2.5">
              Sign in
            </Link>
            <Link href="/register" className="btn btn-ghost px-5 py-2.5">
              Create account
            </Link>
          </div>
        </div>
      </section>

      {/* Request Access */}
      <section id="request-access" className="border-t bg-slate-50/80 px-6 py-16">
        <div className="mx-auto max-w-md">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Request access</h2>
            <p className="mt-1 text-sm text-slate-500">
              Fill out the form and we&apos;ll send you a registration phrase if approved.
            </p>
          </div>
          <RequestAccessForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-5">
        <div className="mx-auto flex max-w-md items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-600">Simple POS</span>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
