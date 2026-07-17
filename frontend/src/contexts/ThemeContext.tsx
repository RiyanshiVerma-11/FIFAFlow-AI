import React, { createContext, useContext, useState, useEffect } from 'react';

type ColorblindType = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
type TextSizeType = 'normal' | 'large';

interface ThemeContextProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  dyslexiaMode: boolean;
  toggleDyslexiaMode: () => void;
  colorblindMode: ColorblindType;
  setColorblindMode: (mode: ColorblindType) => void;
  highContrast: boolean;
  toggleHighContrast: () => void;
  textSize: TextSizeType;
  setTextSize: (size: TextSizeType) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>(
    (localStorage.getItem('theme') as 'dark' | 'light') || 'light'
  );
  const [dyslexiaMode, setDyslexiaMode] = useState<boolean>(
    localStorage.getItem('dyslexia') === 'true'
  );
  const [colorblindMode, setColorblindModeState] = useState<ColorblindType>(
    (localStorage.getItem('colorblind') as ColorblindType) || 'none'
  );
  const [highContrast, setHighContrast] = useState<boolean>(
    localStorage.getItem('highContrast') === 'true'
  );
  const [textSize, setTextSizeState] = useState<TextSizeType>(
    (localStorage.getItem('textSize') as TextSizeType) || 'normal'
  );

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  const toggleDyslexiaMode = () => setDyslexiaMode(prev => !prev);
  const toggleHighContrast = () => setHighContrast(prev => !prev);
  const setColorblindMode = (mode: ColorblindType) => setColorblindModeState(mode);
  const setTextSize = (size: TextSizeType) => setTextSizeState(size);

  useEffect(() => {
    // Sync class modifications to Root HTML element
    const root = window.document.documentElement;
    
    // Theme
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
    
    // Dyslexia
    if (dyslexiaMode) {
      root.classList.add('accessibility-dyslexia');
    } else {
      root.classList.remove('accessibility-dyslexia');
    }
    localStorage.setItem('dyslexia', String(dyslexiaMode));

    // Colorblind
    root.classList.remove('colorblind-protanopia', 'colorblind-deuteranopia', 'colorblind-tritanopia');
    if (colorblindMode !== 'none') {
      root.classList.add(`colorblind-${colorblindMode}`);
    }
    localStorage.setItem('colorblind', colorblindMode);

    // High Contrast
    if (highContrast) {
      root.classList.add('contrast-high');
    } else {
      root.classList.remove('contrast-high');
    }
    localStorage.setItem('highContrast', String(highContrast));

    // Text Size
    root.classList.remove('text-lg');
    if (textSize === 'large') {
      root.classList.add('text-lg');
    }
    localStorage.setItem('textSize', textSize);

  }, [theme, dyslexiaMode, colorblindMode, highContrast, textSize]);

  return (
    <ThemeContext.Provider value={{
      theme, toggleTheme,
      dyslexiaMode, toggleDyslexiaMode,
      colorblindMode, setColorblindMode,
      highContrast, toggleHighContrast,
      textSize, setTextSize
    }}>
      {children}
      {/* SVG Colorblindness Filters overlay matrix configuration */}
      <svg className="hidden">
        <defs>
          {/* Protanopia (Red Weakness) */}
          <filter id="protanopia-filter">
            <feColorMatrix type="matrix" values="0.567, 0.433, 0, 0, 0, 0.558, 0.442, 0, 0, 0, 0, 0.242, 0.758, 0, 0, 0, 0, 0, 1, 0" />
          </filter>
          {/* Deuteranopia (Green Weakness) */}
          <filter id="deuteranopia-filter">
            <feColorMatrix type="matrix" values="0.625, 0.375, 0, 0, 0, 0.7, 0.3, 0, 0, 0, 0, 0.3, 0.7, 0, 0, 0, 0, 0, 1, 0" />
          </filter>
          {/* Tritanopia (Blue Weakness) */}
          <filter id="tritanopia-filter">
            <feColorMatrix type="matrix" values="0.95, 0.05,  0, 0, 0, 0,  0.433, 0.567, 0, 0, 0,  0.475, 0.525, 0, 0, 0,  0, 0, 1, 0" />
          </filter>
        </defs>
      </svg>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
