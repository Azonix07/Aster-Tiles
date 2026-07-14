import { requirePanel } from "@/lib/adminGuard";
import { ROLE_LABELS } from "@/lib/roles";
import ProfileForm from "@/components/admin/ProfileForm";

export const metadata = { title: "My profile" };

export default async function AdminProfilePage() {
  const me = await requirePanel();

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm text-muted">Your account · {ROLE_LABELS[me.role]}</p>
      <h1 className="display mt-1 text-3xl text-navy">My profile</h1>
      <p className="mt-2 text-sm text-muted">Update your details and password.</p>
      <div className="mt-8">
        <ProfileForm
          initial={{ name: me.name, email: me.email, phone: me.phone ?? "" }}
        />
      </div>
    </div>
  );
}
