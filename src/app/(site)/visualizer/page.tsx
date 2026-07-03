import type { Metadata } from "next";
import Reveal, { RevealLines } from "@/components/scroll/Reveal";
import VisualizerApp from "@/components/visualizer/VisualizerApp";

export const metadata: Metadata = {
  title: "Room Visualizer",
  description:
    "See any Aster tile in your own room before you buy — a true-scale 3D design studio, photo overlay with perspective, and AI-powered redesigns.",
};

const FEATURES = [
  "True-scale 3D room preview from your real measurements",
  "Overlay tiles onto a photo of your own floor or wall",
  "AI redesign that re-surfaces your room photorealistically",
  "Live tile count, order quantity and cost — 10% waste included",
];

export default function VisualizerPage() {
  return (
    <div className="bg-ink text-white">
      {/* ── Cinematic intro ─────────────────────── */}
      <section className="relative overflow-hidden pt-36 pb-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_25%_10%,rgba(45,184,124,0.14),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_60%,rgba(201,168,76,0.07),transparent_60%)]" />
        <div className="relative mx-auto max-w-[1500px] px-4 sm:px-6">
          <Reveal>
            <p data-reveal className="label text-green">
              Room Visualizer
            </p>
          </Reveal>
          <RevealLines
            as="h1"
            text={"See it before\nyou buy it"}
            className="display mt-4 text-5xl text-white sm:text-6xl lg:text-7xl"
          />
          <Reveal className="mt-6 grid gap-10 lg:grid-cols-2">
            <p data-reveal className="max-w-xl text-lg text-white/65">
              Three ways to try any tile in our range —{" "}
              <em className="accent-italic text-green">before</em> a single box leaves the
              showroom. Design a room from scratch, work on a photo of your own home, or
              let our AI re-imagine the space entirely.
            </p>
            <ul data-reveal className="grid gap-3 self-end text-sm text-white/75 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-green" />
                  {f}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ── The tool ────────────────────────────── */}
      <section className="relative pb-28">
        <VisualizerApp />
      </section>
    </div>
  );
}
