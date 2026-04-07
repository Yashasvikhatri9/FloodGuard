import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, animate } from 'motion/react';
import { ShieldAlert, Menu, X, Sun, CloudRain, LogIn, LogOut, User, Loader2 } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { useAuth } from '../firebase';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signIn, signOut, authLoading } = useAuth();

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const { weather, setWeather } = useWeather();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const smoothScrollTo = (targetY: number) => {
    const startY = window.scrollY;
    animate(startY, targetY, {
      type: "spring",
      stiffness: 120, // Faster, more responsive
      damping: 24,
      mass: 0.5,
      restDelta: 0.5,
      onUpdate: (latest) => window.scrollTo(0, latest),
    });
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (href === '#home') {
      smoothScrollTo(0);
    } else {
      const targetId = href.replace('#', '');
      const elem = document.getElementById(targetId);
      if (elem) {
        const offset = 80; // Navbar height
        const elementPosition = elem.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;
        smoothScrollTo(offsetPosition);
      }
    }
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'What We Do', href: '#problem' },
    { name: 'Technology', href: '#solution' },
    { name: 'Dashboard', href: '#dashboard' },
    { name: 'Insights', href: '#insights' },
    { name: 'Future Features', href: '#future-features' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-[#0D0221]/80 backdrop-blur-md border-b border-white/10 py-4' : 'bg-transparent py-6'
      }`}
    >
      {/* Scroll Progress Bar */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 origin-left z-50 shadow-[0_0_10px_rgba(168,85,247,0.8)]" 
        style={{ scaleX }} 
      />
      
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center gap-4">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 shrink-0"
        >
          <ShieldAlert className="w-8 h-8 text-blue-500" />
          <span className="text-2xl font-heading font-bold tracking-tight text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">
            Flood
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              Guard
            </span>
          </span>
        </motion.div>

        {/* Desktop Nav Links - Centered */}
        <div className="hidden xl:flex items-center justify-center flex-1 px-8">
          <div className="flex items-center gap-8">
            {navLinks.map((link, i) => (
              <motion.a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors relative group whitespace-nowrap"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 transition-all group-hover:w-full"></span>
              </motion.a>
            ))}
          </div>
        </div>

        {/* Desktop Action Buttons - Right */}
        <div className="hidden md:flex items-center gap-4 shrink-0">
          {/* Weather Toggle */}
          <motion.button
            onClick={() => setWeather(weather === 'sunny' ? 'monsoon' : 'sunny')}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`p-2.5 rounded-full border transition-all flex items-center gap-2 whitespace-nowrap ${
              weather === 'sunny' 
                ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]' 
                : 'bg-blue-500/20 border-blue-500/50 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
            }`}
            title={`Switch to ${weather === 'sunny' ? 'Monsoon' : 'Sunny'} Mode`}
          >
            {weather === 'sunny' ? <Sun className="w-5 h-5" /> : <CloudRain className="w-5 h-5" />}
            <span className="text-xs font-bold uppercase tracking-tighter">
              {weather === 'sunny' ? 'Sunny' : 'Monsoon'}
            </span>
          </motion.button>

          <motion.a
            href="#report"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:from-purple-500 hover:to-blue-500 transition-all shadow-[0_0_15px_rgba(139,92,246,0.5)] hover:shadow-[0_0_25px_rgba(139,92,246,0.8)] whitespace-nowrap flex items-center justify-center"
          >
            Report Flood
          </motion.a>

          {user ? (
            <div className="flex items-center gap-3 ml-2">
              <div className="flex flex-col items-end justify-center">
                <span className="text-xs font-bold text-white leading-none">{user.displayName?.split(' ')[0]}</span>
                <button 
                  onClick={signOut}
                  disabled={authLoading}
                  className="text-[10px] text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1 mt-0.5 disabled:opacity-50"
                >
                  <LogOut className="w-2.5 h-2.5" /> Sign Out
                </button>
              </div>
              {user.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-white/20 object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </div>
          ) : (
            <motion.button
              onClick={signIn}
              disabled={authLoading}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 text-white hover:bg-white/10 transition-all text-sm font-medium whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {authLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {authLoading ? 'Signing in...' : 'Sign In'}
            </motion.button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-gray-300 hover:text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden absolute top-full left-0 right-0 bg-[#120A3A] border-b border-white/10 py-4 px-4 flex flex-col gap-4 overflow-hidden"
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-base font-medium text-gray-300 hover:text-white"
                onClick={(e) => handleNavClick(e, link.href)}
              >
                {link.name}
              </a>
            ))}
            
            {/* Mobile Weather Toggle */}
            <button
              onClick={() => setWeather(weather === 'sunny' ? 'monsoon' : 'sunny')}
              className={`flex items-center justify-between px-6 py-3 rounded-full border transition-all ${
                weather === 'sunny' 
                  ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' 
                  : 'bg-blue-500/10 border-blue-500/30 text-blue-500'
              }`}
            >
              <span className="font-bold uppercase tracking-widest text-sm">
                Weather: {weather === 'sunny' ? 'Sunny' : 'Monsoon'}
              </span>
              {weather === 'sunny' ? <Sun className="w-5 h-5" /> : <CloudRain className="w-5 h-5" />}
            </button>

            <a
              href="#report"
              className="text-center px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium shadow-[0_0_15px_rgba(139,92,246,0.5)]"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Report Flood
            </a>

            {user ? (
              <button
                onClick={() => {
                  signOut();
                  setIsMobileMenuOpen(false);
                }}
                disabled={authLoading}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-red-500/30 text-red-400 font-medium disabled:opacity-50"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => {
                  signIn();
                  setIsMobileMenuOpen(false);
                }}
                disabled={authLoading}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-white/20 text-white font-medium disabled:opacity-50"
              >
                {authLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <LogIn className="w-5 h-5" />
                )}
                {authLoading ? 'Signing in...' : 'Sign In with Google'}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

