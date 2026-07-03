"use client";

import Link from "next/link";
import ScrubVideo from "@/components/scroll/ScrubVideo";
import { useStore } from "@/components/StoreProvider";
import { Accent } from "@/components/Accent";

/**
 * Act III — Meet the people. The camera settles at the counter and the
 * team looks up; names fade in as the shot completes.
 */
export default function StaffScene() {
  const { staff, media, home } = useStore().content;
  return (
    <ScrubVideo
      src={media.staffVideo.src}
      poster={media.staffVideo.poster}
      pinHeight={240}
    >
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-ink/60 via-transparent to-ink/70" />

      <div
        data-window="0.04,0.42"
        className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center"
      >
        <p className="label text-green">{home.staffLabel}</p>
        <h2 className="display mt-4 max-w-3xl text-4xl text-white sm:text-6xl">
          <Accent text={home.staffHeadline} accentClass="accent-italic text-white/85" />
        </h2>
      </div>

      <div
        data-window="0.55,1"
        className="absolute inset-0 z-20 flex flex-col items-center justify-end gap-8 px-6 pb-20 text-center"
      >
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-3">
          {staff.map((m) => (
            <div key={m.id}>
              <div className="font-display text-lg font-bold text-white">{m.name}</div>
              <div className="text-xs tracking-[0.16em] text-green uppercase">{m.role}</div>
            </div>
          ))}
        </div>
        <Link href="/about" className="btn btn-green">
          Say Hello — About Us
        </Link>
      </div>
    </ScrubVideo>
  );
}
