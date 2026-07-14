import { getSettings } from "@/lib/db";
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
      <div className="mt-8">
        <SettingsForm initial={settings} />
      </div>
    </div>
  );
}
