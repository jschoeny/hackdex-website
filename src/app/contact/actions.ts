"use server";

import { submitContactTicket } from "@/utils/contact-threads";
import { isContactTopic, type ContactTopic } from "@/utils/contact";
import { createClient } from "@/utils/supabase/server";

export interface ContactActionState {
  error: string | null;
  success?: string | null;
  retryToken?: string | null;
}

export async function sendContact(
  prev: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  try {
    const topic = (formData.get("topic") as string | null)?.toLowerCase() ?? "";
    const name = (formData.get("name") as string | null) || "";
    const email = (formData.get("email") as string | null) || "";
    const contextUrl = (formData.get("contextUrl") as string | null) || "";
    const message = (formData.get("message") as string | null) || "";
    const retryToken = (formData.get("retryToken") as string | null) || prev.retryToken || null;

    if (!isContactTopic(topic)) {
      return { error: "Please select a valid topic." };
    }

    if (!email) {
      return { error: "Email is required." };
    }

    if (!message) {
      return { error: "Message is required." };
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
        topic: topic as ContactTopic,
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
