import { getContent } from "@/lib/db";
import { HomeTextForm, MediaForm } from "@/components/admin/AppearanceForms";

export default function AdminAppearancePage() {
  const content = getContent();

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="display text-3xl text-navy">Appearance</h1>
      <p className="mt-2 text-sm text-muted">
        Background videos, section images and the home page headlines. Text, team, reviews
        and photo-grid edits live under{" "}
        <span className="font-bold text-navy">Site Content</span>.
      </p>

      <div className="mt-8 space-y-10">
        <MediaForm initial={content.media} />
        <HomeTextForm initial={content.home} />
      </div>
    </div>
  );
}
