"use client";

import { useEffect, useRef } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import type { PublicUser } from "@/lib/auth";

/**
 * PostHog is initialised in `instrumentation-client.ts` (the /ingest reverse-proxy
 * setup added by the PostHog wizard) — that owns capture. This provider only layers
 * on user identification so captured events tie back to logged-in customers, and
 * exposes the client via context for usePostHog(). It never calls init() itself.
 */
export default function PostHogProvider({
  user,
  children,
}: {
  user: PublicUser | null;
  children: React.ReactNode;
}) {
  const wasIdentified = useRef(false);

  useEffect(() => {
    if (!posthog.__loaded) return;
    if (user) {
      posthog.identify(user.id, {
        email: user.email,
        name: user.name,
        is_admin: user.isAdmin,
      });
      wasIdentified.current = true;
    } else if (wasIdentified.current) {
      // Only reset on an actual logout — never wipe a guest's anonymous id on load.
      posthog.reset();
      wasIdentified.current = false;
    }
  }, [user]);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
