import {NextRequest, NextResponse} from "next/server";
import {createHash} from "node:crypto";

export const runtime = "nodejs";
const attempts = new Map<string, {count: number; reset: number}>();
const recipient = "staplegroveladiesfootballclub@gmail.com";
const response = (body: object, status = 200) => NextResponse.json(body, {status, headers: {"Cache-Control": "no-store"}});
const field = (value: unknown, max: number) => typeof value === "string" && value.length <= max ? value.trim() : "";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) return response({error: "Origin not allowed."}, 403);
  if (!request.headers.get("content-type")?.includes("application/json")) return response({error: "Invalid request."}, 415);
  if (Number(request.headers.get("content-length") || 0) > 4000) return response({error: "Request too large."}, 413);
  let data: Record<string, unknown>;
  try {
    const body = await request.text();
    if (Buffer.byteLength(body) > 4000) return response({error: "Request too large."}, 413);
    data = JSON.parse(body);
    if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error();
  } catch {return response({error: "Invalid request."}, 400);}
  if (data.website) return response({error: "Unable to accept this referral."}, 400);
  const name = field(data.name, 100), email = field(data.email, 200), phone = field(data.phone, 40), ageText = field(data.age, 3);
  const age = Number(ageText);
  if (name.length < 2 || /[\r\n\x00-\x1f]/.test(name + email + phone) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^[+\d\s().-]{7,40}$/.test(phone) || phone.replace(/\D/g, "").length < 7 || !/^\d{2,3}$/.test(ageText) || !Number.isInteger(age) || age < 15 || age > 100 || data.consent !== true) {
    return response({error: "Please enter a valid name, age (15+), email and phone number, and agree to share your details."}, 400);
  }
  const now = Date.now();
  for (const [key, entry] of attempts) if (entry.reset <= now) attempts.delete(key);
  const identity = createHash("sha256").update(request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown").digest("hex");
  const previous = attempts.get(identity);
  if (previous && previous.count >= 4) return response({error: "Too many attempts. Please try again later or email the club."}, 429);
  if (attempts.size > 10000) return response({error: "Please try again later or email the club."}, 429);
  attempts.set(identity, {count: (previous?.count || 0) + 1, reset: previous?.reset || now + 15 * 60 * 1000});
  const key = process.env.RESEND_API_KEY, from = process.env.STAR_ENQUIRY_FROM;
  if (!key || !from) return response({error: "Online email delivery is not available yet. Please use the referral email option below to contact the club."}, 503);
  try {
    const result = await fetch("https://api.resend.com/emails", {
      method: "POST", signal: AbortSignal.timeout(15000),
      headers: {Authorization: `Bearer ${key}`, "Content-Type": "application/json"},
      body: JSON.stringify({from, to: [recipient], reply_to: email, subject: "Staplegrove Ladies FC: player self-referral", text: ["Player self-referral from the STAR Pathways page", "", `Name: ${name}`, `Age: ${age}`, `Email: ${email}`, `Phone: ${phone}`, "", "The player agreed to share these details with Staplegrove Ladies FC and to be contacted about this enquiry.", "Enquiry only; the club must confirm eligibility and suitable arrangements."].join("\n")})
    });
    if (!result.ok) return response({error: "Your referral could not be delivered. Please try again or email the club using the option below."}, 502);
    const delivered = await result.json();
    if (!delivered.id) return response({error: "Delivery could not be confirmed. Please email the club."}, 502);
    return response({ok: true});
  } catch {return response({error: "Delivery could not be confirmed. Please email the club using the option below."}, 502);}
}
