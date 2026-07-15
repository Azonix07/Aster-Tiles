import type { Metadata, Viewport } from "next";
import { Archivo, Inter } from "next/font/google";
import "./globals.css";
import StoreProvider, { type PublicSettings } from "@/components/StoreProvider";
import CartProvider from "@/components/CartProvider";
import PostHogProvider from "@/components/PostHogProvider";
import { getContent, getSettings, getTiles } from "@/lib/db";
import { currentUser, toPublicUser } from "@/lib/auth";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  weight: ["400", "500", "700", "800", "900"],
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export async function generateMetadata(): Promise<Metadata> {
  const { site, media } = await getContent();
  return {
    metadataBase: new URL("https://astertiles.ie"),
    title: {
      default: `${site.name} – ${site.tagline}`,
      template: `%s | ${site.name}`,
    },
    description: site.description,
    keywords: [
      "tiles Donegal",
      "tiles Ireland",
      "wooden floors",
      "bathroom tiles",
      "buy tiles online",
      "Lifford tiles",
      site.name,
      "room visualizer",
    ],
    openGraph: {
      title: `${site.name} – ${site.tagline}`,
      description: site.description,
      type: "website",
      locale: "en_IE",
      images: [{ url: media.ogImage, width: 2000, height: 1116 }],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#16181d",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const content = await getContent();
  const tiles = await getTiles();
  const settings = await getSettings();
  const user = toPublicUser(await currentUser());

  const publicSettings: PublicSettings = {
    currencySymbol: settings.currencySymbol,
    deliveryFee: settings.deliveryFee,
    freeDeliveryOver: settings.freeDeliveryOver,
    codEnabled: settings.codEnabled,
    razorpayEnabled: settings.razorpayEnabled,
    paymentsDown: settings.maintenance.payments,
    maintenanceMessage: settings.maintenance.message,
  };

  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${archivo.variable} ${inter.variable}`}
    >
      <body className="antialiased">
        <PostHogProvider user={user}>
          <StoreProvider
            value={{ content, tiles, settings: publicSettings, user }}
          >
            <CartProvider>{children}</CartProvider>
          </StoreProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
