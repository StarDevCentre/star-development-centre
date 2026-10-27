"use client";

import { memo, useId } from "react";
import { projectPitchPoint, type Point } from "../lib/parentPitchPreview";

const points = (items: Point[]) => items.map((p, i) => { const c = projectPitchPoint(p, true); return `${i ? "L" : "M"}${c.x.toFixed(2)},${c.y.toFixed(2)}`; }).join(" ") + " Z";
const fieldRect = (x: number, y: number, w: number, h: number) => points([{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }]);

/** Lightweight SVG scenery; the live position buttons share its ground projection. */
export const ParentPitchStadium = memo(function ParentPitchStadium({ name, formation, format }: { name: string; formation: string; format: number }) {
 const id = `stadium-${useId().replace(/:/g, "")}`;
 const fill = (key: string) => `url(#${id}-${key})`;
 const goal = (near: boolean) => {
  const y = near ? 100 : 0, left = projectPitchPoint({ x: 43, y }, true), right = projectPitchPoint({ x: 57, y }, true);
  const height = near ? 29 : 23, depth = near ? 29 : -15, spread = near ? 5 : -4;
  const frame = `M${left.x},${left.y} L${left.x},${left.y - height} L${right.x},${right.y - height} L${right.x},${right.y}`;
  const net = `M${left.x},${left.y - height} L${left.x - spread},${left.y + depth - height} L${right.x + spread},${right.y + depth - height} L${right.x},${right.y - height} Z M${left.x - spread},${left.y + depth - height} L${left.x - spread},${left.y + depth} L${right.x + spread},${right.y + depth} L${right.x + spread},${right.y + depth - height}`;
  return <g key={String(near)}><path d={net} fill={fill("net")} stroke="#c8dfed66" strokeWidth="1"/><path d={`M${left.x},${left.y} L${left.x - spread},${left.y + depth} L${right.x + spread},${right.y + depth} L${right.x},${right.y}`} fill="none" stroke="#d4e7ef66" strokeWidth="1"/><path d={frame} fill="none" stroke="#f1fbff" strokeWidth={near ? 3 : 2.3} strokeLinejoin="round"/><path d={`M${left.x},${left.y} L${left.x + 8},${left.y + 6} L${right.x + 10},${right.y + 6}`} fill="none" stroke="#0007" strokeWidth="3"/></g>;
 };
 return <g className="ppx-stadium-scene">
  <defs>
   <linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor="#030817"/><stop offset="1" stopColor="#18374c"/></linearGradient>
   <linearGradient id={`${id}-grass`} x2=".3" y2="1"><stop stopColor="#24705e"/><stop offset=".5" stopColor="#2f8269"/><stop offset="1" stopColor="#164d42"/></linearGradient>
   <radialGradient id={`${id}-light`}><stop stopColor="#e8fbff" stopOpacity=".84"/><stop offset=".16" stopColor="#c6f1ff" stopOpacity=".34"/><stop offset="1" stopColor="#a8dfff" stopOpacity="0"/></radialGradient>
   <linearGradient id={`${id}-beam`} x2="0" y2="1"><stop stopColor="#d1f5ff" stopOpacity=".24"/><stop offset="1" stopColor="#d1f5ff" stopOpacity="0"/></linearGradient>
   <linearGradient id={`${id}-apron`} x2="0" y2="1"><stop stopColor="#1f3647"/><stop offset="1" stopColor="#091626"/></linearGradient>
   <linearGradient id={`${id}-roof`} x2="0" y2="1"><stop stopColor="#516b80"/><stop offset=".6" stopColor="#172e46"/><stop offset="1" stopColor="#071324"/></linearGradient>
   <pattern id={`${id}-seats`} width="15" height="12" patternUnits="userSpaceOnUse"><rect width="15" height="12" fill="#14243b"/><path d="M3 2h8v5H3Z" fill="#354d68"/><path d="M3 7h8v2H3Z" fill="#1c324c"/><circle cx="5" cy="3" r="1.1" fill="#b6c8d9" opacity=".55"/><circle cx="10" cy="4" r="1.2" fill="#d8ae78" opacity=".45"/></pattern>
   <pattern id={`${id}-net`} width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 0H5V5" fill="none" stroke="#dcf3ff" strokeOpacity=".32" strokeWidth=".6"/></pattern>
   <pattern id={`${id}-grain`} width="8" height="8" patternUnits="userSpaceOnUse"><path d="m1 1 1 2m3 0 1 2M2 6l1 1m3-1 1 1" stroke="#d5f8df" strokeOpacity=".13" strokeWidth=".7"/></pattern>
  </defs>
  <rect width="600" height="720" fill={fill("sky")}/>
  <path d="M0 84 34 51H566L600 84V720H0Z" fill="#091422"/>
  <path d="M18 80H582L535 162H65Z" fill={fill("seats")} stroke="#566b8155"/>
  {[99, 122, 144].map(y => <path key={y} d={`M${22 + (y - 80) * .56},${y} H${578 - (y - 80) * .56}`} stroke="#a8bbca44" strokeWidth="2"/>)}
  {[115, 208, 392, 485].map(x => <path key={x} d={`M${x},80 L${300 + (x - 300) * .8},160`} stroke="#91a4b477" strokeWidth="5"/>)}
  <path d="M0 94 59 176 37 647 0 700Z M600 94 541 176 563 647 600 700Z" fill={fill("seats")} stroke="#687b9044"/>
  {[12, 28, 43].map((x, i) => <g key={x}><path d={`M${x},${130 + i * 22} L${x - 4},${673 - i * 10}`} stroke="#778b9a55" strokeWidth="2"/><path d={`M${600 - x},${130 + i * 22} L${604 - x},${673 - i * 10}`} stroke="#778b9a55" strokeWidth="2"/></g>)}
  <path d="M0 31H600L569 69H31Z" fill={fill("roof")}/><path d="M31 69H569" stroke="#b4cfdd77" strokeWidth="2"/>
  {Array.from({ length: 13 }, (_, i) => <path key={i} d={`M${i * 50},32 L${32 + i * 44.7},68 M${i * 50},32 L${77 + i * 44.7},68`} stroke="#aec6d03b" strokeWidth="1"/>)}
  <g transform="translate(215 83)"><rect width="170" height="62" rx="3" fill="#030b17" stroke="#bdcddd66"/><rect x="8" y="9" width="46" height="43" rx="2" fill="#f7f8fb"/><image href="/images/star-colour-transparent.webp" x="11" y="12" width="40" height="37" preserveAspectRatio="xMidYMid meet"/><text x="64" y="26" fill="#f4d78e" fontSize="12" fontWeight="800" fontFamily="Arial">{name.toUpperCase()}’S PITCH</text><text x="64" y="44" fill="#c7d8e9" fontSize="10" fontWeight="600" fontFamily="Arial">{format}-A-SIDE  /  {formation}</text></g>
  <path d={fieldRect(-5, -6, 110, 113)} fill={fill("apron")} stroke="#4c6b7d55" strokeWidth="1"/>
  <path d={fieldRect(0, 0, 100, 100)} fill={fill("grass")}/>
  {Array.from({ length: 10 }, (_, i) => <path key={i} d={fieldRect(0, i * 10, 100, 10)} fill={i % 2 ? "#031c1e20" : "#c9ffd90b"}/>)}
  <path d={fieldRect(0, 0, 100, 100)} fill={fill("grain")}/>
  <path d={fieldRect(-4, -7, 108, 4)} fill="#142a40" stroke="#7ea3b866" strokeWidth=".8"/>
  <text x="300" y="168" fill="#e7c978" fontFamily="Arial" fontSize="8" textAnchor="middle" fontWeight="700" letterSpacing="3">DEVELOP. BELIEVE. ACHIEVE.</text>
  <path d="M17 668 58 652 542 652 583 668 583 713 17 713Z" fill={fill("seats")}/>
  <path d="M46 658 554 658 562 670H38Z" fill="#122c43" stroke="#b7ccdf55" strokeWidth="1"/>
  <text x="300" y="667" fill="#c3d8eb" fontFamily="Arial" fontSize="7" textAnchor="middle" letterSpacing="4">S T A R   D E V E L O P M E N T   C E N T R E</text>
  <g className="ppx-stadium-light-beams" pointerEvents="none"><path d="M31 80 310 470 88 580Z M569 80 290 470 512 580Z" fill={fill("beam")}/><ellipse cx="40" cy="83" rx="150" ry="105" fill={fill("light")}/><ellipse cx="560" cy="83" rx="150" ry="105" fill={fill("light")}/><ellipse cx="15" cy="423" rx="76" ry="170" fill={fill("light")} opacity=".3"/><ellipse cx="585" cy="423" rx="76" ry="170" fill={fill("light")} opacity=".3"/></g>
  {[32, 568].map(x => <g key={x}><path d={`M${x},75V154`} stroke="#a8bfce" strokeWidth="3"/><rect x={x - 22} y="57" width="44" height="29" rx="3" fill="#172f46" stroke="#819caf"/>{Array.from({ length: 12 }, (_, i) => <rect key={i} x={x - 17 + (i % 4) * 9} y={62 + Math.floor(i / 4) * 7} width="6" height="4" rx="1" fill="#e9fbff"/>)}</g>)}
  {goal(false)}{goal(true)}
 </g>;
});

export function PitchPlayerShirt({ label, keeper }: { label: string; keeper: boolean }) {
 return <svg className={`ppx-pitch-kit ${keeper ? "ppx-pitch-keeper-kit" : ""}`} viewBox="0 0 64 70" aria-hidden="true"><ellipse className="ppx-pitch-kit-ground" cx="32" cy="63" rx="22" ry="5"/><path className="ppx-pitch-kit-outline" d="m21 8 7-4h8l7 4 17 11-8 14-8-4 2 30H18l2-30-8 4-8-14L21 8Z"/><path className="ppx-pitch-kit-fabric" d="m21 8 7-4h8l7 4 17 11-8 14-8-4 2 30H18l2-30-8 4-8-14L21 8Z"/><path className="ppx-pitch-kit-purple" d="m19 10 9 7v8l-10-7Zm0 21 9 6v8l-9-6Zm0 18 9 6v4H18Zm20-42 17 13-4 5-11-8Z"/><path d="m28 4 4 5 4-5" stroke="#5c2589" strokeWidth="3" fill="none"/><path d="m6 22 7 10m39 0 7-11" stroke="#e43d53" strokeWidth="3"/><path d="M20 57H44" stroke="#b8c9d5" strokeWidth="1"/><text x="36" y="38" textAnchor="middle" className="ppx-pitch-kit-label">{label}</text></svg>;
}
