import SmoothScroll from "@/components/SmoothScroll";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PaymentsBanner from "@/components/shop/PaymentsBanner";

export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SmoothScroll>
      <Nav />
      <main>{children}</main>
      <Footer />
      <PaymentsBanner />
    </SmoothScroll>
  );
}
