import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { canEditAsCreator } from "@/utils/hack";
import VersionList from "@/components/Hack/VersionList";
import Link from "next/link";
import { FaChevronLeft, FaPlus } from "react-icons/fa6";

interface VersionsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function VersionsPage({ params }: VersionsPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch hack
  const { data: hack } = await supabase
    .from("hacks")
    .select("slug, title, created_by, current_patch, original_author, permission_from, base_rom")
    .eq("slug", slug)
    .maybeSingle();

  if (!hack) return notFound();

  // Check if user can edit (creator only for version management)
  const canEdit = user ? canEditAsCreator(hack, user.id) : false;

  // Fetch all published, non-archived patches
  const { data: patches } = await supabase
    .from("patches")
    .select("id, version, created_at, updated_at, changelog, published, archived")
    .eq("parent_hack", slug)
    .eq("published", true)
    .eq("archived", false)
    .order("created_at", { ascending: false });

  // Also fetch unpublished patches if user can edit
  let unpublishedPatches: any[] = [];
  if (canEdit) {
    const { data: unpub } = await supabase
      .from("patches")
      .select("id, version, created_at, updated_at, changelog, published, archived")
      .eq("parent_hack", slug)
      .eq("published", false)
      .eq("archived", false)
      .order("created_at", { ascending: false });
    unpublishedPatches = unpub || [];
  }

  const allPatches = [...(patches || []), ...unpublishedPatches].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="mx-auto w-full max-w-screen-md px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-6">
        <Link 
          href={`/hack/${slug}`}
          className="inline-flex items-center text-sm text-foreground/60 hover:text-foreground mb-3"
        >
          <FaChevronLeft size={14} className="mr-1" />
          Back to hack
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
          {canEdit ? "Manage Versions" : "Version History"}
        </h1>
        <p className="text-sm text-foreground/60 mb-4">
          {hack.title}
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            href={`/hack/${slug}/changelog`}
            className="inline-flex items-center justify-center h-10 px-4 text-sm font-medium rounded-md border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors"
          >
            View Changelog
          </Link>
          {canEdit && (
            <Link
              href={`/hack/${slug}/edit/patch`}
              className="inline-flex items-center justify-center h-10 px-4 text-sm font-semibold rounded-md bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent-700)] transition-colors"
            >
              <FaPlus size={14} className="mr-2" />
              Upload New Version
            </Link>
          )}
        </div>
      </div>

      <VersionList
        patches={allPatches}
        currentPatchId={hack.current_patch}
        canEdit={canEdit}
        hackSlug={slug}
        baseRom={hack.base_rom}
      />
    </div>
  );
}

