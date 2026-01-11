import { redirect } from "next/navigation";
import { RegisterForm } from "@/app/register/RegisterForm";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto max-w-md p-4">
      <RegisterForm />
    </main>
  );
}

