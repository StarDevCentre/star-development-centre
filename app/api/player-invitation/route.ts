import {NextRequest, NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";

export const runtime = "nodejs";

const answer = (body: object, status = 200) => NextResponse.json(body, {status, headers: {"Cache-Control": "no-store"}});
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const attempts = new Map<string, {count: number; reset: number}>();
const signInUrl = "https://starfootball.uk/player-portal";

// The caller's JWT, not an admin key, determines which family records can be invited.
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return answer({error: "Origin not allowed."}, 403);
  if (!request.headers.get("content-type")?.includes("application/json")) return answer({error: "Invalid request."}, 415);
  if (Number(request.headers.get("content-length") || 0) > 2048) return answer({error: "Request too large."}, 413);

  const authorization = request.headers.get("authorization") || "";
  if (!/^Bearer \S+$/i.test(authorization)) return answer({error: "Please sign in to your parent account."}, 401);

  let body: {type?: unknown; id?: unknown; email?: unknown};
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 2048) return answer({error: "Request too large."}, 413);
    body = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw Error();
  } catch {return answer({error: "Invalid request."}, 400);}

  const type = body.type;
  const id = body.id;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if ((type !== "player" && type !== "intake") || typeof id !== "string" || !uuid.test(id) || !email || email.length > 254 || !emailPattern.test(email) || /[\r\n\x00-\x1f]/.test(email)) {
    return answer({error: "Enter a valid player and email address."}, 400);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return answer({error: "Player invitations are temporarily unavailable."}, 503);

  try {
    const caller = createClient(url, publishableKey, {
      global: {headers: {Authorization: authorization}},
      auth: {persistSession: false, autoRefreshToken: false}
    });
    const token = authorization.replace(/^Bearer\s+/i, "");
    const {data: {user}, error: identityError} = await caller.auth.getUser(token);
    if (identityError || !user || user.is_anonymous) return answer({error: "Please sign in to your parent account again."}, 401);

    // Onboarding can also invite a parent; only a linked guardian may send this player email.
    if (type === "intake") {
      const {data: intake, error: lookupError} = await caller.from("player_intakes").select("guardian_id").eq("id", id).maybeSingle();
      if (lookupError || !intake || intake.guardian_id !== user.id) return answer({error: "Parent access to this player is required."}, 403);
    }

    // Bounded, per-instance anti-spam protection (the database still enforces ownership).
    const now = Date.now();
    if (attempts.size > 1000) {
      for (const [key, entry] of attempts) if (entry.reset <= now) attempts.delete(key);
      if (attempts.size > 1000) attempts.clear();
    }
    const rateKey = user.id + ":" + email;
    const previous = attempts.get(rateKey);
    if (previous && previous.reset > now && previous.count >= 3) {
      return answer({error: "Too many invitations to this address. Please try again in 15 minutes."}, 429);
    }

    const args = type === "player" ? {p_player: id, p_email: email} : {p_id: id, p_email: email};
    const {error: invitationError} = await caller.rpc(type === "player" ? "request_player_link" : "request_intake_link", args);
    if (invitationError) return answer({error: invitationError.message || "This invitation could not be created."}, 400);
    attempts.set(rateKey, {count: previous && previous.reset > now ? previous.count + 1 : 1, reset: previous && previous.reset > now ? previous.reset : now + 15 * 60 * 1000});

    // An invitation remains usable in Player Space even if email delivery is unavailable.
    const key = process.env.RESEND_API_KEY;
    const from = process.env.STAR_ENQUIRY_FROM;
    if (!key || !from) return answer({ok: true, emailSubmitted: false});

    const subject = "You're invited to STAR Player Space";
    const text = [
      "You've been invited to connect your player account to STAR Development Centre.",
      "",
      "Open STAR Player Space: " + signInUrl,
      "",
      "Sign in or create an account using this email address, then select Connect on your family invitation. No invitation code is needed.",
      "Your invitation expires after 48 hours. If it expires, ask your parent or guardian to invite you again.",
      "",
      "If you weren't expecting this invitation, you can ignore this email.",
      "STAR Development Centre | Believe. Develop. Achieve."
    ].join("\n");
    const html = '<div style="font-family:Arial,sans-serif;max-width:580px;margin:auto;padding:28px;color:#172340;">'
      + '<h1 style="font-size:26px;color:#14213d;">Your STAR Player Space invitation</h1>'
      + '<p>A parent or guardian has invited you to connect your player account to STAR Development Centre.</p>'
      + '<p>Sign in or create an account using this email address, then choose <strong>Connect</strong> on your family invitation. No code needed.</p>'
      + '<p style="margin:30px 0;"><a href="' + signInUrl + '" style="background:#b91c35;color:#fff;padding:14px 22px;border-radius:6px;text-decoration:none;font-weight:bold;">Open Player Space</a></p>'
      + '<p>This invitation expires after 48 hours. If it expires, ask your parent or guardian to invite you again.</p>'
      + '<p style="font-size:13px;color:#52627a;">If you weren\'t expecting this email, you can ignore it.</p>'
      + '<p style="font-size:13px;color:#52627a;">STAR Development Centre · Believe. Develop. Achieve.</p></div>';

    try {
      const delivered = await fetch("https://api.resend.com/emails", {
        method: "POST",
        signal: AbortSignal.timeout(15000),
        headers: {"Authorization": "Bearer " + key, "Content-Type": "application/json"},
        body: JSON.stringify({from, to: [email], subject, text, html})
      });
      if (!delivered.ok) return answer({ok: true, emailSubmitted: false});
      const receipt = await delivered.json();
      return answer({ok: true, emailSubmitted: typeof receipt?.id === "string" && !!receipt.id.trim()});
    } catch {
      return answer({ok: true, emailSubmitted: false});
    }
  } catch {
    return answer({error: "We couldn't complete the invitation. Please try again."}, 500);
  }
}
