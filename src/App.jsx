import { Routes, Route, Link } from 'react-router-dom';
import Nav from './components/Nav.jsx';
import CustomCursor from './components/CustomCursor.jsx';
import PageStamp from './components/PageStamp.jsx';
import Home from './pages/Home.jsx';
import Collection from './pages/Collection.jsx';
import Product from './pages/Product.jsx';
import Personalize from './pages/Personalize.jsx';
import Search from './pages/Search.jsx';
import About from './pages/About.jsx';
import Shipping from './pages/Shipping.jsx';
import Faq from './pages/Faq.jsx';
import Cart from './pages/Cart.jsx';
import OrderStatus from './pages/OrderStatus.jsx';
import PrivacyNotice from './pages/PrivacyNotice.jsx';
import Terms from './pages/Terms.jsx';

export default function App() {
  return (
    <>
      <PageStamp />
      <CustomCursor />
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/coleccion/:slug" element={<Collection />} />
        <Route path="/pieza/:slug" element={<Product />} />
        <Route path="/personaliza" element={<Personalize />} />
        <Route path="/buscar" element={<Search />} />
        <Route path="/sobre" element={<About />} />
        <Route path="/envios" element={<Shipping />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/carrito" element={<Cart />} />
        <Route path="/pedido/:token" element={<OrderStatus />} />
        <Route path="/aviso-privacidad" element={<PrivacyNotice />} />
        <Route path="/terminos" element={<Terms />} />
      </Routes>
      <footer className="font-label uppercase tracking-wide text-xs text-text/70 flex gap-6 justify-center p-8">
        <Link to="/aviso-privacidad" className="hover:underline">
          Aviso de privacidad
        </Link>
        <Link to="/terminos" className="hover:underline">
          Términos
        </Link>
      </footer>
    </>
  );
}
