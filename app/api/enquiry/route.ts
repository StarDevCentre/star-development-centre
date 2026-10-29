import {NextRequest, NextResponse} from "next/server";
import {programmes} from "../../../lib/siteData";
import {groupSessions, playerAges} from "../../../lib/programmeOptions";
export const runtime = "nodejs";
const modes = new Set(["booking", "interest", "general"]);
const reply = (body: object, status = 200) => NextResponse.json(body, {status, headers: {"Cache-Control": "no-store"}});
function field(value: unknown, max: number) {return typeof value === "string" && value.length <= max ? value.trim() : null;}
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return reply({error: "Origin not allowed."}, 403);
  if (process.env.STAR_ENQUIRY_ENABLED !== "true") return reply({error: "Please send your enquiry by email or WhatsApp."}, 503);
  const key = process.env.RESEND_API_KEY, from = process.env.STAR_ENQUIRY_FROM;
  if (!key || !from) return reply({error: "Please send your enquiry by email or WhatsApp."}, 503);
  if (!request.headers.get("content-type")?.includes("application/json")) return reply({error: "Invalid request."}, 415);
  if (Number(request.headers.get("content-length") || 0) > 12000) return reply({error: "Request too large."}, 413);
  let data: Record<string, unknown>;
  try {
    const body = await request.text();
    if (Buffer.byteLength(body) > 12000) return reply({error: "Request too large."}, 413);
    data = JSON.parse(body);
    if (!data || typeof data !== "object" || Array.isArray(data)) throw Error();
  } catch {return reply({error: "Invalid request."}, 400);}
  if (data.website) return reply({error: "Unable to accept this enquiry."}, 400);
  const mode = field(data.mode, 30), name = field(data.name, 100), email = field(data.email, 200);
  const phone = field(data.phone ?? "", 40), age = field(data.age ?? "", 3), programme = field(data.programme ?? "", 40), message = field(data.message ?? "", 1000), session = field(data.session ?? "", 50);
  if (!mode || !modes.has(mode) || !name || name.length < 2 || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || phone === null || age === null || programme === null || message === null || session === null || /[\r\n\x00-\x1f]/.test(name + email + phone) || data.consent !== true || (programme && !programmes.some(p => p.slug === programme)) || (age && (!/^\d{1,2}$/.test(age) || !playerAges.includes(Number(age))))) return reply({error: "Please check your enquiry details and consent."}, 400);
  const group = groupSessions.find(g => g.id === session && g.slug === programme);
  if (session && !group) return reply({error: "Please check your selected group."}, 400);
  const lines = ["New STAR " + mode + " enquiry", "Parent/guardian: " + name, "Email: " + email, "Phone: " + (phone || "Not supplied"), "Player age: " + (age || "Not supplied"), "Programme: " + (programmes.find(p => p.slug === programme)?.title || "Please advise"), ...(group ? ["Group: Ages " + group.minAge + "–" + group.maxAge + " · " + group.schedule] : []), "Message: " + (message || "Not supplied"), "Consent to contact: Yes"];
  try {
    const response = await fetch("https://api.resend.com/emails", {method: "POST", signal: AbortSignal.timeout(15000), headers: {Authorization: "Bearer " + key, "Content-Type": "application/json"}, body: JSON.stringify({from, to: ["coachdmp7@gmail.com"], subject: "STAR website: " + mode + " enquiry", text: lines.join("\n"), reply_to: email})});
    if (!response.ok) return reply({error: "Receipt could not be confirmed. Please contact STAR directly."}, 502);
    const receipt = await response.json();
    if (typeof receipt?.id !== "string" || !receipt.id.trim()) return reply({error: "Receipt could not be confirmed. Please contact STAR directly."}, 502);
    return reply({ok: true});
  } catch {return reply({error: "Receipt could not be confirmed. Please contact STAR directly."}, 502);}
}
