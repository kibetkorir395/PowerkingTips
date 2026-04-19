import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PriceProvider } from './context/PriceContext';
import App from './App';
import './App.scss';

// Performance monitoring (optional)
const reportWebVitals = (metric) => {
  console.log(metric);
  // Send to analytics if needed
};

const root = createRoot(document.getElementById('root'));

root.render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PriceProvider>
          <App />
        </PriceProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);

// Report web vitals
reportWebVitals(console.log);