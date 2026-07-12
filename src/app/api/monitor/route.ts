import { createMonitor, hasAnakinKey } from "@/lib/anakin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * "Alert me when open" — registers an Anakin monitor on the opportunity's URL
 * so a change (e.g. "applications now open") can trigger a notification.
 * NOTE: the email is captured for delivery; wiring the actual email/SMS send
 * requires an Anakin Alerts webhook + a mail provider (follow-up).
 */
export async function POST(req: Request) {
  if (!hasAnakinKey()) {
    return Response.json({ error: "not configured" }, { status: 503 });
  }
  let body: { url?: string; email?: string; title?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const { url, email, title } = body;
  if (!url || !/^https?:\/\//.test(url)) {
    return Response.json({ error: "valid url required" }, { status: 400 });
  }
  if (!email || !/.+@.+\..+/.test(email)) {
    return Response.json({ error: "valid email required" }, { status: 400 });
  }

  try {
    const id = await createMonitor(url, `Zephyr alert · ${(title || url).slice(0, 60)}`);
    // Email captured for delivery once the alerts webhook is wired.
    console.log(`[zephyr] monitor ${id} created for ${email} → ${url}`);
    return Response.json({ ok: true, monitorId: id });
  } catch {
    return Response.json({ error: "could not create monitor" }, { status: 502 });
  }
}
