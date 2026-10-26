export type SpaceIconName = "home" | "train" | "journey" | "trophy" | "star" | "arrow" | "ball" | "clock" | "check" | "settings" | "refresh" | "exit" | "calendar";

export function SpaceIcon({ name, className = "" }: { name: SpaceIconName; className?: string }) {
  const paths: Record<SpaceIconName, React.ReactNode> = {
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
  return <svg viewBox="0 0 300 170" aria-hidden="true" className="ps-boot-art"><path d="m38 43 70 8 26 39 97 28c28 8 30 28 2 33H37c-25 0-32-12-20-34l13-28z" fill="#f7f5ed" stroke="#181624" strokeWidth="6"/><path d="m38 44 48 13 26 46 112 31-148 6-51-13 13-35z" fill="#b5a0ff"/><path d="m110 81 25 28 68 16-87-1-48-63z" fill="#2158f5"/><path d="m125 110 82 18-43 8-72-19z" fill="#ef6d88"/><path d="m31 142 202 0-4 15H35z" fill="#181624"/><path d="m48 157 4 9m46-9 4 9m48-9 4 9m46-9 4 9" stroke="#181624" strokeWidth="8"/><path d="m91 71 21-7m-14 20 23-7m-15 20 24-7m-16 20 22-7" stroke="#181624" strokeWidth="5"/><path d="m48 37-5-21m175 77 20-13m-4 54 25 5" stroke="#181624" strokeWidth="4"/><path d="m248 42 5 12 13 2-10 9 3 13-12-7-12 6 3-13-9-10 13-1z" fill="#f3ff68" stroke="#181624" strokeWidth="3"/></svg>;
}
