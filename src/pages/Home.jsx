import { useState } from 'react';
import HeroSection from '../components/HeroSection.jsx';
import HeroScrollSection from '../components/HeroScrollSection.jsx';
import HeroReducedMotion from '../components/HeroReducedMotion.jsx';
import { HeroScrollProvider } from '../context/HeroScrollContext.jsx';
import Gallery from '../components/Gallery.jsx';
import Testimonials from '../components/Testimonials.jsx';
import { useExperienceView } from '../context/ExperienceViewContext.jsx';

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function Home() {
  const [reduceMotion] = useState(prefersReducedMotion);
  const { active: experienceViewActive } = useExperienceView();

  return (
    <>
      {reduceMotion ? (
        <HeroReducedMotion />
      ) : (
        <HeroScrollProvider>
          <HeroScrollSection>
            <HeroSection />
          </HeroScrollSection>
        </HeroScrollProvider>
      )}
      <Gallery />
      {!experienceViewActive && <Testimonials />}
    </>
  );
}
