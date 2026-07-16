import HeroScene from '../components/HeroScene.jsx';
import HeroScrollSection from '../components/HeroScrollSection.jsx';
import { HeroScrollProvider } from '../context/HeroScrollContext.jsx';
import Gallery from '../components/Gallery.jsx';
import CollectionsBlock from '../components/CollectionsBlock.jsx';

export default function Home() {
  return (
    <>
      <HeroScrollProvider>
        <HeroScrollSection>
          <h1 className="p-8 font-display font-light text-[clamp(3.5rem,4vw+2rem,6rem)] leading-[1.05] tracking-[-0.02em]">
            Relieve
          </h1>
          <HeroScene />
        </HeroScrollSection>
      </HeroScrollProvider>
      <Gallery />
      <CollectionsBlock />
    </>
  );
}
