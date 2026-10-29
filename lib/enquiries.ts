import {programmes} from "./siteData";
import {groupSessions, playerAges} from "./programmeOptions";

export const enquiryResponseTime = "We normally reply within 12 hours, but please allow up to 48 hours.";
export type EnquiryMode = "booking" | "interest" | "general";
export function initialEnquirySelection(params: {get: (key: string) => string | null}) {
  const programme = programmes.some(p => p.slug === params.get("programme")) ? params.get("programme")! : "";
  const rawAge = params.get("age") || "";
  const age = /^(?:[5-9]|1[0-8])$/.test(rawAge) && playerAges.includes(Number(rawAge)) ? rawAge : "";
  const group = groupSessions.find(g => g.id === params.get("session") && g.slug === programme && (!age || (Number(age) >= g.minAge && Number(age) <= g.maxAge)));
  return {programme, age, session: group?.id || ""};
}
export function enquiryText({mode, name, email, phone, age, programme, session, message}: {mode: EnquiryMode; name: string; email: string; phone: string; age: string; programme: string; session: string; message: string}) {
  const chosen = programmes.find(p => p.slug === programme);
  const group = groupSessions.find(g => g.id === session && g.slug === programme);
  return ["STAR " + (mode === "booking" ? "session request" : mode === "interest" ? "programme interest" : "coaching enquiry"), "Parent/guardian: " + name.trim(), "Email: " + email.trim(), "Phone: " + (phone.trim() || "Not supplied"), "Player age: " + (age || "Not supplied"), "Programme: " + (chosen?.title || "Please advise"), ...(group ? ["Group: Ages " + group.minAge + "–" + group.maxAge + " · " + group.schedule] : []), "Message: " + (message.trim() || "Not supplied")].join("\n");
}
export function enquiryWasReceived(ok: boolean, data: unknown) {
  return ok && !!data && typeof data === "object" && "ok" in data && data.ok === true;
}
