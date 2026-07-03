import { NextResponse } from "next/server";
import { mutateDb, type SiteContent } from "@/lib/db";
import { currentUser } from "@/lib/auth";

/**
 * Replaces one section of the editable site content at a time:
 * { section: "site" | "staff" | "testimonials" | "collections" | "gallery", value: ... }
 */
export async function PUT(request: Request) {
  const user = await currentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as {
    section?: keyof SiteContent;
    value?: unknown;
  } | null;

  const sections: (keyof SiteContent)[] = ["site", "staff", "testimonials", "collections", "gallery"];
  if (!body?.section || !sections.includes(body.section) || body.value === undefined) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const { section, value } = body;
  if (section === "site") {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return NextResponse.json({ error: "Site info must be an object." }, { status: 400 });
    }
  } else if (!Array.isArray(value)) {
    return NextResponse.json({ error: "That section must be a list." }, { status: 400 });
  }

  mutateDb((db) => {
    // Merge for "site" so a partial edit can't wipe fields; replace for lists.
    if (section === "site") {
      db.content.site = { ...db.content.site, ...(value as object) } as SiteContent["site"];
    } else {
      (db.content[section] as unknown) = value;
    }
  });

  return NextResponse.json({ ok: true });
}
