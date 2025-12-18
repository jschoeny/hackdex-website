import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FiAlertTriangle, FiExternalLink } from "react-icons/fi";
import DashboardClient from "@/components/Dashboard/DashboardClient";
import ArchiverManagement from "@/components/Dashboard/ArchiverManagement";
import { getDownloadsSeriesAll } from "./actions";
import type { HackRow } from "@/components/Dashboard/DashboardClient";

export default async function DashboardPage() {
  const supa = await createClient();
  const { data: userResp } = await supa.auth.getUser();
  const user = userResp.user;
  if (!user) redirect("/login");

  const { data: isAdmin } = await supa.rpc("is_admin");
  let pendingHacks: (HackRow & { created_by: string; creator_username: string | null; creator_full_name: string | null })[] = [];
  if (isAdmin) {
    const { data: pendingHacksData } = await supa
      .from("hacks")
      .select("slug,title,approved,updated_at,downloads,current_patch,version,created_at,created_by")
      .eq("approved", false)
      .order("created_at", { ascending: false });

    if (pendingHacksData && pendingHacksData.length > 0) {
      // Fetch creator usernames
      const creatorIds = [...new Set(pendingHacksData.map(h => h.created_by as string))];
      const { data: profiles } = await supa
        .from("profiles")
        .select("id,username,full_name")
        .in("id", creatorIds);

      const usernameById = new Map<string, string | null>();
      const fullNameById = new Map<string, string | null>();
      (profiles || []).forEach((p) => {
        usernameById.set(p.id, p.username);
        fullNameById.set(p.id, p.full_name);
      });

      pendingHacks = pendingHacksData.map((h) => ({
        ...h,
        creator_username: usernameById.get(h.created_by as string) || null,
        creator_full_name: fullNameById.get(h.created_by as string) || null,
      }));
    }
  }

  const { data: profile } = await supa
    .from("profiles")
    .select("username,full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.username == null) {
    redirect("/account");
  }

  const { username, full_name } = profile;

  // Check if user is admin or archiver for archives link
  const { data: isArchiver } = await supa.rpc("is_archiver");
  const canAccessArchives = isAdmin || isArchiver;

  const { data: hacks } = await supa
    .from("hacks")
    .select("slug,title,approved,updated_at,downloads,current_patch,version,created_at,original_author")
    .eq("created_by", user.id)
    .is("original_author", null) // Exclude Archive hacks
    .order("updated_at", { ascending: false });

  const seriesAll = await getDownloadsSeriesAll({ days: 30 });

  return (
    <div className="mx-auto my-auto max-w-screen-2xl px-6 py-8">
      <DashboardClient
        hacks={hacks ?? []}
        initialSeriesAll={seriesAll}
        displayName={full_name || `@${username}`}
      />

      {pendingHacks.length > 0 && (
        <div className="mt-12">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-xl font-semibold">Pending hacks</h2>
            <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-sm font-medium text-amber-900/90 dark:bg-amber-500/20 dark:text-amber-100 border border-amber-600/30">
              {pendingHacks.length}
            </span>
          </div>
          <div className="overflow-hidden rounded-lg border border-amber-600/30 bg-amber-500/5">
            {/* Header row (desktop only) */}
            <div className="hidden lg:grid grid-cols-12 bg-amber-500/5 px-4 py-2 text-xs text-amber-900/80 dark:text-amber-200/80">
              <div className="col-span-5">Title</div>
              <div className="col-span-3">Creator</div>
              <div className="col-span-4">Created</div>
            </div>
            <div className="divide-y divide-amber-600/20">
              {pendingHacks.map((h) => {
                const createdDate = h.created_at
                  ? new Date(h.created_at).toLocaleTimeString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Unknown";
                const creator = h.creator_username ? `@${h.creator_username}` : "Unknown";
                const hasMissingPatch = h.current_patch === null;
                const bgClasses = hasMissingPatch
                  ? "bg-amber-50/5 dark:bg-amber-900/5 hover:bg-amber-400/10 dark:hover:bg-amber-600/10"
                  : "bg-amber-500/5 hover:bg-amber-500/10";

                return (
                  <Link
                    key={h.slug}
                    href={`/hack/${h.slug}`}
                    target="_blank"
                    className={`group block px-4 py-3 text-sm ${bgClasses} transition-colors`}
                  >
                    {/* Desktop row */}
                    <div className="hidden lg:grid grid-cols-12 items-center">
                      <div className="col-span-5 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-start min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="truncate font-medium text-amber-900/90 dark:text-amber-200/90 group-hover:underline">{h.title}</div>
                              {hasMissingPatch && (
                                <div className="inline-flex items-center gap-1 rounded-full bg-amber-600/20 dark:bg-amber-600/40 px-2 py-0.5 text-xs font-medium text-amber-900/90 dark:text-amber-200/90">
                                  <FiAlertTriangle className="h-3 w-3 text-amber-900/90 dark:text-amber-200/90" />
                                  <span>Missing Patch</span>
                                </div>
                              )}
                            </div>
                            <div className="mt-0.5 text-xs text-amber-900/60 dark:text-amber-200/60 group-hover:underline">/{h.slug}</div>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-3 flex flex-col">
                        {h.creator_full_name && <div className="text-xs text-amber-900/70 dark:text-amber-200/70">{h.creator_full_name}</div>}
                        <div className="text-amber-900/90 dark:text-amber-200/90">{creator}</div>
                      </div>
                      <div className="col-span-4 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="text-amber-900/90 dark:text-amber-200/90 flex-1">{createdDate}</div>
                          <FiExternalLink className="h-4 w-4 text-amber-900/90 dark:text-amber-200/90 flex-shrink-0" />
                        </div>
                      </div>
                    </div>
                    {/* Mobile card */}
                    <div className="lg:hidden flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-start min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-medium wrap-break-word">{h.title}</div>
                            {hasMissingPatch && (
                              <div className="inline-flex items-center gap-1 rounded-full bg-amber-600/20 dark:bg-amber-600/40 px-2 py-0.5 text-xs font-medium text-amber-900/90 dark:text-amber-200/90">
                                <FiAlertTriangle className="h-3 w-3 text-amber-900/90 dark:text-amber-200/90" />
                                <span>Missing Patch</span>
                              </div>
                            )}
                          </div>
                          <div className="mt-0.5 text-xs text-foreground/60 break-all">/{h.slug}</div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-amber-900/90 dark:text-amber-200/90 mt-2">
                            <span>{creator}</span>
                            <span>•</span>
                            <span>{createdDate}</span>
                          </div>
                        </div>
                        <FiExternalLink className="h-4 w-4 text-foreground/80 flex-shrink-0" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {isAdmin && <ArchiverManagement />}

      {canAccessArchives && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">Archive Management</h2>
            <Link
              href="/dashboard/archives"
              className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
            >
              View all archives
            </Link>
          </div>
          <p className="text-sm text-foreground/60">
            Archive hacks are informational entries preserved for historical reference. They do not include patch files.
          </p>
        </div>
      )}
    </div>
  );
}


