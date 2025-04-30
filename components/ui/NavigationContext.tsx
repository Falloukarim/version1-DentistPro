'use client';

import { createContext, useContext, useState } from 'react';

type NavigationContextType = {
  isNavigating: boolean;
  setNavigating: (isNavigating: boolean) => void;
};

const NavigationContext = createContext<NavigationContextType>({
  isNavigating: false,
  setNavigating: () => {},
});

export const useNavigation = () => useContext(NavigationContext);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [isNavigating, setNavigating] = useState(false);

  return (
    <NavigationContext.Provider value={{ isNavigating, setNavigating }}>
      {children}
    </NavigationContext.Provider>
  );
}