import { Suspense, lazy } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Nav from './components/Nav.jsx';
import CustomCursor from './components/CustomCursor.jsx';
import PageStamp from './components/PageStamp.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import ProductPanel from './components/ProductPanel.jsx';
import SvgFilters from './components/SvgFilters.jsx';
import SocialLinks from './components/SocialLinks.jsx';

// Issue #65 — every route used to be a static import, so every page (even
// /faq or /terminos, neither of which touches 3D) shipped Home's
// three.js/@react-three/fiber/@react-three/drei/gsap/lenis hero bundle and
// About's react-pageflip in its own initial JS payload, whether the page
// needed them or not. Each dynamic import() below becomes its own chunk —
// Vite/Rollup split on that boundary automatically, no bundler config
// needed. Doesn't touch scripts/prerender.mjs — that script only
// string-replaces meta tags into the already-built dist/index.html, it
// never imports or executes React, so it's unaffected either way.
const Home = lazy(() => import('./pages/Home.jsx'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess.jsx'));
const Collections = lazy(() => import('./pages/Collections.jsx'));
const Gift = lazy(() => import('./pages/Gift.jsx'));
const Collection = lazy(() => import('./pages/Collection.jsx'));
const Product = lazy(() => import('./pages/Product.jsx'));
const Personalize = lazy(() => import('./pages/Personalize.jsx'));
const Search = lazy(() => import('./pages/Search.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const Shipping = lazy(() => import('./pages/Shipping.jsx'));
const Faq = lazy(() => import('./pages/Faq.jsx'));
const OrderStatus = lazy(() => import('./pages/OrderStatus.jsx'));
const PrivacyNotice = lazy(() => import('./pages/PrivacyNotice.jsx'));
const Terms = lazy(() => import('./pages/Terms.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

function RouteFallback() {
  return (
    <p className="p-8 text-center font-label uppercase tracking-wide text-xs text-graphite/60">
      Cargando…
    </p>
  );
}

function Footer() {
  // No footer anywhere on the home page — not just the experience view —
  // per explicit request. Every other route keeps it.
  const location = useLocation();
  if (location.pathname === '/') return null;

  return (
    <footer className="font-label uppercase tracking-wide text-xs text-graphite/70 flex items-center justify-center gap-6 p-8">
      <Link
        to="/aviso-privacidad"
        className="hover:text-passport-ink hover:underline"
      >
        Aviso de privacidad
      </Link>
      <Link to="/terminos" className="hover:text-passport-ink hover:underline">
        Términos
      </Link>
      <SocialLinks />
    </footer>
  );
}

export default function App() {
  return (
    <>
      <SvgFilters />
      <PageStamp />
      <CustomCursor />
      <Nav />
      <CartDrawer />
      <ProductPanel />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/colecciones" element={<Collections />} />
          <Route path="/regalar" element={<Gift />} />
          <Route path="/coleccion/:slug" element={<Collection />} />
          <Route path="/pieza/:slug" element={<Product />} />
          <Route path="/personaliza" element={<Personalize />} />
          <Route path="/buscar" element={<Search />} />
          <Route path="/sobre" element={<About />} />
          <Route path="/envios" element={<Shipping />} />
          <Route path="/faq" element={<Faq />} />
          {/* Must resolve before /pedido/:token below — Stripe's success_url
              lands here with ?session_id=, not a magic-link token. */}
          <Route path="/pedido/success" element={<OrderSuccess />} />
          <Route path="/pedido/:token" element={<OrderStatus />} />
          <Route path="/aviso-privacidad" element={<PrivacyNotice />} />
          <Route path="/terminos" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Footer />
    </>
  );
}
