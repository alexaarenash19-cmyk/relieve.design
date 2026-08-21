// MonolithBanner.jsx — full-bleed oversized wordmark cropped by its own
// container edge (monolith.nyc-style bookend). The SVG fills are already
// baked to match this project's theme tokens (--color-line for light,
// --color-gallery-white for dark), so no runtime recolor is needed — just
// pick the right asset for the active theme, same useTheme() ThemeToggle
// already uses.
//
// Static, no scroll/animation: repo history (Hero.jsx, Home.jsx) is
// explicit about ripping out effects nobody asked for (pinned scroll-jack
// hero, placeholder 3D storyboard) — this is plain CSS crop, nothing more.
//
// Always decorative (duplicates the brand name Nav/Hero already announce
// to screen readers), so alt is intentionally empty rather than a prop.
import { useTheme } from '../context/ThemeContext.jsx';

export default function MonolithBanner({ lightSrc, darkSrc, crop }) {
  const { theme } = useTheme();
  const src = theme === 'dark' ? darkSrc : lightSrc;
  return (
    <div className="w-full h-[28vh] md:h-[38vh] overflow-hidden bg-gallery-white">
      <img
        src={src}
        alt=""
        className="w-full h-full object-cover"
        style={{ objectPosition: crop === 'bottom' ? 'bottom' : 'top' }}
      />
    </div>
  );
}
