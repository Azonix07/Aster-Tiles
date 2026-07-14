import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import { requirePermission } from "@/lib/adminGuard";

export const metadata = {
  title: "Analytics",
};

export default async function AdminAnalyticsPage() {
  await requirePermission("analytics");
  return <AnalyticsDashboard />;
}
