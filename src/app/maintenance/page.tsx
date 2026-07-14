import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { getContent, getSettings } from "@/lib/db";

export const metadata: Metadata = {
  title: "Back soon",
  robots: { index: false },
};

export default function MaintenancePage() {
  const settings = getSettings();
  const { site } = getContent();

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgba(45,184,124,0.16),transparent_60%)]" />
      <div className="relative max-w-xl text-center">
        <div className="flex justify-center">
          <Logo />
        </div>
        <p className="label mt-10 text-green">Scheduled maintenance</p>
        <h1 className="display mt-4 text-4xl text-white sm:text-5xl">
          We&apos;re just <em className="not-italic text-green">regrouting.</em>
        </h1>
        <p className="mx-auto mt-6 max-w-md text-white/65">{settings.maintenance.message}</p>
        <p className="mt-8 text-sm text-white/40">
          Need us right now? Ring{" "}
          <a href={site.phoneHref} className="font-bold text-green hover:text-white">
            {site.phone}
          </a>{" "}
          or email{" "}
          <a href={site.emailHref} className="font-bold text-green hover:text-white">
            {site.email}
          </a>
        </p>
        <Link
          href="/login"
          className="mt-10 inline-block text-xs text-white/25 transition hover:text-white/60"
        >
          Staff login
        </Link>
      </div>
    </section>
  );
}
