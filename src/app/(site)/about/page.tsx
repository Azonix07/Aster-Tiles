import type { Metadata } from "next";
import AboutHero from "@/components/about/AboutHero";
import StorySection from "@/components/about/StorySection";
import StatsBand from "@/components/about/StatsBand";
import TeamGrid from "@/components/about/TeamGrid";
import ValuesSection from "@/components/about/ValuesSection";
import ShowroomSection from "@/components/about/ShowroomSection";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "The story of Aster Tiles — founded on The Haw in Lifford, Co. Donegal, serving Irish homes with premium tiles, wooden floors and bathrooms for over 15 years.",
};

/**
 * The About journey: arrive at the showroom → the founding story →
 * the numbers → the people → what we stand for → come visit.
 */
export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <StorySection />
      <StatsBand />
      <TeamGrid />
      <ValuesSection />
      <ShowroomSection />
    </>
  );
}
