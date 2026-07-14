"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import type { PublicUser } from "@/lib/auth";

/**
 * Client-side PostHog. Initialised once with the public project key; if the key
 * is absent (e.g. local dev without env) it stays inert so the site still works.
 *
 * We mirror the exact config the project uses in PostHog: `defaults: "2026-05-30"`
 * auto-captures pageviews/pageleaves including client-side (App Router) route
 * changes, so no manual pageview wiring is needed. Logged-in customers are tied
 * to their account via identify() so admin analytics can see who did what.
 */
export default function PostHogProvider({
  user,
  children,
}: {
  user: PublicUser | null;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || posthog.__loaded) return;
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      defaults: "2026-05-30",
      person_profiles: "identified_only",
    });
  }, []);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY || !posthog.__loaded) return;
    if (user) {
      posthog.identify(user.id, {
        email: user.email,
        name: user.name,
        is_admin: user.isAdmin,
      });
    }
  }, [user]);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
