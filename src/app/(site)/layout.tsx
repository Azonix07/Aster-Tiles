import SmoothScroll from "@/components/SmoothScroll";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PaymentsBanner from "@/components/shop/PaymentsBanner";
import MobileTabBar from "@/components/mobile/MobileTabBar";
import ScrollProgress from "@/components/interactive/ScrollProgress";
import ChatWidget from "@/components/chat/ChatWidget";

export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SmoothScroll>
      <ScrollProgress />
      <Nav />
      {/* pt matches the fixed h-17 header now that pages open on light ground */}
      <main className="pt-17">{children}</main>
      <Footer />
      {/* clearance so the mobile tab bar never covers page content */}
      <div className="h-24 lg:hidden" aria-hidden="true" />
      <PaymentsBanner />
      <MobileTabBar />
      <ChatWidget />
    </SmoothScroll>
  );
}
