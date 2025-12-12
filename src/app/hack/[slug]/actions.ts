"use server";

import { createClient } from "@/utils/supabase/server";
import { getMinioClient, PATCHES_BUCKET } from "@/utils/minio/server";
import { isInformationalArchiveHack } from "@/utils/hack";
import { sendDiscordMessageEmbed } from "@/utils/discord";
import { headers } from "next/headers";
import { validateEmail } from "@/utils/auth";

export async function getSignedPatchUrl(slug: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const supabase = await createClient();

  // Get user for permission check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch hack to validate it exists
  const { data: hack, error: hackError } = await supabase
    .from("hacks")
    .select("slug, approved, created_by, current_patch, original_author")
    .eq("slug", slug)
    .maybeSingle();

  if (hackError || !hack) {
    return { ok: false, error: "Hack not found" };
  }

  // Check if hack is approved or user has permission (owner or admin)
  const canEdit = !!user && user.id === (hack.created_by as string);
  let isAdmin = false;

  if (!hack.approved && !canEdit) {
    const { data: admin } = await supabase.rpc("is_admin");
    isAdmin = !!admin;
    if (!isAdmin) {
      return { ok: false, error: "Hack not found" };
    }
  }

  // Check if this is an Informational Archive hack (no patch available)
  if (isInformationalArchiveHack(hack)) {
    return { ok: false, error: "Archive hacks do not have patch files available" };
  }

  // Check if patch exists
  if (hack.current_patch == null) {
    return { ok: false, error: "No patch available" };
  }

  // Fetch patch info
  const { data: patch, error: patchError } = await supabase
    .from("patches")
    .select("id, bucket, filename")
    .eq("id", hack.current_patch as number)
    .maybeSingle();

  if (patchError || !patch) {
    return { ok: false, error: "Patch not found" };
  }

  // Sign the URL server-side
  try {
    const client = getMinioClient();
    const bucket = patch.bucket || PATCHES_BUCKET;
    const signedUrl = await client.presignedGetObject(bucket, patch.filename, 60 * 5);
    return { ok: true, url: signedUrl };
  } catch (error) {
    console.error("Error signing patch URL:", error);
    return { ok: false, error: "Failed to generate download URL" };
  }
}

export async function updatePatchDownloadCount(patchId: number, deviceId: string): Promise<{ ok: true; didIncrease: boolean } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { error: updateError } = await supabase
    .from("patch_downloads")
    .insert({ patch: patchId, device_id: deviceId });
  if (updateError) {
    if ('code' in updateError && (updateError.code === '23505' || /duplicate|unique/i.test(updateError.message))) {
      return { ok: true, didIncrease: false };
    }
    return { ok: false, error: updateError.message };
  }
  return { ok: true, didIncrease: true };
}

export async function submitHackReport(data: {
  slug: string;
  reportType: "hateful" | "harassment" | "misleading" | "stolen";
  details: string | null;
  email: string | null;
  isImpersonating: boolean | null;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();

  // Validate hack exists
  const { data: hack, error: hackError } = await supabase
    .from("hacks")
    .select("slug, title")
    .eq("slug", data.slug)
    .maybeSingle();

  if (hackError || !hack) {
    return { error: "Hack not found" };
  }

  // Validate email if provided (for stolen reports)
  if (data.reportType === "stolen" && data.email) {
    const emailLower = data.email.trim().toLowerCase();
    const { error: emailError } = validateEmail(emailLower);
    if (emailError) {
      return { error: emailError };
    }
  }

  // Validate required fields
  if (data.reportType === "misleading" && !data.details?.trim()) {
    return { error: "Details are required for misleading reports" };
  }

  if (data.reportType === "stolen") {
    if (!data.email?.trim()) {
      return { error: "Email is required for stolen hack reports" };
    }
    if (!data.details?.trim()) {
      return { error: "Details are required for stolen hack reports" };
    }
  }

  // Build hack URL
  const hdrs = await headers();
  const siteBase = process.env.NEXT_PUBLIC_SITE_URL ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "") : "";
  const proto = siteBase ? "" : (hdrs.get("x-forwarded-proto") || "https");
  const host = siteBase ? "" : (hdrs.get("host") || "");
  const baseUrl = siteBase || (proto && host ? `${proto}://${host}` : "");
  const hackUrl = baseUrl ? `${baseUrl}/hack/${data.slug}` : `/hack/${data.slug}`;

  // Format report type for display
  const reportTypeLabels: Record<typeof data.reportType, string> = {
    hateful: "Hateful Content",
    harassment: "Harassment",
    misleading: "Misleading",
    stolen: "My Hack Was Stolen",
  };

  // Build Discord embed fields
  const fields: Array<{ name: string; value: string; inline?: boolean }> = [
    {
      name: "Report Type",
      value: reportTypeLabels[data.reportType],
      inline: false,
    },
    {
      name: "Hack",
      value: `[${hack.title}](${hackUrl})`,
      inline: false,
    },
  ];

  if (data.details) {
    fields.push({
      name: "Details",
      value: data.details.length > 1000 ? data.details.substring(0, 1000) + "..." : data.details,
      inline: false,
    });
  }

  if (data.reportType === "stolen") {
    if (data.email) {
      fields.push({
        name: "Contact Email",
        value: data.email.trim().toLowerCase(),
        inline: false,
      });
    }
    if (data.isImpersonating !== null) {
      fields.push({
        name: "Is Uploader Impersonating?",
        value: data.isImpersonating ? "Yes" : "No",
        inline: true,
      });
    }
  }

  // Send Discord webhook
  if (process.env.DISCORD_WEBHOOK_ADMIN_URL) {
    try {
      await sendDiscordMessageEmbed(process.env.DISCORD_WEBHOOK_ADMIN_URL, [
        {
          title: "Hack Report",
          description: `A new report has been submitted for [${hack.title}](${hackUrl})`,
          color: 0xff6b6b, // Red color for reports
          fields,
          footer: {
            text: `Hack Slug: ${data.slug}`,
          },
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error("Error sending Discord webhook:", error);
      return { error: "Failed to submit report. Please try again later." };
    }
  }

  return { error: null };
}

