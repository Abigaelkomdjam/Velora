// theme/ThemeContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { Appearance } from 'react-native';
import { darkTheme, lightTheme } from './theme';

type ThemeType = 'light' | 'dark';

const ThemeContext = createContext<{
  theme: typeof lightTheme;
  mode: ThemeType;
  toggleTheme: () => void;
}>({
  theme: lightTheme,
  mode: 'light',
  toggleTheme: () => {},
});

export const useAppTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemTheme = Appearance.getColorScheme();
  const [mode, setMode] = useState<ThemeType>(systemTheme === 'dark' ? 'dark' : 'light');

  const toggleTheme = () => setMode(prev => (prev === 'dark' ? 'light' : 'dark'));

  const theme = mode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
