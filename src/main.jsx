import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { PageWipeProvider } from './context/PageWipeContext.jsx';
import { ProductPanelProvider } from './context/ProductPanelContext.jsx';
import { GalleryViewProvider } from './context/GalleryViewContext.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <PageWipeProvider>
        <CartProvider>
          <ProductPanelProvider>
            <GalleryViewProvider>
              <App />
            </GalleryViewProvider>
          </ProductPanelProvider>
        </CartProvider>
      </PageWipeProvider>
    </BrowserRouter>
  </StrictMode>,
);
