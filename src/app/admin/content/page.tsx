import { getContent } from "@/lib/db";
import {
  CollectionsForm,
  GalleryForm,
  SiteInfoForm,
  StaffForm,
  TestimonialsForm,
} from "@/components/admin/ContentForms";
import { requirePermission } from "@/lib/adminGuard";

export default async function AdminContentPage() {
  await requirePermission("content");
  const content = await getContent();

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="display text-3xl text-navy">Site content</h1>
      <p className="mt-2 text-sm text-muted">
        Everything here goes live on the website the moment you save a section. Tiles have their
        own page under <span className="font-bold text-navy">Tiles</span>.
      </p>

      <div className="mt-8 space-y-10">
        <SiteInfoForm initial={content.site} />
        <CollectionsForm initial={content.collections} />
        <StaffForm initial={content.staff} />
        <TestimonialsForm initial={content.testimonials} />
        <GalleryForm initial={content.gallery} />
      </div>
    </div>
  );
}
