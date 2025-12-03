"use server";

import { createClient } from "@/utils/supabase/server";

export async function getArchivers() {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return { ok: false, error: "Unauthorized" } as const;
  }

  // Get all profiles
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username")
    .order("username", { ascending: true });

  if (profilesError) {
    return { ok: false, error: profilesError.message } as const;
  }

  // Check each profile for archiver claim
  const archivers: { id: string; username: string | null }[] = [];
  for (const profile of profiles || []) {
    const { data: claim } = await supabase.rpc("get_claim", {
      uid: profile.id,
      claim: "archiver",
    });
    if (claim && typeof claim === "object" && "error" in claim) continue;
    if (claim === true || (typeof claim === "object" && claim !== null && !("error" in claim))) {
      archivers.push({ id: profile.id, username: profile.username });
    }
  }

  return { ok: true, archivers } as const;
}

export async function searchUsersForArchiver(query: string) {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return { ok: false, error: "Unauthorized" } as const;
  }

  const trimmed = query.trim();
  if (!trimmed) {
    return { ok: true, users: [] } as const;
  }

  // If the query looks like a UUID, search by exact ID; otherwise search by username (ilike)
  const looksLikeUuid =
    trimmed.length === 36 &&
    /^[0-9a-fA-F-]+$/.test(trimmed);

  let q = supabase
    .from("profiles")
    .select("id, username")
    .limit(10);

  if (looksLikeUuid) {
    q = q.eq("id", trimmed);
  } else {
    q = q.ilike("username", `%${trimmed}%`);
  }

  const { data: profiles, error: profilesError } = await q;

  if (profilesError) {
    return { ok: false, error: profilesError.message } as const;
  }

  return {
    ok: true,
    users: (profiles || []).map((p) => ({ id: p.id, username: p.username })),
  } as const;
}

export async function addArchiverRole(userId: string) {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return { ok: false, error: "Unauthorized" } as const;
  }

  const { data, error: rpcError } = await supabase.rpc("set_claim", {
    uid: userId,
    claim: "archiver",
    value: true,
  });

  if (rpcError) {
    return { ok: false, error: rpcError.message } as const;
  }
  if (data !== "OK") {
    return { ok: false, error: data || "Failed to add archiver" } as const;
  }

  return { ok: true } as const;
}

export async function removeArchiverRole(userId: string) {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return { ok: false, error: "Unauthorized" } as const;
  }

  const { data, error: rpcError } = await supabase.rpc("delete_claim", {
    uid: userId,
    claim: "archiver",
  });

  if (rpcError) {
    return { ok: false, error: rpcError.message } as const;
  }
  if (data !== "OK") {
    return { ok: false, error: data || "Failed to remove archiver" } as const;
  }

  return { ok: true } as const;
}
