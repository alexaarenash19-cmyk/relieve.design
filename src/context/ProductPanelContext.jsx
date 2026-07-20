// PRD "Relieve: Fix de carga + paridad de efectos con Palmer", sección 4 —
// state for the half-screen product panel, same open/close shape as
// CartContext so ProductPanel.jsx can mirror CartDrawer.jsx's pattern.
// Clicking a pin on the canvas opens this instead of navigating; the full
// /pieza/:slug page stays reachable for direct links/SEO — this panel is a
// lightweight preview, not a replacement for it.
import { createContext, useContext, useState } from 'react';

const ProductPanelContext = createContext(null);

export function ProductPanelProvider({ children }) {
  const [slug, setSlug] = useState(null);

  return (
    <ProductPanelContext.Provider
      value={{
        slug,
        isOpen: slug !== null,
        openProduct: setSlug,
        closeProduct: () => setSlug(null),
      }}
    >
      {children}
    </ProductPanelContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook belongs next to its provider
export function useProductPanel() {
  const ctx = useContext(ProductPanelContext);
  if (!ctx)
    throw new Error('useProductPanel must be used within ProductPanelProvider');
  return ctx;
}
