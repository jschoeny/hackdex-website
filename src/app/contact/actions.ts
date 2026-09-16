"use server";

import { submitContactTicket } from "@/utils/contact-threads";
import { isContactTopic } from "@/utils/contact";
import { validateEmail } from "@/utils/auth";
import { createClient } from "@/utils/supabase/server";

export interface ContactActionState {
  error: string | null;
  success?: string | null;
  retryToken?: string | null;
}

/**
 * Field caps that keep a submission inside Discord's limits (1024 per embed
 * field, 100 per thread name) and Resend's recipient limits. ContactForm
 * mirrors these as `maxLength` attributes.
 */
const FIELD_LIMITS = {
  name: 100,
  email: 254,
  contextUrl: 1024,
  message: 4000,
} as const;

// Reply tokens are 24 random bytes rendered as hex by contact-threads.
const RETRY_TOKEN_PATTERN = /^[a-f0-9]{48}$/i;

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function sendContact(
  prev: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  try {
    const topic = (formData.get("topic") as string | null)?.trim().toLowerCase() ?? "";
    const name = ((formData.get("name") as string | null) || "").trim();
    const email = ((formData.get("email") as string | null) || "").trim().toLowerCase();
    const contextUrl = ((formData.get("contextUrl") as string | null) || "").trim();
    const message = ((formData.get("message") as string | null) || "").trim();
    const submittedToken = (formData.get("retryToken") as string | null) || prev.retryToken || null;
    const retryToken = submittedToken && RETRY_TOKEN_PATTERN.test(submittedToken)
      ? submittedToken
      : null;

    if (!isContactTopic(topic)) {
      return { error: "Please select a valid topic." };
    }

    if (name.length > FIELD_LIMITS.name) {
      return { error: `Name must be ${FIELD_LIMITS.name} characters or fewer.`, retryToken };
    }

    if (!email) {
      return { error: "Email is required.", retryToken };
    }

    if (email.length > FIELD_LIMITS.email) {
      return { error: `Email must be ${FIELD_LIMITS.email} characters or fewer.`, retryToken };
    }

    const { error: emailError } = validateEmail(email);
    if (emailError) {
      return { error: emailError, retryToken };
    }

    if (contextUrl.length > FIELD_LIMITS.contextUrl) {
      return {
        error: `Related URL must be ${FIELD_LIMITS.contextUrl} characters or fewer.`,
        retryToken,
      };
    }

    if (contextUrl && !isHttpUrl(contextUrl)) {
      return { error: "Related URL must be a valid link.", retryToken };
    }

    if (!message) {
      return { error: "Message is required.", retryToken };
    }

    if (message.length > FIELD_LIMITS.message) {
      return { error: `Message must be ${FIELD_LIMITS.message} characters or fewer.`, retryToken };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    let username: string | null = null;
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();
      username = profile?.username ?? null;
    }

    const result = await submitContactTicket({
      payload: {
        topic,
        name,
        email,
        contextUrl,
        message,
      },
      retryToken,
      userId: user?.id ?? null,
      username,
    });

    if (!result.ok) {
      return { error: result.error, retryToken: result.retryToken };
    }

    return { error: null, success: `Your message was sent. Ticket #${result.ticketId}.` };
  } catch {
    return { error: "Something went wrong. Please try again.", retryToken: prev.retryToken };
  }
}
