// Footer social links. TikTok intentionally omitted for now (Ale, 2026-08-10) —
// re-add if/when there's an account to link to.
const LINKS = [
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/relieve.design.mx/',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: 'Pinterest',
    href: 'https://pin.it/6JtpPcKIs',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 17c1-3 1.5-5 1.5-6.5a2 2 0 1 1 4 .3c0 1.4-1 3.7-1.5 4.7a1.8 1.8 0 0 0 2.9 2c1.6-1.2 2.1-3.1 2.1-4.5a5 5 0 0 0-9.9-1" />
      </svg>
    ),
  },
];

export default function SocialLinks({ className = '' }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {LINKS.map((l) => (
        <a
          key={l.name}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l.name}
          data-cursor-label={l.name}
          className="hover:text-passport-ink transition-colors"
        >
          {l.icon}
        </a>
      ))}
    </div>
  );
}
