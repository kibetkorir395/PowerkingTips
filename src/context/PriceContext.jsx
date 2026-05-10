import { createContext, useContext, useState, useCallback } from 'react';

const PriceContext = createContext(null);

export const usePrice = () => {
  const context = useContext(PriceContext);
  if (!context) throw new Error('usePrice must be used within PriceProvider');
  return context;
};

export const PriceProvider = ({ children }) => {
  const [price, setPrice] = useState(800);
  const [plan, setPlan] = useState('weekly');

  const updatePlan = useCallback((newPrice, newPlan) => {
    setPrice(newPrice);
    setPlan(newPlan);
  }, []);

  return (
    <PriceContext.Provider value={{ price, plan, setPrice: updatePlan }}>
      {children}
    </PriceContext.Provider>
  );
};
