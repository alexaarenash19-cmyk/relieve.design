// Issue #55 — cart state shared by the drawer and checkout.
import { createContext, useContext, useEffect, useState } from 'react';

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
