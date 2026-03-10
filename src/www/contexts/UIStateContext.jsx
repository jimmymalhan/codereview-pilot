import React, { createContext, useState } from 'react';

export const UIStateContext = createContext();

export function UIStateProvider({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <UIStateContext.Provider
      value={{
        mobileMenuOpen,
        toggleMobileMenu,
        closeMobileMenu,
        activeSection,
        setActiveSection,
      }}
    >
      {children}
    </UIStateContext.Provider>
  );
}

// Custom hook for using UI state
export function useUIState() {
  const context = React.useContext(UIStateContext);
  if (!context) {
    throw new Error('useUIState must be used within UIStateProvider');
  }
  return context;
}
