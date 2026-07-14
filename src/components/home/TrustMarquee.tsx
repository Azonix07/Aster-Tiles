import { getContent } from "@/lib/db";

/**
 * Static USP bar under the hero — the admin-editable trust points laid out
 * like a retailer's service strip. Square green chips echo the tile motif;
 * no animation, everything readable at a glance.
 */
export default async function TrustMarquee() {
  const items = (await getContent()).home.marquee;

  return (
    <div className="border-y border-mist bg-white">
      <ul className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6 py-4">
        {items.map((t) => (
          <li
            key={t}
            className="flex items-center gap-2.5 font-display text-[0.8rem] font-semibold tracking-wide text-body"
          >
            <span className="h-1.5 w-1.5 shrink-0 bg-green" aria-hidden="true" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
