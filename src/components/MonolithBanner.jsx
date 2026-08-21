// MonolithBanner.jsx — full-bleed oversized wordmark cropped by its own
// container edge (monolith.nyc-style bookend). The SVG fills are already
// baked to match this project's theme tokens (--color-line for light,
// --color-gallery-white for dark), so no runtime recolor is needed — just
// pick the right asset for the active theme, same useTheme() ThemeToggle
// already uses.
//
// Container height is driven by `vw`, not `vh`. `object-fit: cover` always
// scales the image to fill the container's *width* first, so on a wide,
// short window (common desktop aspect ratios, not just mobile) a `vh`
// height and a `vw`-driven scale disagree — the same crop-in-CSS-percent
// can swing from a tasteful sliver to over half the letterform lost,
// purely because of window shape. Sizing the container in `vw` too keeps
// the visible fraction of the wordmark constant everywhere.
//
// Static, no scroll/animation: repo history (Hero.jsx, Home.jsx) is
// explicit about ripping out effects nobody asked for (pinned scroll-jack
// hero, placeholder 3D storyboard) — this is plain CSS crop, nothing more.
//
// Always decorative (duplicates the brand name Nav/Hero already announce
// to screen readers), so alt is intentionally empty rather than a prop.
import { useTheme } from '../context/ThemeContext.jsx';

// Fraction of the wordmark's natural height left visible after the crop —
// tuned by eye against the monolith.nyc reference, kept short of a full
// crop since this wordmark's letterforms (e.g. the mirrored final "E")
// need more of their shape intact to stay legible than a plain sans font.
const SHOW_FRACTION = 0.88;

export default function MonolithBanner({ lightSrc, darkSrc, crop, aspectRatio }) {
  const { theme } = useTheme();
  const src = theme === 'dark' ? darkSrc : lightSrc;
  const heightVw = (SHOW_FRACTION / aspectRatio) * 100;
  return (
    <div
      className="w-full overflow-hidden bg-gallery-white"
      style={{ height: `${heightVw}vw` }}
    >
      <img
        src={src}
        alt=""
        className="w-full h-full object-cover"
        style={{ objectPosition: crop === 'bottom' ? 'bottom' : 'top' }}
      />
    </div>
  );
}
