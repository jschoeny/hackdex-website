"use server";

import { createClient } from "@/utils/supabase/server";

export async function getArchives(args: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "title" | "created_at" | "original_author";
  sortOrder?: "asc" | "desc";
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" } as const;
  }

  // Check if user is archiver (or admin)
  const { data: isArchiver } = await supabase.rpc("is_archiver");
  if (!isArchiver) {
    return { ok: false, error: "Forbidden" } as const;
  }

  const page = args.page || 1;
  const limit = args.limit || 50;
  const offset = (page - 1) * limit;
  const search = args.search?.trim() || "";
  const sortBy = args.sortBy || "created_at";
  const sortOrder = args.sortOrder || "desc";

  let query = supabase
    .from("hacks")
    .select("slug,title,original_author,base_rom,created_at,created_by,approved", { count: "exact" })
    .not("original_author", "is", null)
    .is("current_patch", null)
    .order(sortBy, { ascending: sortOrder === "asc" })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`title.ilike.%${search}%,original_author.ilike.%${search}%,base_rom.ilike.%${search}%`);
  }

  const { data: hacks, error, count } = await query;

  if (error) {
    return { ok: false, error: error.message } as const;
  }

  // Fetch creator usernames
  const creatorIds = [...new Set((hacks || []).map((h) => h.created_by as string))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id,username")
    .in("id", creatorIds);

  const usernameById = new Map<string, string | null>();
  (profiles || []).forEach((p) => usernameById.set(p.id, p.username));

  const archives = (hacks || []).map((h) => ({
    slug: h.slug,
    title: h.title,
    original_author: h.original_author,
    base_rom: h.base_rom,
    created_at: h.created_at,
    created_by: h.created_by,
    creator_username: usernameById.get(h.created_by as string) || null,
    approved: h.approved,
  }));

  return {
    ok: true,
    archives,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  } as const;
}

export async function deleteArchive(slug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Unauthorized" } as const;
  }

  // Only admins can delete archives
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return { ok: false, error: "Forbidden" } as const;
  }

  // Verify it's an Archive hack
  const { data: hack } = await supabase
    .from("hacks")
    .select("slug, original_author, current_patch")
    .eq("slug", slug)
    .maybeSingle();

  if (!hack) {
    return { ok: false, error: "Archive not found" } as const;
  }

  if (hack.original_author == null || hack.current_patch != null) {
    return { ok: false, error: "This is not an Archive hack" } as const;
  }

  // Delete the hack (cascade will handle covers and tags)
  const { error: deleteError } = await supabase.from("hacks").delete().eq("slug", slug);

  if (deleteError) {
    return { ok: false, error: deleteError.message } as const;
  }

  return { ok: true } as const;
}
