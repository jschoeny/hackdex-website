import { randomBytes } from "node:crypto";

import type { APIEmbed } from "discord-api-types/v10";
import { Resend } from "resend";

import { renderEmail } from "@/emails/render";
import type { Tables } from "@/types/db";
import {
  contactPayloadEquals,
  contactThreadTitle,
  contactTopicLabels,
  generateContactTicketId,
  type ContactPayload,
  type ContactTopic,
} from "@/utils/contact";
import {
  contactForumTagId,
  createDiscordContactThread,
  getDiscordThread,
  postDiscordThreadMessage,
  updateDiscordThread,
} from "@/utils/discord-rest";
import { sendDiscordMessageEmbed } from "@/utils/discord";
import { createServiceClient } from "@/utils/supabase/server";

export type ContactThread = Tables<"contact_threads">;

const GENERIC_SEND_ERROR = "Something went wrong. Please try again.";

function payloadFromRow(row: ContactThread): ContactPayload {
  return {
    topic: row.topic as ContactTopic,
    name: row.name ?? "",
    email: row.email,
    contextUrl: row.context_url ?? "",
    message: row.message,
  };
}

/** Discord rejects embed field values longer than 1024 characters. */
function embedField(name: string, value: string, inline = true) {
  return { name, value: value.slice(0, 1024), inline };
}

export function contactSubmissionEmbed(
  payload: ContactPayload,
  ticketId: string,
  opts?: { username?: string | null; updated?: boolean },
): APIEmbed {
  return {
    title: opts?.updated
      ? `Updated submission · ${contactTopicLabels[payload.topic]}`
      : `📧 ${contactTopicLabels[payload.topic]}`,
    description: payload.message.length > 4096
      ? `${payload.message.slice(0, 4093)}...`
      : payload.message,
    color: payload.topic === "security" ? 0xff0000 : payload.topic === "bug" ? 0xffa500 : 0x3498db,
    fields: [
      ...(payload.name ? [embedField("Name", payload.name)] : []),
      embedField("Email", payload.email),
      ...(opts?.username ? [embedField("Logged in as", `@${opts.username}`)] : []),
      ...(payload.contextUrl
        ? [embedField("Related URL", payload.contextUrl, false)]
        : []),
    ],
    footer: { text: `Ticket #${ticketId}` },
    timestamp: new Date().toISOString(),
  };
}

async function notifyContactCreateFailure(ticketId: string, payload: ContactPayload): Promise<void> {
  const webhook = process.env.DISCORD_WEBHOOK_ADMIN_REPORTS_URL;
  if (!webhook) return;
  try {
    await sendDiscordMessageEmbed(webhook, [contactSubmissionEmbed(payload, ticketId)]);
  } catch (error) {
    console.error(`[Contact] Failed to report ticket ${ticketId} to the admin webhook:`, error);
  }
}

/** Reply tokens are `randomBytes(24).toString("hex")`; anything else cannot match a real row. */
const REPLY_TOKEN_PATTERN = /^[a-f0-9]{48}$/i;

export async function getContactThreadByReplyToken(
  replyToken: string,
): Promise<ContactThread | null> {
  if (!REPLY_TOKEN_PATTERN.test(replyToken)) return null;
  const serviceClient = await createServiceClient();
  const { data, error } = await serviceClient
    .from("contact_threads")
    .select("*")
    .eq("reply_token", replyToken.toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getContactThreadByTicketId(
  ticketId: string,
): Promise<ContactThread | null> {
  const serviceClient = await createServiceClient();
  const { data, error } = await serviceClient
    .from("contact_threads")
    .select("*")
    .eq("ticket_id", ticketId.trim().toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getContactThreadByDiscordThreadId(
  discordThreadId: string,
): Promise<ContactThread | null> {
  const serviceClient = await createServiceClient();
  const { data, error } = await serviceClient
    .from("contact_threads")
    .select("*")
    .eq("discord_thread_id", discordThreadId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getContactThreadByMessageIds(
  messageIds: string[],
): Promise<ContactThread | null> {
  if (messageIds.length === 0) return null;
  const serviceClient = await createServiceClient();
  const { data, error } = await serviceClient
    .from("contact_threads")
    .select("*")
    .in("resend_last_message_id", messageIds)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function insertContactThread(args: {
  payload: ContactPayload;
  userId: string | null;
}): Promise<ContactThread> {
  const serviceClient = await createServiceClient();
  for (let attempt = 0; attempt < 5; attempt++) {
    const ticketId = generateContactTicketId();
    const { data, error } = await serviceClient
      .from("contact_threads")
      .insert({
        ticket_id: ticketId,
        topic: args.payload.topic,
        name: args.payload.name || null,
        email: args.payload.email,
        context_url: args.payload.contextUrl || null,
        message: args.payload.message,
        user_id: args.userId,
        reply_token: randomBytes(24).toString("hex"),
      })
      .select("*")
      .single();
    if (!error && data) return data;
    if (error?.code !== "23505") throw error;
  }
  throw new Error("Could not allocate a ticket ID.");
}

async function savePayload(ticketId: string, payload: ContactPayload): Promise<void> {
  const serviceClient = await createServiceClient();
  const { error } = await serviceClient
    .from("contact_threads")
    .update({
      topic: payload.topic,
      name: payload.name || null,
      email: payload.email,
      context_url: payload.contextUrl || null,
      message: payload.message,
    })
    .eq("ticket_id", ticketId);
  if (error) throw error;
}

async function saveDiscordIds(
  ticketId: string,
  discordThreadId: string,
  parentId: string,
): Promise<void> {
  const serviceClient = await createServiceClient();
  const { error } = await serviceClient
    .from("contact_threads")
    .update({
      discord_thread_id: discordThreadId,
      discord_parent_channel_id: parentId,
    })
    .eq("ticket_id", ticketId);
  if (error) throw error;
}

/** Resolves the submitter's profile name so recreated threads keep their "Logged in as" field. */
async function submitterUsername(thread: ContactThread): Promise<string | null> {
  if (!thread.user_id) return null;
  const serviceClient = await createServiceClient();
  const { data, error } = await serviceClient
    .from("profiles")
    .select("username")
    .eq("id", thread.user_id)
    .maybeSingle();
  if (error) {
    console.warn("[Contact] Failed to load the submitter profile:", error);
    return null;
  }
  return data?.username ?? null;
}

export async function deliverInboundContactMessage(
  thread: ContactThread,
  message: { content?: string; embeds?: APIEmbed[] },
): Promise<"posted" | "failed"> {
  const payload = payloadFromRow(thread);
  const username = await submitterUsername(thread);
  // The inbound webhook returns 500 on failure so Resend retries; skip the admin report per attempt.
  const ready = await ensureContactDiscordThread(thread, payload, username, { reportFailure: false });
  const posted = await postContactThreadMessage(ready.thread, message);
  return posted === "posted" ? "posted" : "failed";
}

export async function postContactThreadMessage(
  thread: ContactThread,
  message: { content?: string; embeds?: APIEmbed[] },
): Promise<"posted" | "failed" | "no-thread"> {
  if (!thread.discord_thread_id) return "no-thread";
  try {
    const posted = await postDiscordThreadMessage(thread.discord_thread_id, message);
    return posted ? "posted" : "failed";
  } catch (error) {
    console.error(
      `[Contact] Failed to post to Discord thread ${thread.discord_thread_id}:`,
      error,
    );
    return "failed";
  }
}

/**
 * Makes sure the ticket has a live Discord thread, creating one when it is missing.
 * Discord problems never throw: they are logged, reported to the admin webhook, and the
 * row comes back unchanged so the caller can still confirm the ticket by email.
 * `reused` is true when an existing thread was found, meaning the caller should sync edits onto it.
 * Pass `reportFailure: false` from paths that retry on failure so the admin webhook is not spammed.
 */
export async function ensureContactDiscordThread(
  thread: ContactThread,
  payload: ContactPayload,
  username?: string | null,
  opts?: { reportFailure?: boolean },
): Promise<{ thread: ContactThread; reused: boolean }> {
  try {
    if (thread.discord_thread_id && await getDiscordThread(thread.discord_thread_id)) {
      return { thread, reused: true };
    }

    const created = await createDiscordContactThread({
      name: contactThreadTitle(payload, thread.ticket_id),
      topic: payload.topic,
      embeds: [contactSubmissionEmbed(payload, thread.ticket_id, { username })],
    });
    if (created) {
      const parentId = created.parent_id ?? process.env.DISCORD_CONTACT_FORUM_CHANNEL_ID ?? "";
      await saveDiscordIds(thread.ticket_id, created.id, parentId);
      return {
        thread: {
          ...thread,
          discord_thread_id: created.id,
          discord_parent_channel_id: parentId,
        },
        reused: false,
      };
    }
  } catch (error) {
    console.error(
      `[Contact] Failed to set up the Discord thread for ticket ${thread.ticket_id}:`,
      error,
    );
  }

  if (opts?.reportFailure !== false) {
    await notifyContactCreateFailure(thread.ticket_id, payload);
  }
  return { thread, reused: false };
}

/** Every tag id the contact forum uses for a topic, so a topic swap only clears its own tag. */
function contactTopicTagIds(): string[] {
  return Object.keys(contactTopicLabels)
    .map((topic) => contactForumTagId(topic))
    .filter((id): id is string => Boolean(id));
}

/**
 * Mirrors an edited submission onto its existing thread: rename, swap the topic tag while keeping
 * tags admins added by hand, and post the updated embed. Renames are rate limited to two per ten
 * minutes, so a failed update is logged and the embed still goes out.
 */
async function syncExistingDiscordThread(
  thread: ContactThread,
  payload: ContactPayload,
  previous: ContactPayload,
  username?: string | null,
): Promise<void> {
  if (!thread.discord_thread_id || contactPayloadEquals(previous, payload)) return;

  try {
    const topicTagId = contactForumTagId(payload.topic);
    let appliedTags: string[] | undefined;
    if (topicTagId) {
      const existing = await getDiscordThread(thread.discord_thread_id);
      const tags = new Set(existing?.applied_tags ?? []);
      for (const id of contactTopicTagIds()) tags.delete(id);
      tags.add(topicTagId);
      appliedTags = Array.from(tags);
    }
    await updateDiscordThread(thread.discord_thread_id, {
      name: contactThreadTitle(payload, thread.ticket_id),
      ...(appliedTags ? { applied_tags: appliedTags } : {}),
    });
  } catch (error) {
    console.error(
      `[Contact] Failed to update Discord thread ${thread.discord_thread_id}:`,
      error,
    );
  }

  await postContactThreadMessage(thread, {
    embeds: [contactSubmissionEmbed(payload, thread.ticket_id, { username, updated: true })],
  });
}

async function persistResendMeta(
  ticketId: string,
  emailId: string,
  messageId: string | null,
): Promise<void> {
  const serviceClient = await createServiceClient();
  const { error } = await serviceClient
    .from("contact_threads")
    .update({
      resend_last_email_id: emailId,
      resend_last_message_id: messageId,
    })
    .eq("ticket_id", ticketId);
  if (error) {
    console.error("[Contact] Failed to persist Resend message metadata:", error);
  }
}

export async function sendContactConfirmation(
  thread: ContactThread,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (thread.resend_last_email_id) return { ok: true };

  const apiKey = process.env.RESEND_API_KEY;
  const inboundDomain = process.env.RESEND_INBOUND_DOMAIN;
  if (!apiKey || !inboundDomain) {
    return { ok: false, error: GENERIC_SEND_ERROR };
  }

  const resend = new Resend(apiKey);
  const html = await renderEmail("contact-confirmation", {
    ticketId: thread.ticket_id,
    topicLabel: contactTopicLabels[thread.topic as ContactTopic],
  });
  const { data: sent, error: sendError } = await resend.emails.send({
    from: process.env.RESEND_CONTACT_FROM ?? `contact@${inboundDomain}`,
    to: thread.email,
    replyTo: `contact+${thread.reply_token}@${inboundDomain}`,
    subject: `[#${thread.ticket_id}] Support request confirmation`,
    html,
    text: `We received your message (ticket #${thread.ticket_id}). Reply to this email to continue the conversation with the Hackdex team.`,
  });
  if (sendError || !sent) {
    console.error("[Contact] Resend failed to send confirmation:", sendError);
    return { ok: false, error: GENERIC_SEND_ERROR };
  }

  const { data: sentEmail, error: getError } = await resend.emails.get(sent.id);
  if (getError) {
    console.warn("[Contact] Could not fetch the sent email Message-ID:", getError);
  }
  await persistResendMeta(thread.ticket_id, sent.id, sentEmail?.message_id ?? null);
  return { ok: true };
}

export async function emailContactSubmitter(args: {
  ticketId: string;
  message: string;
  adminName: string;
}): Promise<
  | { ok: true; email: string; subject: string }
  | { ok: false; error: string }
> {
  const apiKey = process.env.RESEND_API_KEY;
  const inboundDomain = process.env.RESEND_INBOUND_DOMAIN;
  if (!apiKey || !inboundDomain) {
    return { ok: false, error: "Contact email is not configured." };
  }

  const thread = await getContactThreadByTicketId(args.ticketId);
  if (!thread) return { ok: false, error: "Contact ticket was not found." };

  const resend = new Resend(apiKey);
  const previousMessageId = thread.resend_last_message_id;
  const subject = `${previousMessageId ? "Re: " : ""}[#${thread.ticket_id}] ${contactTopicLabels[thread.topic as ContactTopic]}`;
  const html = await renderEmail("contact-reply", {
    ticketId: thread.ticket_id,
    message: args.message,
    adminName: args.adminName,
  });
  const { data: sent, error: sendError } = await resend.emails.send({
    from: process.env.RESEND_CONTACT_FROM ?? `contact@${inboundDomain}`,
    to: thread.email,
    replyTo: `contact+${thread.reply_token}@${inboundDomain}`,
    subject,
    html,
    text: `${args.adminName} wrote about ticket #${thread.ticket_id}:\n\n${args.message}\n\nReply to this email to respond to the Hackdex team.`,
    headers: previousMessageId
      ? { "In-Reply-To": previousMessageId, References: previousMessageId }
      : undefined,
  });
  if (sendError || !sent) {
    console.error("[Contact] Resend failed to send reply:", sendError);
    return { ok: false, error: "Failed to send the contact email." };
  }

  const { data: sentEmail, error: getError } = await resend.emails.get(sent.id);
  if (getError) {
    console.warn("[Contact] Could not fetch the sent email Message-ID:", getError);
  }
  await persistResendMeta(
    thread.ticket_id,
    sent.id,
    sentEmail?.message_id ?? previousMessageId,
  );
  return { ok: true, email: thread.email, subject };
}

export async function submitContactTicket(args: {
  payload: ContactPayload;
  retryToken?: string | null;
  userId: string | null;
  username?: string | null;
}): Promise<
  | { ok: true; ticketId: string }
  | { ok: false; error: string; retryToken: string }
> {
  let thread: ContactThread | undefined;
  try {
    let previous = args.payload;

    if (args.retryToken) {
      const existing = await getContactThreadByReplyToken(args.retryToken);
      if (existing) {
        previous = payloadFromRow(existing);
        await savePayload(existing.ticket_id, args.payload);
        thread = {
          ...existing,
          topic: args.payload.topic,
          name: args.payload.name || null,
          email: args.payload.email,
          context_url: args.payload.contextUrl || null,
          message: args.payload.message,
        };
      }
    }
    thread ??= await insertContactThread({ payload: args.payload, userId: args.userId });

    const ensured = await ensureContactDiscordThread(thread, args.payload, args.username);
    thread = ensured.thread;
    if (ensured.reused) {
      await syncExistingDiscordThread(thread, args.payload, previous, args.username);
    }

    const emailed = await sendContactConfirmation(thread);
    if (!emailed.ok) {
      return { ok: false, error: emailed.error, retryToken: thread.reply_token };
    }
    return { ok: true, ticketId: thread.ticket_id };
  } catch (error) {
    console.error("[Contact] Failed to submit contact ticket:", error);
    if (thread) {
      return { ok: false, error: GENERIC_SEND_ERROR, retryToken: thread.reply_token };
    }
    throw error;
  }
}

export async function recoverContactDiscordThread(
  ticketId: string,
): Promise<
  | { ok: true; threadId: string; created: boolean }
  | { ok: false; error: string }
> {
  const thread = await getContactThreadByTicketId(ticketId);
  if (!thread) return { ok: false, error: "No contact ticket with that ID." };

  if (thread.discord_thread_id) {
    const existing = await getDiscordThread(thread.discord_thread_id);
    if (existing) {
      return { ok: true, threadId: existing.id, created: false };
    }
  }

  const username = await submitterUsername(thread);
  const { thread: updated } = await ensureContactDiscordThread(
    thread,
    payloadFromRow(thread),
    username,
  );
  if (!updated.discord_thread_id || updated.discord_thread_id === thread.discord_thread_id) {
    return { ok: false, error: "Failed to create the Discord thread." };
  }
  return { ok: true, threadId: updated.discord_thread_id, created: true };
}
