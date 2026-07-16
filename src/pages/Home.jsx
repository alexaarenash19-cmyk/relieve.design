import HeroScene from '../components/HeroScene.jsx';
import Gallery from '../components/Gallery.jsx';

export default function Home() {
  return (
    <>
      <h1 className="p-8 font-display font-light text-[clamp(3.5rem,4vw+2rem,6rem)] leading-[1.05] tracking-[-0.02em]">
        Relieve
      </h1>
      <HeroScene />
      <Gallery />
    </>
  );
}
