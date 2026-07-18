// Lets Gallery's scattered "experience view" mode tell distant siblings
// (Home's Testimonials, App's footer) to hide themselves — that view must
// read as a clean, self-contained screen with no footer/testimonials
// visible, without hardcoding that rule into every unrelated component.
import { createContext, useContext, useState } from 'react';

const ExperienceViewContext = createContext({ active: false, setActive: () => {} });

export function ExperienceViewProvider({ children }) {
  const [active, setActive] = useState(false);
  return (
    <ExperienceViewContext.Provider value={{ active, setActive }}>
      {children}
    </ExperienceViewContext.Provider>
  );
}

export function useExperienceView() {
  return useContext(ExperienceViewContext);
}
