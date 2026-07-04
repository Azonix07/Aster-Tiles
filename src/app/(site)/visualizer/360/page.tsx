import type { Metadata } from "next";
import Room360App from "@/components/visualizer/Room360App";

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
  return (
    <div className="bg-ink pt-17">
      <Room360App initialTileId={tile} />
    </div>
  );
}
