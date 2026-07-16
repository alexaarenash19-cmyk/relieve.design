// Issue #42 — shared button: hover inverts color (200ms), active scale 0.98.
export default function Button({ as: As = 'button', className = '', ...props }) {
  return (
    <As
      className={`inline-flex items-center justify-center rounded-[9px] px-6 py-3 font-body font-medium
        bg-navy text-bg-dark border border-navy
        hover:bg-transparent hover:text-navy
        active:scale-[0.98] transition-[background-color,color,transform] duration-200
        ${className}`}
      {...props}
    />
  );
}
