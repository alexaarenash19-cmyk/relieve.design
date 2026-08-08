// Issue #55 — cart state shared by the drawer and checkout.
import { createContext, useContext, useEffect, useState } from 'react';
import { fetchJsonArray } from '../lib/fetchJsonArray.js';

const CartContext = createContext(null);
const STORAGE_KEY = 'relieve_cart';

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { items: [], isGift: false, giftMessage: '' };
  } catch {
    return { items: [], isGift: false, giftMessage: '' };
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
    fetchJsonArray('/api/places')
      .then((places) => {
        if (cancelled) return;
        const validSlugs = new Set(places.map((p) => p.slug));
        setState((s) => {
          const kept = s.items.filter((i) => !i.place_slug || validSlugs.has(i.place_slug));
          return kept.length === s.items.length ? s : { ...s, items: kept };
        });
      })
      // Best-effort: a network hiccup here must not clear a valid cart —
      // worst case a stale item survives until the next successful load.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  function addItem(item) {
    setState((s) => ({ ...s, items: [...s.items, { ...item, key: crypto.randomUUID() }] }));
    setIsOpen(true); // adding a piece opens the drawer so you see it landed
  }

  function removeItem(key) {
    setState((s) => ({ ...s, items: s.items.filter((i) => i.key !== key) }));
  }

  function updateQty(key, qty) {
    setState((s) => ({
      ...s,
      items: s.items.map((i) => (i.key === key ? { ...i, qty: Math.max(1, qty) } : i)),
    }));
  }

  function setIsGift(isGift) {
    setState((s) => ({ ...s, isGift }));
  }

  function setGiftMessage(giftMessage) {
    setState((s) => ({ ...s, giftMessage }));
  }

  const subtotal_cents = state.items.reduce((sum, i) => sum + i.unit_price_cents * i.qty, 0);

  return (
    <CartContext.Provider
      value={{
        ...state,
        subtotal_cents,
        addItem,
        removeItem,
        updateQty,
        setIsGift,
        setGiftMessage,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        toggleCart: () => setIsOpen((o) => !o),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook belongs next to its provider
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
