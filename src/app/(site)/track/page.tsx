import type { Metadata } from "next";
import TrackForm from "@/components/shop/TrackForm";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Check the status of your Aster Tiles order.",
  robots: { index: false },
};

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ number?: string }>;
}) {
  const { number } = await searchParams;

  return (
    <section className="min-h-[70vh] bg-off pt-12 pb-20">
      <div className="mx-auto max-w-3xl px-6">
        <p className="label text-green">Order tracking</p>
        <h1 className="display mt-2 text-4xl text-navy sm:text-5xl">Track your order</h1>
        <p className="mt-3 max-w-xl text-sm text-muted">
          Enter your order number and the email you used at checkout — we&apos;ll show you exactly
          where it is. No account needed.
        </p>
        <div className="mt-8">
          <TrackForm initialNumber={number ?? ""} />
        </div>
      </div>
    </section>
  );
}
