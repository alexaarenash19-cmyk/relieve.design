import { Routes, Route } from 'react-router-dom';
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

export default function App() {
  return (
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
    </Routes>
  );
}
