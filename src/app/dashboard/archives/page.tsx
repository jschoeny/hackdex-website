import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ArchivesList from "@/components/Dashboard/ArchivesList";
import { getArchives } from "./actions";

export default async function ArchivesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Check if user is admin or archiver
  const { data: isAdmin } = await supabase.rpc("is_admin");
  const { data: isArchiver } = await supabase.rpc("is_archiver");
  if (!isAdmin && !isArchiver) {
    redirect("/dashboard");
  }

  // Fetch initial page of archives
  const initialData = await getArchives({ page: 1, limit: 50 });

  return (
    <div className="mx-auto my-12 max-w-screen-xl px-6 py-8 w-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Archive Management</h1>
        <p className="mt-2 text-[15px] text-foreground/80">
          Manage all Archive hacks. Archive hacks are informational entries preserved for historical reference.
        </p>
      </div>
      <ArchivesList initialData={initialData.ok ? initialData : { ok: false, error: initialData.error || "Failed to load archives" }} isAdmin={isAdmin ?? false} />
    </div>
  );
}
