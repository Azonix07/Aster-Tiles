import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/shop/AuthForms";
import { currentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Log in",
  robots: { index: false },
};

function safeNext(raw: string | undefined): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNext((await searchParams).next);
  if (await currentUser()) redirect(next === "/" ? "/account" : next);

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy px-6 py-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(45,184,124,0.18),transparent_60%)]" />
      <div className="relative w-full max-w-md">
        <LoginForm next={next} />
      </div>
    </section>
  );
}
