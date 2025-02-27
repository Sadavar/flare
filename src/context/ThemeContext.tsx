import React, { createContext, useContext } from 'react';

export const theme = {
    colors: {
        primary: '#FE3D14',
        background: '#131418',
        light_primary_1: '#FE6E4F',
        light_primary_2: '#FF9E8A',
        light_primary_3: '#FFCFC4',
        light_background_1: '#313135',
        light_background_2: '#7C7C7F',
        light_background_3: '#C4C4C5',
        text: '#E0E0E0',
        subtext: '#7C7C7F',
        border: '#313135',
        tabBar: '#313135',
        tabBarInactive: '#7C7C7F',
        searchBar: '#313135',
    },
};

type Theme = typeof theme;

interface ThemeContextType {
    theme: Theme;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: theme,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    return (
        <ThemeContext.Provider value={{ theme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext); 