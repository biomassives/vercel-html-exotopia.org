export type MessageType = 'bug' | 'support' | 'partnership' | 'press' | 'general'

export const MESSAGE_TYPES: MessageType[] = ['bug', 'support', 'partnership', 'press', 'general']

interface Template {
  urgent: boolean
  autoReplySubject: string
  autoReplyBody: (name: string) => string
}

const ROUTED_TO: Record<MessageType, string> = {
  bug: 'our engineering queue',
  support: 'our support queue',
  partnership: 'our partnerships review',
  press: 'our press contact',
  general: 'the right person on the team',
}

export const TEMPLATES: Record<MessageType, Template> = {
  bug: {
    urgent: true,
    autoReplySubject: 'Bug report received — Exotopia',
    autoReplyBody: (name) =>
      `Hi ${name},\n\n` +
      `Thanks for the report — we've logged it and routed it to ${ROUTED_TO.bug}. ` +
      `If you can add more detail (steps to reproduce, a screenshot, what you expected instead), ` +
      `just reply to this email — it reaches a real inbox, not a bot.\n\n— Exotopia`,
  },
  support: {
    urgent: false,
    autoReplySubject: "We've got your message — Exotopia",
    autoReplyBody: (name) =>
      `Hi ${name},\n\n` +
      `Thanks for reaching out — your message has been routed to ${ROUTED_TO.support}. ` +
      `We aim to get back to real questions within a couple of business days. ` +
      `Reply to this email any time to add context.\n\n— Exotopia`,
  },
  partnership: {
    urgent: false,
    autoReplySubject: 'Thanks for reaching out — Exotopia',
    autoReplyBody: (name) =>
      `Hi ${name},\n\n` +
      `Thanks for the note — it's been routed to ${ROUTED_TO.partnership}. ` +
      `We review these regularly and will follow up if it's a fit. ` +
      `Reply to this email if you'd like to add more.\n\n— Exotopia`,
  },
  press: {
    urgent: false,
    autoReplySubject: 'Thanks for reaching out — Exotopia',
    autoReplyBody: (name) =>
      `Hi ${name},\n\n` +
      `Thanks for the note — it's been routed to ${ROUTED_TO.press}. ` +
      `We'll follow up as soon as we can. Reply to this email any time.\n\n— Exotopia`,
  },
  general: {
    urgent: false,
    autoReplySubject: "We've got your message — Exotopia",
    autoReplyBody: (name) =>
      `Hi ${name},\n\n` +
      `Thanks for reaching out — your message has been received and routed to ${ROUTED_TO.general}. ` +
      `Reply to this email any time to add context.\n\n— Exotopia`,
  },
}

export function adminAlertSubject(type: MessageType): string {
  return `[urgent:${type}] New support message`
}

export function adminAlertBody(type: MessageType, name: string, email: string, subject: string | null, body: string): string {
  return (
    `New ${type} message from ${name} <${email}>\n\n` +
    `Subject: ${subject ?? '(none)'}\n\n` +
    `${body}\n\n` +
    `— sent because this message type is flagged urgent`
  )
}
