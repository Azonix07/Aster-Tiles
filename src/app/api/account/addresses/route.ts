import { NextResponse } from "next/server";
import { mutateDb, newId, type Address } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as Partial<Address> | null;
  const required: (keyof Address)[] = ["fullName", "phone", "line1", "city", "county", "postcode"];
  if (!body || required.some((f) => !String(body[f] ?? "").trim())) {
    return NextResponse.json({ error: "Please fill in every address field." }, { status: 400 });
  }

  const address: Address = {
    id: newId(),
    fullName: String(body.fullName).trim(),
    phone: String(body.phone).trim(),
    line1: String(body.line1).trim(),
    line2: String(body.line2 ?? "").trim(),
    city: String(body.city).trim(),
    county: String(body.county).trim(),
    postcode: String(body.postcode).trim(),
  };

  mutateDb((db) => {
    const dbUser = db.users.find((u) => u.id === user.id);
    if (dbUser) dbUser.addresses.push(address);
  });

  return NextResponse.json({ ok: true, address });
}

export async function DELETE(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const { id } = (await request.json().catch(() => ({}))) as { id?: string };
  if (!id) return NextResponse.json({ error: "Missing address id." }, { status: 400 });

  mutateDb((db) => {
    const dbUser = db.users.find((u) => u.id === user.id);
    if (dbUser) dbUser.addresses = dbUser.addresses.filter((a) => a.id !== id);
  });

  return NextResponse.json({ ok: true });
}
