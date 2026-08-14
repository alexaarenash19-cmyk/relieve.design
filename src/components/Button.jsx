// Issue #42 — shared button: hover inverts color (200ms), active scale 0.98.
// apple-design audit (11 ago 2026) — Ale's direct call: this is the site's
// primary CTA (hero "Encargar mi pieza", checkout "Pagar", every other
// Button.jsx use) and it still had the old flat bg-brand-dark fill while
// every pill button elsewhere had already moved to Liquid Glass. Same
// pill-glass-active material (it's a background/border/shadow treatment,
// not shape-dependent — works on this rounded-[9px] rectangle exactly
// like it does on a rounded-full pill). Hover now brightens the glass
// (pill-glass-active's own :hover) instead of inverting to an outline —
// inverting away from brand-dark on hover doesn't read as "glass."
export default function Button({ as: As = 'button', className = '', ...props }) {
  return (
    <As
      className={`inline-flex items-center justify-center rounded-[9px] px-6 py-3 font-heading font-bold
        pill-glass-active text-on-accent
        active:scale-[0.98] transition-transform duration-200
        ${className}`}
      {...props}
    />
  );
}
