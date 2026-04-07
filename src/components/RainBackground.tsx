import React from 'react';
import { useWeather } from '../context/WeatherContext';

export default function RainBackground() {
  const { weather } = useWeather();
  const drops = Array.from({ length: 100 });

  if (weather === 'sunny') {
    return (
      <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden bg-gradient-to-b from-blue-900/20 to-transparent">
        <div className="absolute top-20 right-20 w-64 h-64 bg-yellow-500/10 blur-[100px] rounded-full" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      <div className="fog-layer top-0" style={{ opacity: 0.5 }} />
      <div className="fog-layer bottom-0" style={{ opacity: 0.3, animationDelay: '-30s' }} />
      <div className="lightning-flash" />
      {drops.map((_, i) => (
        <div
          key={i}
          className="rain-drop"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${0.5 + Math.random() * 1.5}s`,
            animationDelay: `${Math.random() * 2}s`,
            opacity: 0.2 + Math.random() * 0.5,
          }}
        />
      ))}
    </div>
  );
}
