export type GameFormat = 9 | 11;
export type PitchPhase = "attack" | "defend";
export type Point = { x: number; y: number };
export type RoleGroup = "keeper" | "centreBack" | "fullBack" | "wingBack" | "holdingMidfield" | "centralMidfield" | "attackingMidfield" | "leftWide" | "rightWide" | "forward";
export type PitchSlot = Point & { id: string; label: string; short: string; group: RoleGroup };
export type Formation = { id: string; format: GameFormat; slots: PitchSlot[] };

const roles: Record<string, [string, string, RoleGroup]> = {
 GK: ["Goalkeeper", "GK", "keeper"], LB: ["Left back", "LB", "fullBack"], RB: ["Right back", "RB", "fullBack"],
 LCB: ["Left centre back", "LCB", "centreBack"], CB: ["Centre back", "CB", "centreBack"], RCB: ["Right centre back", "RCB", "centreBack"],
 LWB: ["Left wing back", "LWB", "wingBack"], RWB: ["Right wing back", "RWB", "wingBack"],
 DM: ["Holding midfielder", "DM", "holdingMidfield"], LDM: ["Left holding midfielder", "LDM", "holdingMidfield"], RDM: ["Right holding midfielder", "RDM", "holdingMidfield"],
 LCM: ["Left central midfielder", "LCM", "centralMidfield"], CM: ["Central midfielder", "CM", "centralMidfield"], RCM: ["Right central midfielder", "RCM", "centralMidfield"],
 AM: ["Attacking midfielder", "AM", "attackingMidfield"], LM: ["Left wide midfielder", "LM", "leftWide"], RM: ["Right wide midfielder", "RM", "rightWide"],
 LW: ["Left winger", "LW", "leftWide"], RW: ["Right winger", "RW", "rightWide"],
 LST: ["Left striker", "LST", "forward"], ST: ["Striker", "ST", "forward"], RST: ["Right striker", "RST", "forward"]
};
function formation(format: GameFormat, id: string, rows: [number, string[]][]): Formation {
 return { id, format, slots: [{ id: "GK", label: roles.GK[0], short: "GK", group: "keeper", x: 50, y: 91 }, ...rows.flatMap(([y, ids]) => ids.map((key, i) => ({ id: key, label: roles[key][0], short: roles[key][1], group: roles[key][2], x: ids.length === 1 ? 50 : ids.length === 2 ? [34, 66][i] : ids.length === 3 && ids.every(k => roles[k][2] === "centreBack") ? [27, 50, 73][i] : 9 + i * 82 / (ids.length - 1), y })))] };
}
export const pitchFormations: Formation[] = [
 formation(9, "2-4-2", [[76, ["LCB", "RCB"]], [49, ["LM", "LCM", "RCM", "RM"]], [21, ["LST", "RST"]]]),
 formation(9, "3-3-2", [[76, ["LCB", "CB", "RCB"]], [49, ["LM", "CM", "RM"]], [21, ["LST", "RST"]]]),
 formation(9, "3-2-3", [[76, ["LCB", "CB", "RCB"]], [51, ["LCM", "RCM"]], [23, ["LW", "ST", "RW"]]]),
 formation(11, "4-3-3", [[76, ["LB", "LCB", "RCB", "RB"]], [59, ["DM"]], [44, ["LCM", "RCM"]], [22, ["LW", "ST", "RW"]]]),
 formation(11, "4-4-2", [[76, ["LB", "LCB", "RCB", "RB"]], [48, ["LM", "LCM", "RCM", "RM"]], [21, ["LST", "RST"]]]),
 formation(11, "4-2-3-1", [[76, ["LB", "LCB", "RCB", "RB"]], [57, ["LDM", "RDM"]], [37, ["LW", "AM", "RW"]], [17, ["ST"]]]),
 formation(11, "3-5-2", [[76, ["LCB", "CB", "RCB"]], [59, ["DM"]], [45, ["LWB", "LCM", "RCM", "RWB"]], [21, ["LST", "RST"]]]),
 formation(11, "4-5-1", [[76, ["LB", "LCB", "RCB", "RB"]], [47, ["LM", "LCM", "CM", "RCM", "RM"]], [20, ["ST"]]]),
 formation(11, "3-1-4-2", [[76, ["LCB", "CB", "RCB"]], [59, ["DM"]], [42, ["LM", "LCM", "RCM", "RM"]], [20, ["LST", "RST"]]])
];
// These are fictional coach selections, independent of families exploring formations.
export const samplePitchProfiles: Record<string, { format: GameFormat; formation: string; main: RoleGroup; secondary: RoleGroup; mainLabel: string; secondaryLabel: string }> = {
 alex: { format: 9, formation: "2-4-2", main: "rightWide", secondary: "forward", mainLabel: "Right wing / wide midfield", secondaryLabel: "Striker" },
 sam: { format: 11, formation: "4-3-3", main: "centralMidfield", secondary: "leftWide", mainLabel: "Central midfield", secondaryLabel: "Left wing / wide midfield" }
};
export function positionStatus(slot: PitchSlot, profile: typeof samplePitchProfiles[string]) {
 return slot.group === profile.main ? "main" : slot.group === profile.secondary ? "secondary" : "explore";
}
export function selectFormationSlot(next: Formation, previous: PitchSlot | undefined, profile: typeof samplePitchProfiles[string]) {
 return next.slots.find(s => s.id === previous?.id) || next.slots.find(s => s.group === previous?.group) || next.slots.find(s => s.group === profile.main) || next.slots.find(s => s.group === profile.secondary) || next.slots[0];
}
export function projectPitchPoint(point: Point, stadium = false): Point {
 return stadium ? { x: 300 + (point.x - 50) / 100 * (370 + point.y * 1.5), y: 190 + point.y * 4.6 } : { x: 40 + point.x * 5.2, y: 40 + point.y * 6.4 };
}
export const roleGuides: Record<RoleGroup, { summary: string; attack: string; defend: string }> = {
 keeper: { summary: "Protect the goal and help the team start again with the ball.", attack: "Move to offer a safe passing option behind the defenders. Look up before choosing a pass.", defend: "Move across with the ball and stay ready to protect the goal. Talk to the defenders in front of you." },
 centreBack: { summary: "Protect the middle of the pitch and help the team play forward.", attack: "Find a little space to receive. Look ahead, then choose a teammate you can reach safely.", defend: "Recover towards your goal and protect the middle. Keep track of the ball and the nearest attacker." },
 fullBack: { summary: "Defend one side of the pitch and offer support when the team has the ball.", attack: "Move wider to offer a pass. If there is space and cover behind you, support the attack.", defend: "Recover towards your own goal. Get between the attacker and the goal, and stay connected to the centre backs." },
 wingBack: { summary: "Help the team on one side of the pitch, in attack and defence.", attack: "Move into space on your side to give the team width. Look for a pass or a chance to move forward.", defend: "Recover down your side and help protect the space beside the centre backs." },
 holdingMidfield: { summary: "Offer a passing option in front of the defence and protect the middle.", attack: "Move away from a nearby marker so a defender can pass to you. Look around before the ball arrives.", defend: "Recover in front of the centre backs. Help block a pass through the middle." },
 centralMidfield: { summary: "Connect teammates, offer passing options and help the team in both directions.", attack: "Look around, then move into a gap where a teammate can find you. Receive ready to choose your next pass.", defend: "Recover towards the middle and help close a passing route. Notice runners moving behind you." },
 attackingMidfield: { summary: "Find space closer to the forwards and help create chances.", attack: "Move into a gap behind the other team's midfield. Look up to find a forward or space to turn.", defend: "Recover towards midfield. Help make it harder for the other team to pass forward through the middle." },
 leftWide: { summary: "Offer a passing option on the left and help create chances from that side.", attack: "Start wide to make space. Move forward when a teammate can find you, then look for a pass or cross.", defend: "Recover on the left and help the teammate behind you. Keep the ball and your nearest opponent in view." },
 rightWide: { summary: "Offer a passing option on the right and help create chances from that side.", attack: "Start wide to make space. Move forward when a teammate can find you, then look for a pass or cross.", defend: "Recover on the right and help the teammate behind you. Keep the ball and your nearest opponent in view." },
 forward: { summary: "Help the team create and finish chances, and offer a pass further up the pitch.", attack: "Move a little away from a defender, then find a gap for a pass. Time your run so a teammate can find you.", defend: "Move back towards the middle when needed. Help guide the other team's play towards one side." }
};
const clamp = (n: number, low = 7, high = 92) => Math.max(low, Math.min(high, n));
export function roleMovement(slot: PitchSlot, phase: PitchPhase, format: GameFormat) {
 const direction = slot.x < 50 ? -1 : slot.x > 50 ? 1 : 0;
 const distance = format === 9 ? 14 : 18;
 let middle: Point = { x: slot.x, y: slot.y }, end: Point = { x: slot.x, y: slot.y };
 let labels: [string, string, string] = ["Starting position", "Find a passing option", "Support the next pass"];
 if (phase === "attack") {
  switch (slot.group) {
   case "keeper": middle = { x: 44, y: 87 }; end = { x: 40, y: 83 }; labels = ["See the play", "Offer a safe pass", "Be ready to receive"]; break;
   case "centreBack": middle = { x: slot.x + direction * 4, y: slot.y - 4 }; end = { x: slot.x + direction * 5, y: slot.y - 9 }; labels = ["Look ahead", "Make room to receive", "Support the next pass"]; break;
   case "fullBack": case "wingBack": middle = { x: slot.x + direction * 3, y: slot.y - 7 }; end = { x: slot.x + direction * 3, y: slot.y - distance }; labels = ["Look for space", "Offer width", "Support forward"]; break;
   case "leftWide": case "rightWide": middle = { x: slot.x, y: slot.y - 6 }; end = { x: slot.x - direction * 10, y: slot.y - distance }; labels = ["Start wide", "Watch the passer", "Move into the gap"]; break;
   case "forward": middle = { x: slot.x + (direction || 1) * 7, y: slot.y + 4 }; end = { x: slot.x - (direction || 1) * 7, y: slot.y - 10 }; labels = ["Look at the defender", "Make a little space", "Time the forward run"]; break;
   default: middle = { x: slot.x + (direction || 1) * 7, y: slot.y - 3 }; end = { x: slot.x + (direction || 1) * 11, y: slot.y - 9 }; labels = ["Look around", "Move into a gap", "Be ready for the pass"];
  }
 } else {
  if (slot.group === "keeper") { middle = { x: 44, y: 92 }; end = { x: 38, y: 92 }; labels = ["Watch the ball", "Move across the goal", "Get ready to react"]; }
  else { middle = { x: slot.x - direction * 4, y: slot.y + 7 }; end = { x: slot.x - direction * 9, y: slot.y + distance }; labels = ["Notice the danger", "Recover towards goal", "Protect the space"];
   if (slot.group === "forward") labels = ["Notice their next pass", "Recover towards midfield", "Help guide play wide"];
  }
 }
 return { points: [{ x: slot.x, y: slot.y }, middle, end].map(p => ({ x: clamp(p.x), y: clamp(p.y, 7, 93) })), labels, explanation: roleGuides[slot.group][phase] };
}

