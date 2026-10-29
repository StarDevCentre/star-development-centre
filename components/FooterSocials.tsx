import "./footer-socials.css";

const socials = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/share/19eJcff1r3/",
    icon: <path d="M14 21v-8h2.7l.4-3H14V8.1c0-.9.3-1.5 1.6-1.5h1.7V3.9a22 22 0 0 0-2.5-.1c-2.5 0-4.2 1.5-4.2 4.3V10H8v3h2.6v8H14Z" fill="currentColor"/>,
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/stardevcentre/",
    icon: <><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></>,
  },
];

export function FooterSocials() {
  return (
    <nav className="footer-socials" aria-label="Follow STAR on social media">
      {socials.map(({name, href, icon}) => (
        <a key={name} href={href} target="_blank" rel="noopener noreferrer" aria-label={`STAR on ${name} (opens in a new tab)`} title={name}>
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">{icon}</svg>
        </a>
      ))}
    </nav>
  );
}
