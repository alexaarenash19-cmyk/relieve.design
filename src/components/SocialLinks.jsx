// Checkpoint 4 — Instagram/TikTok icons for the footer.
// PLACEHOLDER — hrefs are "#" until Ale confirms the real account handles.
const LINKS = [
  {
    name: 'Instagram',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: 'TikTok',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
        <path d="M14 4v10.5a3.5 3.5 0 1 1-3-3.46" />
        <path d="M14 4c.6 2.4 2.2 4 4.5 4.3" />
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
