import {programmes, programmeForAge} from "./siteData";

export const playerAges = Array.from({length: 14}, (_, i) => i + 5);
export const groupSessions = [
  {id: "sparks-5-7", slug: "sparks", title: "STAR Sparks", minAge: 5, maxAge: 7, schedule: "Monday · 3:45–4:45pm", focus: "Discover football through movement, simple games and plenty of time on the ball."},
  {id: "sparks-8-10", slug: "sparks", title: "STAR Sparks", minAge: 8, maxAge: 10, schedule: "Monday · 3:45–4:45pm", focus: "Build ball skills, confidence and teamwork through enjoyable football challenges."},
  {id: "development-11-13", slug: "development", title: "Development Group", minAge: 11, maxAge: 13, schedule: "Tuesday · 4pm", focus: "Practise technique, awareness and decisions with other girls at a similar stage."},
  {id: "development-14-16", slug: "development", title: "Development Group", minAge: 14, maxAge: 16, schedule: "Tuesday · 5pm", focus: "Develop technique and game understanding through realistic football situations."}
];

export const programmeDetails: Record<string, {intro: string; fit: string; includes: string[]; duration: string; format: string; schedule: string; note: string}> = {
  "one-to-one": {
    intro: "Time and attention for one player. We agree a focus together, build the session around her game and give her something clear to try in her next practice or match.",
    fit: "Girls aged 11–18 who want personal coaching, whether that means growing in confidence, improving a skill or working towards a football ambition.",
    includes: ["60 minutes of individual coaching", "A session focus agreed with the player", "Practice linked to her position and match situations", "Practical feedback and clear next steps", "STAR members’ pack after five sessions"],
    duration: "60 minutes", format: "Individual sessions", schedule: "Dates and times arranged individually with STAR.", note: "Sessions can be arranged around her needs and availability, without committing to a full programme."
  },
  flyers: {
    intro: "Consistent individual coaching for younger players, with a plan that develops as their confidence, skills and interests grow.",
    fit: "Girls aged 7–10 who would benefit from individual attention and a structured programme.",
    includes: ["16 weekly one-hour individual sessions", "Initial assessment and Individual Development Plan", "Monthly progress reports and regular reviews", "STAR members’ pack on joining"],
    duration: "60 minutes", format: "16-week programme", schedule: "One individual session each week, arranged with STAR.", note: "Goals and challenges are agreed with the player and develop at a pace that suits her."
  },
  prestige: {
    intro: "Sustained individual development with time to observe, plan, coach and review the details that matter to the player.",
    fit: "Girls aged 11–18 seeking a longer programme, from greater confidence in their club game to preparation for a new challenge.",
    includes: ["24 weekly 90-minute sessions, mainly one to one", "Initial assessment and Individual Development Plan", "Monthly reports, regular reviews and parent involvement", "Targeted independent development work", "Video feedback and pathway preparation where useful", "STAR members’ pack on joining"],
    duration: "90 minutes", format: "24-week programme", schedule: "One session each week, arranged with STAR.", note: "The player’s goals guide the programme. Trials, academy selection and placements are never guaranteed."
  },
  "season-support": {
    intro: "Connect individual development with the player’s own team. Club visits and match observations help us understand her role and the situations she faces.",
    fit: "Players already involved in club football who want support applying their development goals in their team environment.",
    includes: ["Club training visits, usually around monthly", "30 minutes of individual work during an agreed club visit", "Two match observations across the season", "Practical feedback to inform future coaching"],
    duration: "By arrangement", format: "Club & match support", schedule: "Visits agreed with the family, STAR and the club.", note: "Travel, club access and match arrangements are confirmed before a visit is booked."
  }
};

export type FinderGoal = "start" | "group" | "individual" | "match";
export const finderGoals: {value: FinderGoal; label: string}[] = [
  {value: "start", label: "Build confidence and enjoy football"},
  {value: "group", label: "Develop skills with other players"},
  {value: "individual", label: "Work towards individual football goals"},
  {value: "match", label: "Get feedback from club match performances"}
];

export function findProgrammeMatches(age: number, goal: FinderGoal) {
  const order = goal === "group" ? ["sparks", "development"]
    : goal === "individual" ? ["one-to-one", "flyers", "prestige"]
    : goal === "match" ? ["season-support", "one-to-one", "prestige"]
    : ["sparks", "development", "one-to-one", "flyers"];
  const reasons: Record<string, string> = {
    sparks: "A welcoming group setting to enjoy football and grow in confidence.",
    development: "Group practice with opportunities to try skills and decisions alongside other players.",
    "one-to-one": goal === "match" ? "Individual sessions can focus on a specific situation from the player’s club game." : "Personal attention and sessions shaped around the player’s own goals, with flexible arrangements.",
    flyers: "A structured individual programme designed for younger players, with regular progress reviews.",
    prestige: "A longer individual programme for consistent work on development goals, with reports and reviews.",
    "season-support": "Club visits and match observations connect feedback directly to the player’s team football."
  };
  return order.flatMap(slug => {
    const programme = programmes.find(p => p.slug === slug);
    return programme && programmeForAge(slug, age) ? [{...programme, reason: reasons[slug]}] : [];
  });
}

export function programmeEnquiryHref(slug = "", age?: number, sessionId?: string) {
  const params = new URLSearchParams();
  if (programmes.some(p => p.slug === slug)) params.set("programme", slug);
  if (age && playerAges.includes(age)) params.set("age", String(age));
  if (groupSessions.some(g => g.id === sessionId && g.slug === slug)) params.set("session", sessionId!);
  return "/contact" + (params.size ? "?" + params.toString() : "");
}

export function programmeSignInReturn(value: unknown) {
  return value === "programmes" ? "/programmes#compare" as const : value === "finder" ? "/find-your-programme" as const : undefined;
}

