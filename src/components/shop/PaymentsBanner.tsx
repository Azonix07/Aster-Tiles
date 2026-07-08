"use client";

import { useSettings } from "@/components/StoreProvider";

/**
 * Slim site-wide notice shown while online ordering is paused
 * (payments maintenance mode) — browsing stays fully open.
 */
export default function PaymentsBanner() {
  const settings = useSettings();
  if (!settings.paymentsDown) return null;

  return (
    <div className="fixed inset-x-0 bottom-20 z-50 border-t border-gold/40 bg-ink/95 px-4 py-3 text-center backdrop-blur-md lg:bottom-0">
      <p className="text-xs font-medium text-gold sm:text-sm">
        <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-gold align-middle" />
        Ordering is temporarily paused — {settings.maintenanceMessage}
      </p>
    </div>
  );
}
