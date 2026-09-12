import Link from "next/link";
import { Suspense } from "react";
import ContactForm from "@/components/Contact/ContactForm";
import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Contact",
  alternates: {
    canonical: "/contact",
  },
};

export default async function ContactPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let defaultName = "";
  const defaultEmail = user?.email ?? "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, username")
      .eq("id", user.id)
      .maybeSingle();
    defaultName = profile?.full_name || profile?.username || "";
  }

  return (
    <div className="mx-auto my-auto max-w-2xl w-full px-6 py-10">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Contact Hackdex</h1>
        <p className="mt-1 text-sm text-foreground/70">
          Have a question, feedback, or need help? Use this form to reach out to us.
        </p>
        <p className="mt-1 text-sm text-foreground/60">
          You&apos;ll get a confirmation email you can reply to.
        </p>
        <p className="mt-1 text-sm text-foreground/60">
          For intellectual property concerns (DMCA), please see our <Link className="text-[var(--accent)] hover:underline" href="/terms" prefetch={false}>Terms of Service</Link>.
        </p>
        <div className="mt-6">
          <Suspense fallback={<div>Loading...</div>}>
            <ContactForm defaultName={defaultName} defaultEmail={defaultEmail} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
