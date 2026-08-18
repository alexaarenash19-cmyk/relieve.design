// Barra unificada (18 ago 2026) — mismo patrón que ProductPanelContext.jsx:
// Gallery.jsx (montado solo en Home.jsx) escribe su estado de vista aquí;
// Nav.jsx (montado global en App.jsx, fuera de <Routes>) lo lee para
// dibujar el toggle "vista cuadrícula"/"vista lienzo" dentro de la misma
// barra en vez de como pill sticky propia — ver DesktopNav.jsx. `active`
// distingue "Gallery no está montada" (no hay nada que alternar, oculta el
// control) de "está en modo lienzo", que también es un valor válido de
// `view`.
import { createContext, useContext, useState } from 'react';

const GalleryViewContext = createContext(null);

export function GalleryViewProvider({ children }) {
  const [view, setView] = useState('scattered');
  const [active, setActive] = useState(false);

  return (
    <GalleryViewContext.Provider value={{ view, setView, active, setActive }}>
      {children}
    </GalleryViewContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook belongs next to its provider
export function useGalleryView() {
  const ctx = useContext(GalleryViewContext);
  if (!ctx) throw new Error('useGalleryView must be used within GalleryViewProvider');
  return ctx;
}
