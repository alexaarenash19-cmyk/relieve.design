import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Nav from './components/Nav.jsx';
import TrustBar from './components/TrustBar.jsx';
import CustomCursor from './components/CustomCursor.jsx';
import PageStamp from './components/PageStamp.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import SvgFilters from './components/SvgFilters.jsx';
import Footer from './components/Footer.jsx';

// Hallazgo "gsap se filtra al bundle principal" (auditoría 10 ago 2026):
// both of these are mounted unconditionally alongside <Routes>, not inside
// a route, so a plain static import shipped gsap (LoadingReveal directly,
// ProductPanel via lib/animations.js) in the main entry chunk on every
// single page — even /faq, which never touches either. Confirmed via a
// repo-wide grep for `from 'gsap'`/`lib/animations` that Gallery.jsx (the
// only other gsap consumer) is already inside a route App.jsx lazy-loads
// below, so it was never part of this bug — only these two needed the
// same treatment.
const LoadingReveal = lazy(() => import('./components/LoadingReveal.jsx'));
const ProductPanel = lazy(() => import('./components/ProductPanel.jsx'));

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
const Collection = lazy(() => import('./pages/Collection.jsx'));
const Product = lazy(() => import('./pages/Product.jsx'));
const Personalize = lazy(() => import('./pages/Personalize.jsx'));
const Search = lazy(() => import('./pages/Search.jsx'));
const MetodoRelieve = lazy(() => import('./pages/MetodoRelieve.jsx'));
const Shipping = lazy(() => import('./pages/Shipping.jsx'));
const Faq = lazy(() => import('./pages/Faq.jsx'));
const OrderStatus = lazy(() => import('./pages/OrderStatus.jsx'));
const PrivacyNotice = lazy(() => import('./pages/PrivacyNotice.jsx'));
const Terms = lazy(() => import('./pages/Terms.jsx'));
const AdminShip = lazy(() => import('./pages/AdminShip.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

function RouteFallback() {
  return (
    <p className="p-8 text-center font-label uppercase tracking-wide text-xs text-graphite/60">
      Cargando…
    </p>
  );
}

// Museográfico pass (11 ago 2026) — Footer moved to its own file
// (src/components/Footer.jsx), same mount point (outside <Routes>, so it
// still falls naturally after whatever each page paints), now with real
// navigation/contact/legal/social columns instead of a thin 2-link bar.
export default function App() {
  return (
    <>
      <SvgFilters />
      <PageStamp />
      <CustomCursor />
      <TrustBar />
      <Nav />
      <Suspense fallback={null}>
        <LoadingReveal />
      </Suspense>
      <CartDrawer />
      <Suspense fallback={null}>
        <ProductPanel />
      </Suspense>
      {/* apple-design audit (11 ago 2026) — /regalar (Gift.jsx) removed at
          Ale's direct request. It didn't share logic with the cart's own
          gift feature (isGift/giftMessage in CartContext/CartDrawer,
          untouched) and nothing else in the app linked to it. */}
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/colecciones" element={<Collections />} />
          <Route path="/coleccion/:slug" element={<Collection />} />
          <Route path="/pieza/:slug" element={<Product />} />
          <Route path="/personaliza" element={<Personalize />} />
          <Route path="/buscar" element={<Search />} />
          {/* 2026-08-09 hand-off §6 — /sobre retirado, se fusionó dentro de
              /metodo-relieve (#sobre); vercel.json redirige la ruta vieja. */}
          <Route path="/metodo-relieve" element={<MetodoRelieve />} />
          <Route path="/envios" element={<Shipping />} />
          <Route path="/faq" element={<Faq />} />
          {/* Must resolve before /pedido/:token below — Stripe's success_url
              lands here with ?session_id=, not a magic-link token. */}
          <Route path="/pedido/success" element={<OrderSuccess />} />
          <Route path="/pedido/:token" element={<OrderStatus />} />
          <Route path="/aviso-privacidad" element={<PrivacyNotice />} />
          <Route path="/terminos" element={<Terms />} />
          {/* Sin link en la nav — Ale la usa directo por URL guardada,
              handoff 8 ago 2026 sección 3.3 opción (b). Protegida por
              ADMIN_TOKEN server-side (lib/adminAuth.js), no por esta ruta. */}
          <Route path="/admin/envios" element={<AdminShip />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Footer />
    </>
  );
}
