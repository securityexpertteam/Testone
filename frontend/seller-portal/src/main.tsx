import React from 'react';
import { createRoot } from 'react-dom/client';
import { SellerPortalModal } from '../../src/components/SellerPortalModal';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Seller workspace root element is missing');

createRoot(root).render(
  <React.StrictMode>
    <SellerPortalModal
      isOpen
      onClose={() => window.location.assign('https://akshayapatrawelfare.com/')}
    />
  </React.StrictMode>
);
