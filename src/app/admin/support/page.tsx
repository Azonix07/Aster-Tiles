import { requirePermission } from "@/lib/adminGuard";
import { getDb } from "@/lib/db";
import { emailConfigured } from "@/lib/email";
import SupportInbox from "@/components/support/SupportInbox";

export const metadata = { title: "Support" };

export default async function AdminSupportPage() {
  await requirePermission("tickets");
  const tickets = [...(await getDb()).tickets].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
  return <SupportInbox initialTickets={tickets} emailReady={emailConfigured()} />;
}
