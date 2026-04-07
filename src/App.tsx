/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Problem from './components/Problem';
import Solution from './components/Solution';
import Dashboard from './components/Dashboard';
import ReportFlood from './components/ReportFlood';
import Insights from './components/Insights';
import TechStack from './components/TechStack';
import FutureFeatures from './components/FutureFeatures';
import Contact from './components/Contact';
import RainBackground from './components/RainBackground';
import ScrollToTop from './components/ScrollToTop';
import { WeatherProvider } from './context/WeatherContext';

import { FirebaseProvider, ErrorBoundary } from './firebase';

export default function App() {
  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <WeatherProvider>
          <div className="min-h-screen bg-[#0D0221] text-white font-sans antialiased selection:bg-purple-500/30 overflow-x-hidden">
            <RainBackground />
            <Navbar />
            <main>
              <Hero />
              <Problem />
              <Solution />
              <Dashboard />
              <ReportFlood />
              <Insights />
              <TechStack />
              <FutureFeatures />
              <Contact />
            </main>
            <ScrollToTop />
          </div>
        </WeatherProvider>
      </FirebaseProvider>
    </ErrorBoundary>
  );
}
