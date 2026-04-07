import React, { createContext, useContext, useState, ReactNode } from 'react';

type WeatherTheme = 'sunny' | 'monsoon';

interface WeatherContextType {
  weather: WeatherTheme;
  setWeather: (weather: WeatherTheme) => void;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export function WeatherProvider({ children }: { children: ReactNode }) {
  const [weather, setWeather] = useState<WeatherTheme>('monsoon'); // Default to monsoon as per current theme

  return (
    <WeatherContext.Provider value={{ weather, setWeather }}>
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeather() {
  const context = useContext(WeatherContext);
  if (context === undefined) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
}
