import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Nav from './components/Nav.jsx';
import CustomCursor from './components/CustomCursor.jsx';
import PageStamp from './components/PageStamp.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import SvgFilters from './components/SvgFilters.jsx';
import SocialLinks from './components/SocialLinks.jsx';
import Home from './pages/Home.jsx';
import Collections from './pages/Collections.jsx';
import Collection from './pages/Collection.jsx';
import Product from './pages/Product.jsx';
import Personalize from './pages/Personalize.jsx';
import Search from './pages/Search.jsx';
import About from './pages/About.jsx';
import Shipping from './pages/Shipping.jsx';
import Faq from './pages/Faq.jsx';
import OrderStatus from './pages/OrderStatus.jsx';
import PrivacyNotice from './pages/PrivacyNotice.jsx';
import Terms from './pages/Terms.jsx';
import NotFound from './pages/NotFound.jsx';

function Footer() {
  // No footer anywhere on the home page — not just the experience view —
  // per explicit request. Every other route keeps it.
  const location = useLocation();
  if (location.pathname === '/') return null;

  return (
    <footer className="font-label uppercase tracking-wide text-xs text-graphite/70 flex items-center justify-center gap-6 p-8">
      <Link to="/aviso-privacidad" className="hover:text-passport-ink hover:underline">
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
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/colecciones" element={<Collections />} />
        <Route path="/coleccion/:slug" element={<Collection />} />
        <Route path="/pieza/:slug" element={<Product />} />
        <Route path="/personaliza" element={<Personalize />} />
        <Route path="/buscar" element={<Search />} />
        <Route path="/sobre" element={<About />} />
        <Route path="/envios" element={<Shipping />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/pedido/:token" element={<OrderStatus />} />
        <Route path="/aviso-privacidad" element={<PrivacyNotice />} />
        <Route path="/terminos" element={<Terms />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  );
}
