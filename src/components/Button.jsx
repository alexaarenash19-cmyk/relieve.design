// Issue #42 — shared button: hover inverts color (200ms), active scale 0.98.
export default function Button({ as: As = 'button', className = '', ...props }) {
  return (
    <As
      className={`inline-flex items-center justify-center rounded-[9px] px-6 py-3 font-heading font-bold
        bg-brand-dark text-dark-bg border border-brand-dark
        hover:bg-transparent hover:text-brand-dark
        active:scale-[0.98] transition-[background-color,color,transform] duration-200
        ${className}`}
      {...props}
    />
  );
}
