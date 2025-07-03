// theme/theme.ts
import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';

export const lightTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    background: '#FFFFFF',
    text: '#000000',
    surface: '#F5F5F5',
    primary: '#3C82F6',
    accent: '#FF6B6B',
    subtext: '#808080',
    card: '#FFF',
  },
};

export const darkTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    background: '#121212',
    text: '#FFFFFF',
    surface: '#1E1E1E',
    primary: '#3C82F6',
    accent: '#FF6B6B',
    subtext: '#B3B3B3',
    card: '#1C1C1C',
  },
};
