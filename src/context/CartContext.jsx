// Issue #55 — cart state shared by the drawer and checkout.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchJsonArray } from '../lib/fetchJsonArray.js';

const CartContext = createContext(null);
const STORAGE_KEY = 'relieve_cart';

// Hallazgo (auditoría 10 ago 2026): giftMessage vivía en este mismo state
// compartido — cada tecla en el textarea de CartDrawer.jsx re-renderizaba
// TODOS los consumidores de useCart() (Nav.jsx incluido), aunque a ninguno
// más le importe el texto del mensaje de regalo. Envolver el value del
// Provider en useMemo/useCallback (sigue haciéndose abajo, vale la pena
// igual) no arregla esto por sí solo: `state` cambia de referencia en cada
// tecla sin importar la memoización, porque giftMessage es parte de state.
// La solución real es que giftMessage deje de vivir aquí — nadie más que
// CartDrawer lo lee o lo escribe (confirmado por grep), así que vive como
// estado local en ese mismo componente, con su propio storage key para no
// perder la persistencia entre recargas.
function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { items: [], isGift: false };
  } catch {
    return { items: [], isGift: false };
  }
}

export function CartProvider({ children }) {
  const [state, setState] = useState(loadInitial);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Handoff 8 ago 2026 sección 4 — un carrito guardado en localStorage
  // puede traer piezas de una limpieza de catálogo anterior (Monterrey,
  // Gran Vía, Pico de Orizaba...) que ya no existen en places, y esas
  // rompían el checkout con "No pudimos iniciar el pago" sin explicación.
  // Se descartan en silencio al cargar, no al pagar — items sin
  // place_slug (piezas personalizadas via /personaliza) no se tocan, esos
  // nunca estuvieron en el catálogo.
  useEffect(() => {
    let cancelled = false;
    fetchJsonArray('/api/places').then(({ data: places, failed }) => {
      if (cancelled) return;
      // Hallazgo (auditoría 10 ago 2026): fetchJsonArray ahora distingue
      // "catálogo vacío" de "la petición falló" — antes ambos daban
      // places=[], y como este efecto usa el resultado para PODAR el
      // carrito de piezas que ya no existen, un fallo de red se habría
      // interpretado como "el catálogo entero está vacío" y habría
      // vaciado silenciosamente cualquier pieza real del carrito. Ahora
      // solo poda cuando la carga fue real (best-effort sigue intacto:
      // un fallo simplemente deja el carrito como está).
      if (failed) return;
      const validSlugs = new Set(places.map((p) => p.slug));
      setState((s) => {
        const kept = s.items.filter((i) => !i.place_slug || validSlugs.has(i.place_slug));
        return kept.length === s.items.length ? s : { ...s, items: kept };
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // useCallback: identidad estable entre renders (todas usan la forma
  // funcional de setState, sin cerrar sobre valores que cambien, así que
  // deps vacías es seguro) — necesario para que el useMemo de abajo pueda
  // detectar "nada cambió" en vez de recalcular el value en cada render.
  const addItem = useCallback((item) => {
    setState((s) => ({ ...s, items: [...s.items, { ...item, key: crypto.randomUUID() }] }));
    setIsOpen(true); // adding a piece opens the drawer so you see it landed
  }, []);

  const removeItem = useCallback((key) => {
    setState((s) => ({ ...s, items: s.items.filter((i) => i.key !== key) }));
  }, []);

  const updateQty = useCallback((key, qty) => {
    setState((s) => ({
      ...s,
      items: s.items.map((i) => (i.key === key ? { ...i, qty: Math.max(1, qty) } : i)),
    }));
  }, []);

  const setIsGift = useCallback((isGift) => {
    setState((s) => ({ ...s, isGift }));
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((o) => !o), []);

  const subtotal_cents = state.items.reduce((sum, i) => sum + i.unit_price_cents * i.qty, 0);

  const value = useMemo(
    () => ({
      ...state,
      subtotal_cents,
      addItem,
      removeItem,
      updateQty,
      setIsGift,
      isOpen,
      openCart,
      closeCart,
      toggleCart,
    }),
    [state, subtotal_cents, addItem, removeItem, updateQty, setIsGift, isOpen, openCart, closeCart, toggleCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook belongs next to its provider
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
