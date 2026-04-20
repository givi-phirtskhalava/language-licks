import type { NextRequest } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { isValidOrigin } from "@lib/auth";
import { verifyTurnstileToken } from "@lib/turnstile";

const resend = new Resend(process.env.RESEND_API_KEY);

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  email: z.email("Please enter a valid email address").max(254, "Email is too long"),
  text: z.string().trim().min(1, "Message is required").max(5000, "Message is too long"),
  turnstileToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  if (!isValidOrigin(request)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = contactSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { name, text, turnstileToken } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  const verified = await verifyTurnstileToken(turnstileToken, ip);
  if (!verified) {
    return Response.json({ error: "Captcha verification failed" }, { status: 400 });
  }

  const to = process.env.CONTACT_TO_EMAIL || process.env.EMAIL_FROM!;
  const escapedText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />");
  const escapedName = name.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    replyTo: email,
    subject: `Contact form: ${escapedName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2>New contact form submission</h2>
        <p><strong>Name:</strong> ${escapedName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${escapedText}</p>
      </div>
    `,
  });

  return Response.json({ sent: true });
}
