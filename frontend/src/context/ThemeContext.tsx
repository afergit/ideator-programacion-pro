import React, { createContext, useContext } from 'react';

interface ThemeContextType {
  primaryColor: string;
}

const ThemeContext = createContext<ThemeContextType>({
  primaryColor: '#2457E6',
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeContext.Provider value={{ primaryColor: '#2457E6' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
