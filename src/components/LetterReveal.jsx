// PRD "Relieve: Fix de carga + paridad de efectos con Palmer" sección 2.2 —
// wraps each character of `text` in its own span (SplitText-style) so it
// enters opacity 0->1 + translateY 8px->0, staggered ~0.03s apart. The
// animation itself (.letter-reveal-char, incl. the prefers-reduced-motion
// override) lives in index.css; this component only splits the text and
// sets each span's stagger delay.
const STAGGER_S = 0.03;

export default function LetterReveal({
  text,
  as: As = 'span',
  className = '',
}) {
  return (
    <As className={className}>
      {[...text].map((char, i) => (
        <span
          key={i}
          className="letter-reveal-char"
          style={{ animationDelay: `${i * STAGGER_S}s` }}
        >
          {char}
        </span>
      ))}
    </As>
  );
}
