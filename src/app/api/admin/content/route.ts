import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { mutateDb, type SiteContent } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/roles";

/**
 * Replaces one section of the editable site content at a time:
 * { section: "site" | "staff" | "testimonials" | "collections" | "gallery"
 *            | "media" | "home", value: ... }
 */
export async function PUT(request: Request) {
  const user = await currentUser();

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

  // The Appearance page edits media/home; everything else is Site Content.
  const neededPerm = section === "media" || section === "home" ? "appearance" : "content";
  if (!can(user, neededPerm)) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }
  if (objectSections.includes(section)) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return NextResponse.json({ error: "That section must be an object." }, { status: 400 });
    }
  } else if (!Array.isArray(value)) {
    return NextResponse.json({ error: "That section must be a list." }, { status: 400 });
  }

  await mutateDb((db) => {
    // Merge objects so a partial edit can't wipe fields; replace lists outright.
    if (section === "site" || section === "media" || section === "home") {
      (db.content[section] as object) = { ...db.content[section], ...(value as object) };
    } else {
      (db.content[section] as unknown) = value;
    }
  });

  // Bust the Full Route Cache so the public site reflects the edit immediately.
  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true });
}
