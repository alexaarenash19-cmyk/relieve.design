// Auditoría de seguridad (13 ago 2026), hallazgo 🟠 #11 — la validación de
// email estaba duplicada e inconsistente entre endpoints: postWaitlist no
// validaba nada (solo `!email`), postCurvaDeNivel/postPersonalizeRequest
// usaban `email.includes('@')` (deja pasar "@", "a@", "@@@"). Una sola
// función, regex real + el límite práctico de 254 caracteres de RFC 5321,
// compartida por los tres.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email) {
  return typeof email === 'string' && email.length > 0 && email.length <= 254 && EMAIL_RE.test(email);
}
