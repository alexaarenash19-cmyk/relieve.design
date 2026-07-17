import { useState } from 'react';
import HeroSection from '../components/HeroSection.jsx';
import HeroScrollSection from '../components/HeroScrollSection.jsx';
import HeroReducedMotion from '../components/HeroReducedMotion.jsx';
import { HeroScrollProvider } from '../context/HeroScrollContext.jsx';
import Gallery from '../components/Gallery.jsx';
import CollectionsBlock from '../components/CollectionsBlock.jsx';
import Testimonials from '../components/Testimonials.jsx';

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function Home() {
  const [reduceMotion] = useState(prefersReducedMotion);

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
      <CollectionsBlock />
      <Testimonials />
    </>
  );
}
