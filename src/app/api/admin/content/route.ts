import { NextResponse } from "next/server";
import { mutateDb, type SiteContent } from "@/lib/db";
import { currentUser } from "@/lib/auth";

/**
 * Replaces one section of the editable site content at a time:
 * { section: "site" | "staff" | "testimonials" | "collections" | "gallery"
 *            | "media" | "home", value: ... }
 */
export async function PUT(request: Request) {
  const user = await currentUser();
  if (!user?.isAdmin) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as {
    section?: keyof SiteContent;
    value?: unknown;
  } | null;

  const objectSections: (keyof SiteContent)[] = ["site", "media", "home"];
  const listSections: (keyof SiteContent)[] = ["staff", "testimonials", "collections", "gallery"];
  if (
    !body?.section ||
    (!objectSections.includes(body.section) && !listSections.includes(body.section)) ||
    body.value === undefined
  ) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const { section, value } = body;
  if (objectSections.includes(section)) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return NextResponse.json({ error: "That section must be an object." }, { status: 400 });
    }
  } else if (!Array.isArray(value)) {
    return NextResponse.json({ error: "That section must be a list." }, { status: 400 });
  }

  mutateDb((db) => {
    // Merge objects so a partial edit can't wipe fields; replace lists outright.
    if (section === "site" || section === "media" || section === "home") {
      (db.content[section] as object) = { ...db.content[section], ...(value as object) };
    } else {
      (db.content[section] as unknown) = value;
    }
  });

  return NextResponse.json({ ok: true });
}
