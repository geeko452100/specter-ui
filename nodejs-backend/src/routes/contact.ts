import { Hono } from "hono";

type Bindings = {
  RESEND_API_KEY: string;
  CONTACT_TO_ADDRESS: string;
  CONTACT_FROM_ADDRESS: string;
};

const MAX_FIELD_LENGTH = 5000;

interface ContactBody {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  // Honeypot field: real visitors never fill this in (it's hidden via CSS),
  // so a non-empty value means a bot filled every field on the form.
  company_website?: unknown;
}

export const contactRoute = new Hono<{ Bindings: Bindings }>();

// POST /contact — public, no auth (recruiters hit this directly from the
// site's contact form, not the private /api/* board).
contactRoute.post("/contact", async (c) => {
  let body: ContactBody;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Malformed request body." }, 400);
  }

  if (typeof body.company_website === "string" && body.company_website.length > 0) {
    return c.json({ ok: true });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!name || !email || !message) {
    return c.json({ error: "name, email, and message are required." }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: "That email address doesn't look valid." }, 400);
  }
  if (name.length > MAX_FIELD_LENGTH || email.length > MAX_FIELD_LENGTH || message.length > MAX_FIELD_LENGTH) {
    return c.json({ error: "One of the fields is too long." }, 400);
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${c.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Specter UI contact form <${c.env.CONTACT_FROM_ADDRESS}>`,
        to: [c.env.CONTACT_TO_ADDRESS],
        reply_to: `${name} <${email}>`,
        subject: `New contact form message from ${name}`,
        text: `From: ${name} <${email}>\n\n${message}`,
        html: `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
      }),
    });

    if (!res.ok) {
      console.error("Resend API error", res.status, await res.text());
      return c.json({ error: "Failed to send message. Try again later." }, 502);
    }
  } catch (err) {
    console.error(err);
    return c.json({ error: "Failed to send message. Try again later." }, 502);
  }

  return c.json({ ok: true });
});

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
