import HeroSection from '../components/HeroSection.jsx';
import HeroScrollSection from '../components/HeroScrollSection.jsx';
import { HeroScrollProvider } from '../context/HeroScrollContext.jsx';
import Gallery from '../components/Gallery.jsx';
import CollectionsBlock from '../components/CollectionsBlock.jsx';

export default function Home() {
  return (
    <>
      <HeroScrollProvider>
        <HeroScrollSection>
          <HeroSection />
        </HeroScrollSection>
      </HeroScrollProvider>
      <Gallery />
      <CollectionsBlock />
    </>
  );
}
