import HeroScene from "@/components/home/HeroScene";
import TrustMarquee from "@/components/home/TrustMarquee";
import ShowroomScene from "@/components/home/ShowroomScene";
import CollectionsRail from "@/components/home/CollectionsRail";
import WhyAster from "@/components/home/WhyAster";
import GalleryWall from "@/components/home/GalleryWall";
import StaffScene from "@/components/home/StaffScene";
import VisualizerTeaser from "@/components/home/VisualizerTeaser";
import Testimonials from "@/components/home/Testimonials";
import ContactCta from "@/components/home/ContactCta";

/**
 * The journey: arrive at the shop → step inside → walk the tile room →
 * why Aster → real homes → meet the staff → try the visualizer →
 * reviews → visit us.
 */
export default function Home() {
  return (
    <>
      <HeroScene />
      <TrustMarquee />
      <ShowroomScene />
      <CollectionsRail />
      <WhyAster />
      <GalleryWall />
      <StaffScene />
      <VisualizerTeaser />
      <Testimonials />
      <ContactCta />
    </>
  );
}
