import { getSettings, STORE_STATUS } from "@/lib/db";
import SettingsForm from "@/components/admin/SettingsForm";
import { requirePermission } from "@/lib/adminGuard";

export default async function AdminSettingsPage() {
  await requirePermission("settings");
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="display text-3xl text-navy">Settings</h1>
      <p className="mt-2 text-sm text-muted">
        Maintenance switches, payment methods and delivery pricing.
      </p>

      {STORE_STATUS.productionWithoutStore && (
        <div className="mt-6 rounded-xl border border-red-300 bg-red-50 px-4 py-4 text-sm text-red-800">
          <p className="font-display font-bold">⚠️ Changes won&apos;t be saved</p>
          <p className="mt-1 leading-relaxed">
            This deployment has no database connected, so every change here — including the
            maintenance toggle — is discarded. Add the <strong>Upstash Redis</strong> integration in
            your Vercel project (Storage → Create Database → Upstash for Redis), which sets{" "}
            <code className="rounded bg-red-100 px-1 font-mono text-[0.85em]">KV_REST_API_URL</code>{" "}
            and{" "}
            <code className="rounded bg-red-100 px-1 font-mono text-[0.85em]">KV_REST_API_TOKEN</code>
            , then redeploy.
          </p>
        </div>
      )}

      <div className="mt-8">
        <SettingsForm initial={settings} />
      </div>
    </div>
  );
}
