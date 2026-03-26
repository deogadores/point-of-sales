import { Suspense } from "react";
import { RegisterForm } from "@/app/register/RegisterForm";

export const runtime = "nodejs";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Suspense>
          <RegisterForm />
        </Suspense>
      </div>
    </main>
  );
}
