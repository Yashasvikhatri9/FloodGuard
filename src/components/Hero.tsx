import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, AlertTriangle, CloudRain, Sun } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useWeather } from '../context/WeatherContext';

const Counter = ({ value, duration = 2 }: { value: number, duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    let totalMiliseconds = duration * 1000;
    let incrementTime = (totalMiliseconds / end);

    let timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start === end) clearInterval(timer);
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count}</span>;
};

const Typewriter = ({ text, delay = 0.05 }: { text: string, delay?: number }) => {
  const [currentText, setCurrentText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setCurrentText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, delay * 1000);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, delay, text]);

  return (
    <span className="inline-block">
      {currentText}
      <span className="animate-pulse border-r-2 border-white ml-1">&nbsp;</span>
    </span>
  );
};

export default function Hero() {
  const { weather } = useWeather();
  const heroText = "AI Powered Urban Flood Prediction";
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section id="home" ref={containerRef} className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Animated Background Elements */}
      <motion.div style={{ y, opacity }} className="absolute inset-0 z-0 pointer-events-none">
        <div className={`absolute inset-0 transition-opacity duration-1000 ${weather === 'sunny' ? 'bg-yellow-500/5' : 'bg-blue-500/5'}`}></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
        
        {/* Dynamic Glows */}
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 blur-[120px] rounded-full transition-colors duration-1000 ${
          weather === 'sunny' ? 'bg-yellow-500/20' : 'bg-purple-500/20'
        }`} />
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 blur-[120px] rounded-full transition-colors duration-1000 ${
          weather === 'sunny' ? 'bg-orange-500/10' : 'bg-blue-500/20'
        }`} />
      </motion.div>

      <motion.div 
        style={{ y: useTransform(scrollYProgress, [0, 1], [0, -30]) }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mb-6"
        >
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-500 ${
            weather === 'sunny' 
              ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' 
              : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
          }`}>
            {weather === 'sunny' ? <Sun className="w-4 h-4" /> : <CloudRain className="w-4 h-4" />}
            <span className="text-sm font-bold uppercase tracking-widest">
              {weather === 'sunny' ? 'Clear Skies' : 'Monsoon Alert'}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-purple-500/30 text-sm font-medium text-purple-300 mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          System Online: Monitoring <Counter value={124} /> Wards
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-extrabold tracking-tight leading-tight text-white mb-6 min-h-[1.2em]"
        >
          <Typewriter text={heroText} />
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="text-base sm:text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed px-4"
        >
          Predicting flood risks using AI, sensor data, and real-time city monitoring.
          Protecting communities with early warnings and actionable insights.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <a
            href="#dashboard"
            className="group relative px-8 py-4 rounded-full bg-white text-[#0D0221] font-bold text-lg hover:bg-gray-100 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
          >
            View Dashboard
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
          <a
            href="#report"
            className="group px-8 py-4 rounded-full glass-panel border border-red-500/30 text-red-400 font-bold text-lg hover:bg-red-500/10 transition-all flex items-center gap-2"
          >
            <AlertTriangle className="w-5 h-5" />
            Report Flood
          </a>
        </motion.div>
      </motion.div>

    </section>
  );
}

