// Issue #45 — scroll progress (0-1) through the pinned hero, exposed so the
// 8 storyboard stage transforms (#46) can consume it without prop drilling.
import { createContext, useContext, useState } from 'react';

const HeroScrollContext = createContext(0);

export function HeroScrollProvider({ children }) {
  const [progress, setProgress] = useState(0);
  return (
    <HeroScrollContext.Provider value={{ progress, setProgress }}>
      {children}
    </HeroScrollContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook belongs next to its provider
export function useHeroScroll() {
  return useContext(HeroScrollContext);
}
