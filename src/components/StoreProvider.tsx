"use client";

import { createContext, useContext } from "react";
import type { DbTile, SiteContent } from "@/lib/db";
import type { PublicUser } from "@/lib/auth";

/** Subset of shop settings that is safe & useful on the client. */
export interface PublicSettings {
  currencySymbol: string;
  deliveryFee: number;
  freeDeliveryOver: number;
  codEnabled: boolean;
  razorpayEnabled: boolean;
  paymentsDown: boolean;
  maintenanceMessage: string;
}

export interface StoreValue {
  content: SiteContent;
  tiles: DbTile[];
  settings: PublicSettings;
  user: PublicUser | null;
}

const StoreContext = createContext<StoreValue | null>(null);

export default function StoreProvider({
  value,
  children,
}: {
  value: StoreValue;
  children: React.ReactNode;
}) {
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

export function useSite() {
  return useStore().content.site;
}

export function useSettings() {
  return useStore().settings;
}

export function useUser() {
  return useStore().user;
}

export function useTiles() {
  return useStore().tiles;
}
