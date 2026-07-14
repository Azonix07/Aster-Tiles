import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Room360App from "@/components/visualizer/Room360App";
import { currentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "360° Room View",
  description:
    "Stand in the middle of a fully furnished room and look around in 360° — swap the floor and walls to any Aster tile in real time.",
};

export default async function Room360Page({
  searchParams,
}: {
  searchParams: Promise<{ tile?: string }>;
}) {
  const { tile } = await searchParams;
  if (!(await currentUser())) {
    const dest = tile ? `/visualizer/360?tile=${encodeURIComponent(tile)}` : "/visualizer/360";
    redirect(`/login?next=${encodeURIComponent(dest)}`);
  }
  return (
    <div>
      <Room360App initialTileId={tile} />
    </div>
  );
}
