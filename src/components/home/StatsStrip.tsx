import Image from "next/image";
import Counter from "@/components/scroll/Counter";
import { getContent, getTiles } from "@/lib/db";

/**
 * The headline numbers presented as showroom sample swatches: each stat
 * sits on a real tile texture with a white sample-label plate, the way
 * swatches are tagged on the Lifford sample boards.
 */
export default function StatsStrip() {
  const { site } = getContent();
  const textures = getTiles()
    .map((t) => t.texture)
    .slice(0, site.stats.length);

  return (
    <div className="grid w-full max-w-md grid-cols-3 gap-3">
      {site.stats.map((s, i) => (
        <div
          key={s.label}
          className="group overflow-hidden rounded-xl border border-mist bg-white shadow-sm transition-transform duration-300 hover:-translate-y-1"
        >
          <div className="relative h-16 sm:h-20">
            {textures[i] ? (
              <Image
                src={textures[i]}
                alt=""
                fill
                sizes="140px"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="h-full w-full bg-mist" />
            )}
          </div>
          <div className="border-t border-mist px-3 py-2.5">
            <Counter
              value={s.value}
              suffix={s.suffix}
              className="display block text-xl text-navy sm:text-2xl"
            />
            <div className="mt-0.5 text-[0.58rem] font-bold tracking-[0.12em] text-muted uppercase">
              {s.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
