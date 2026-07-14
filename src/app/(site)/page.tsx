import HomeHero from "@/components/home/HomeHero";
import TrustMarquee from "@/components/home/TrustMarquee";
import CollectionsGrid from "@/components/home/CollectionsGrid";
import FeaturedTiles from "@/components/home/FeaturedTiles";
import VisualizerTeaser from "@/components/home/VisualizerTeaser";
import WhyAster from "@/components/home/WhyAster";
import GalleryWall from "@/components/home/GalleryWall";
import Testimonials from "@/components/home/Testimonials";
import ContactCta from "@/components/home/ContactCta";

/**
 * One clean, light homepage for every screen size: hero → trust strip →
 * the numbers → collections → featured tiles → visualizer → why Aster →
 * real homes → reviews → visit us.
 */
export default function Home() {
  return (
    <>
      <HomeHero />
      <TrustMarquee />
      <CollectionsGrid />
      <FeaturedTiles />
      <VisualizerTeaser />
      <WhyAster />
      <GalleryWall />
      <Testimonials />
      <ContactCta />
    </>
  );
}
