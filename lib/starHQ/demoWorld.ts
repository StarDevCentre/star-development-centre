/** STAR HQ owner-only demo. No live player data or Supabase calls in this module. */
export type Point = { x: number; z: number };
export type DoorId = "changing" | "trophies" | "pitches";
export type DemoNPC = {
  id: string; kind: "receptionist" | "coach" | "player" | "parent" | "admin";
  x: number; z: number; heading: number; walking: boolean; cycle: number;
};
export const SAMPLE_PLAYER = Object.freeze({ firstName: "Alex", shirtName: "ALEX", shirtNumber: 10 });
export const ROOM = { halfWidth: 9, halfDepth: 6, ceiling: 4.2 } as const;
export const START: Point = { x: 0, z: 4.05 };
export const MIA: Point = { x: 0.55, z: -4.65 };
export const DOORS: ReadonlyArray<{id: DoorId; label: string; x: number; z: number}> = [
  { id: "changing", label: "Changing rooms", x: -8.2, z: 0.55 },
  { id: "trophies", label: "Trophy gallery", x: 8.2, z: -2.65 },
  { id: "pitches", label: "Training pitches", x: 8.2, z: 2.1 }
];
export const DIALOGUE = [
  { id: "what", label: "What is STAR HQ?", reply: "STAR HQ is your virtual football training centre! Today you can explore our reception, with more exciting spaces on the way." },
  { id: "changing", label: "Where are the changing rooms?", reply: "The changing-room door is on your left. We're getting it ready, so it's closed for the moment." },
  { id: "tour", label: "What can I explore today?", reply: "Have a look at our academy screens and the view of the training pitches. You can always pop back to say hello!" },
  { id: "bye", label: "Goodbye, Mia!", reply: "See you soon, Alex! Believe. Develop. Achieve." }
] as const;

const obstacles = [
  { left: -2.75, right: 2.75, near: -5.45, far: -3.1 }, // desk
  { left: -8.25, right: -5.05, near: -2.2, far: -0.95 }, // lounge sofa
  { left: -7.6, right: -5.7, near: -0.6, far: 0.45 }, // table
  { left: -8.65, right: -7.65, near: -4.95, far: -3.95 }, // planter
  { left: 5.9, right: 6.85, near: 4.3, far: 5.25 } // planter
];
export function distance(a: Point, b: Point): number { return Math.hypot(a.x - b.x, a.z - b.z); }
export function isBlocked(x: number, z: number, radius = 0.31): boolean {
  if (x < -ROOM.halfWidth + radius + 0.15 || x > ROOM.halfWidth - radius - 0.15 ||
      z < -ROOM.halfDepth + radius + 0.15 || z > ROOM.halfDepth - radius - 0.15) return true;
  return obstacles.some(o => x > o.left - radius && x < o.right + radius &&
    z > o.near - radius && z < o.far + radius);
}
export function moveWithCollisions(origin: Point, dx: number, dz: number): Point {
  // Separated-axis movement permits natural sliding alongside the walls.
  let x = origin.x, z = origin.z;
  if (!isBlocked(x + dx, z)) x += dx;
  if (!isBlocked(x, z + dz)) z += dz;
  return { x, z };
}
export function nearestInteraction(point: Point): { kind: "mia" | "door"; label: string; id: string } | null {
  if (distance(point, {x: 0.7, z: -2.75}) < 2.05) {
    return { kind: "mia", label: "Talk to Mia", id: "mia" };
  }
  for (const door of DOORS) {
    if (distance(point, door) < 1.65) return { kind: "door", label: "Explore " + door.label, id: door.id };
  }
  return null;
}
export function londonHour(date: Date): {hour: number; minute: number; label: string} {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(date);
  const hour = Number(parts.find(p => p.type === "hour")?.value ?? "12");
  const minute = Number(parts.find(p => p.type === "minute")?.value ?? "0");
  return { hour, minute, label: String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0") + " UK" };
}
export function daylight(date: Date): {light: number; stage: "day" | "dusk" | "night"} {
  const {hour,minute} = londonHour(date);
  const h = hour + minute / 60;
  // Fixed, documented v1 approximate time windows (not astronomical sunrise/sunset).
  const light = h < 6.4 || h > 20.3 ? 0.07 :
    h < 8.3 ? 0.07 + (h - 6.4) / 1.9 * 0.91 :
    h > 17.6 ? Math.max(0.07, 0.98 - (h - 17.6) / 2.7 * 0.91) : 0.98;
  return {light: Math.max(0.07, Math.min(0.98, light)), stage: light > 0.65 ? "day" : light > 0.20 ? "dusk" : "night"};
}
type Path = { id: DemoNPC["id"]; kind: DemoNPC["kind"]; points: Point[]; pace: number; phase: number; pause: number };
export const NPC_PATHS: ReadonlyArray<Path> = [
  { id: "mia", kind: "receptionist", points: [{x: 0.55,z:-4.65}], pace: 0, phase: 0, pause: 1 },
  { id: "coach", kind: "coach", points: [{x:4.15,z:-4.4},{x:3.1,z:-0.8},{x:5.2,z:2.1},{x:3.1,z:-0.8}], pace:0.63,phase:0,pause:1 },
  { id: "player-a", kind: "player", points: [{x:-3.7,z:4.8},{x:-3.9,z:2.45},{x:-6.1,z:2.4},{x:-6.5,z:3.5}], pace:0.75,phase:4,pause:0.6 },
  { id: "player-b", kind: "player", points: [{x:2.35,z:4.7},{x:3.6,z:2.5},{x:4.2,z:0.8},{x:3.3,z:2.3}], pace:0.72,phase:1,pause:0.7 },
  { id: "parent", kind: "parent", points: [{x:-5.1,z:-3.3},{x:-4.15,z:1.5},{x:-5.1,z:-3.3}], pace:0.40,phase:7,pause:3 },
  { id: "admin", kind: "admin", points: [{x:2.7,z:-3.15},{x:4.6,z:-1.0},{x:3.9,z:3.4},{x:2.7,z:-3.15}], pace:0.54,phase:2,pause:1.5 }
];
export function npcAtTime(path: Path, elapsed: number): DemoNPC {
  if (path.points.length === 1 || path.pace <= 0) {
    return {id:path.id,kind:path.kind,x:path.points[0].x,z:path.points[0].z,heading:0,walking:false,cycle:elapsed};
  }
  const segments = path.points.map((a,i) => ({
    a, b:path.points[(i+1)%path.points.length],
    duration:distance(a,path.points[(i+1)%path.points.length])/path.pace
  }));
  const period = segments.reduce((sum,s)=>sum+s.duration+path.pause,0);
  let t = (elapsed + path.phase) % period;
  for (const s of segments) {
    if (t < s.duration) {
      const ratio = Math.min(1, t / Math.max(0.001,s.duration));
      return {id:path.id,kind:path.kind,x:s.a.x+(s.b.x-s.a.x)*ratio,
        z:s.a.z+(s.b.z-s.a.z)*ratio,heading:Math.atan2(s.b.x-s.a.x,s.b.z-s.a.z),walking:true,cycle:elapsed};
    }
    t-=s.duration;
    if (t<path.pause) return {id:path.id,kind:path.kind,x:s.b.x,z:s.b.z,heading:0,walking:false,cycle:elapsed};
    t-=path.pause;
  }
  const p=path.points[0];
  return {id:path.id,kind:path.kind,x:p.x,z:p.z,heading:0,walking:false,cycle:elapsed};
}
