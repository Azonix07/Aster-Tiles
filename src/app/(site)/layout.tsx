import SmoothScroll from "@/components/SmoothScroll";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PaymentsBanner from "@/components/shop/PaymentsBanner";
import MobileTabBar from "@/components/mobile/MobileTabBar";

export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SmoothScroll>
      <Nav />
      <main>{children}</main>
      <Footer />
      {/* clearance so the mobile tab bar never covers page content */}
      <div className="h-24 lg:hidden" aria-hidden="true" />
      <PaymentsBanner />
      <MobileTabBar />
    </SmoothScroll>
  );
}
