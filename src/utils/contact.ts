export const contactTopicLabels = {
  general: "General question",
  bug: "Bug report",
  account: "Account issue",
  creator: "Creator support",
  security: "Security disclosure",
  other: "Other",
} as const;

export type ContactTopic = keyof typeof contactTopicLabels;

export type ContactPayload = {
  topic: ContactTopic;
  name: string;
  email: string;
  contextUrl: string;
  message: string;
};

export function isContactTopic(value: string): value is ContactTopic {
  return value in contactTopicLabels;
}

export function generateContactTicketId(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `HDX-${rand}`;
}

export function contactThreadTitle(payload: ContactPayload, ticketId: string): string {
  const from = payload.name ? ` from ${payload.name}` : "";
  return `[#${ticketId}] ${contactTopicLabels[payload.topic]}${from}`.slice(0, 100);
}

export function contactPayloadEquals(a: ContactPayload, b: ContactPayload): boolean {
  return (
    a.topic === b.topic
    && a.name === b.name
    && a.email === b.email
    && a.contextUrl === b.contextUrl
    && a.message === b.message
  );
}
