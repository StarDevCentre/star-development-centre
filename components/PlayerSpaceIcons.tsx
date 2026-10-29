export type SpaceIconName = "home" | "train" | "journey" | "trophy" | "star" | "arrow" | "ball" | "clock" | "check" | "settings" | "refresh" | "exit" | "calendar" | "captain" | "comet" | "shield" | "book" | "chat" | "bell" | "more";

export function SpaceIcon({ name, className = "" }: { name: SpaceIconName; className?: string }) {
  const paths: Record<SpaceIconName, React.ReactNode> = {
    book:<><path d="M3 4h7q2 0 2 2 0-2 2-2h7v16h-7q-2 0-2 2 0-2-2-2H3zM12 6v16M6 8h3m6 0h3M6 12h3m6 0h3"/></>,
    chat:<><path d="M3 3h18v14H9l-6 5zM7 8h10M7 12h7"/></>,
    bell:<><path d="M5 17h14l-2-4V8a5 5 0 0 0-10 0v5zM10 21h4M12 1v2"/></>,
    more:<><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    captain: <><path d="m6 8-2-5 5 3 3-4 3 4 5-3-2 5z"/><circle cx="12" cy="12" r="5"/><path d="M3 22c0-7 18-7 18 0M10 12h.01M14 12h.01m-4 3q2 2 4 0"/></>,
    comet: <><path d="m3 3 7 2m-8 4 6 1m-5 5 4-1"/><circle cx="15" cy="15" r="7"/><path d="m15 11 3 3-1 4h-4l-1-4zM20 10l2-7-7 3"/></>,
    shield: <><path d="m12 2 9 4v7c0 5-9 9-9 9s-9-4-9-9V6z"/><path d="m12 6 1.5 3 3.5.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5L7 9.5l3.5-.5z"/></>,
    home: <><path d="m3 10 9-7 9 7v11h-6v-7H9v7H3z"/></>,
    train: <><path d="m4 5 6 2 3 6 7 3c2 1 2 5-1 5H4c-3 0-3-3-2-5l2-4z"/><path d="m9 9 4-2m-2 6 4-2M3 18h17"/></>,
    journey: <><path d="m2 21 7-13 4 7 3-11 6 17z"/><path d="m7 12 2 2 2-2m3-3 2 2 2-1"/></>,
    trophy: <><path d="M7 3h10v6c0 7-10 7-10 0zM12 15v6m-5 0h10M7 5H3v3c0 4 3 5 5 5m9-8h4v3c0 4-3 5-5 5"/></>,
    star: <path d="m12 2 3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z"/>,
    arrow: <path d="M3 12h18m-7-7 7 7-7 7"/>,
    ball: <><circle cx="12" cy="12" r="10"/><path d="m12 7 5 4-2 6H9l-2-6zM12 2v5m10 4h-5M2 11h5m0 9 2-3m8 3-2-3"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 6v7l4 2"/></>,
    check: <path d="m5 12 4 4L20 5"/>,
    settings: <><circle cx="12" cy="12" r="4"/><path d="m9 3 1-1h4l1 3 3 1 3 2-1 4 1 4-3 2-3 1-1 3h-4l-1-3-3-1-3-2 1-4-1-4 3-2 3-1z"/></>,
    refresh: <><path d="M20 10a8 8 0 1 0-1 8M20 3v7h-7"/></>,
    exit: <><path d="M10 3H3v18h7m-2-9h14m-5-5 5 5-5 5"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6m10-6v6M3 11h18m-13 4h2m4 0h2"/></>,
  };
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function BootSticker() {
  return <svg viewBox="0 0 300 170" aria-hidden="true" className="ps-boot-art"><path d="m38 43 70 8 26 39 97 28c28 8 30 28 2 33H37c-25 0-32-12-20-34l13-28z" fill="#f7f5ed" stroke="#06142e" strokeWidth="6"/><path d="m38 44 48 13 26 46 112 31-148 6-51-13 13-35z" fill="#f5c64d"/><path d="m110 81 25 28 68 16-87-1-48-63z" fill="#153b80"/><path d="m125 110 82 18-43 8-72-19z" fill="#df1f38"/><path d="m31 142 202 0-4 15H35z" fill="#06142e"/><path d="m48 157 4 9m46-9 4 9m48-9 4 9m46-9 4 9" stroke="#06142e" strokeWidth="8"/><path d="m91 71 21-7m-14 20 23-7m-15 20 24-7m-16 20 22-7" stroke="#06142e" strokeWidth="5"/><path d="m48 37-5-21m175 77 20-13m-4 54 25 5" stroke="#06142e" strokeWidth="4"/><path d="m248 42 5 12 13 2-10 9 3 13-12-7-12 6 3-13-9-10 13-1z" fill="#f5c64d" stroke="#06142e" strokeWidth="3"/></svg>;
}

export function PlayerDecoration({kind}:{kind:string}) {
 if(kind==='none')return null;
 if(kind==='touch-trail'||kind==='breakaway')return <svg className="ps-card-decoration" viewBox="0 0 300 180" aria-hidden="true" fill="none" stroke="#f5c64d" strokeWidth="5" strokeLinecap="round">{kind==='touch-trail'?<path d="M20 140Q-5 20 75 20" strokeDasharray="6 9"/>:<path d="m12 120 35-35m-20 60 35-35m-15 50 35-35m-48-40h13v13m2 12h13v13m7 2h13v13"/>}<circle cx="268" cy="143" r="21" fill="#fffdf7" stroke="#06142e"/><path d="m268 131 12 9-5 14h-14l-5-14z" fill="#06142e" stroke="#06142e"/></svg>;
 return <svg className="ps-card-decoration" viewBox="0 0 300 180" aria-hidden="true" fill="none" stroke="#f5c64d" strokeWidth="5" strokeLinecap="round">{kind==='lightning'?<><path d="m45 15-22 52h25l-12 53 49-70H58l13-35z" fill="#f5c64d"/><path d="m250 50-20 45h25l-15 60 48-80h-25l12-25z" fill="#df1f38"/></>:kind==='laurel'?<><path d="M95 165Q8 90 55 20m150 145Q292 90 245 20"/>{[40,65,90,115,140].map((y,i)=><g key={y}><ellipse cx={36+i*4} cy={y} rx="16" ry="7" transform={`rotate(35 ${36+i*4} ${y})`} fill="#f5c64d"/><ellipse cx={264-i*4} cy={y} rx="16" ry="7" transform={`rotate(-35 ${264-i*4} ${y})`} fill="#f5c64d"/></g>)}</>:<>{[[35,40],[265,55],[55,145],[245,145]].map(([x,y])=><path key={x} d={`M${x} ${y-16}v32m-16-16h32m-27-11 22 22m0-22-22 22`}/>)}</>}</svg>;
}

