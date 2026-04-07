import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Satellite, Smartphone, Bell, Brain, Building2, CheckCircle2, X } from 'lucide-react';

export default function FutureFeatures() {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const features = [
    { icon: <Satellite className="w-6 h-6" />, title: 'Satellite Flood Detection', desc: 'Real-time satellite imagery analysis to detect rising water levels in remote areas.' },
    { icon: <Smartphone className="w-6 h-6" />, title: 'Mobile Flood Reporting App', desc: 'A dedicated mobile app for citizens to report floods with GPS and photos.' },
    { icon: <Bell className="w-6 h-6" />, title: 'Automated Emergency Alerts', desc: 'Direct integration with local emergency services for instant SMS and app alerts.' },
    { icon: <Brain className="w-6 h-6" />, title: 'Advanced AI Prediction Models', desc: 'Next-gen ML models incorporating satellite data and urban drainage simulations.' },
    { icon: <Building2 className="w-6 h-6" />, title: 'Govt Disaster System Integration', desc: 'Seamless data sharing with government disaster management agencies.' },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section id="future-features" className="py-24 bg-[#120A3A]/50 relative border-t border-white/5">
      <AnimatePresence>
        {selectedFeature && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedFeature(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative glass-panel p-8 rounded-3xl border border-blue-500/50 shadow-[0_0_50px_rgba(59,130,246,0.3)] flex flex-col items-center text-center max-w-sm w-full"
            >
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-6">
                <Satellite className="w-8 h-8 text-blue-400" />
              </div>
              <h4 className="text-2xl font-bold text-white mb-2">Coming Soon</h4>
              <p className="text-blue-400 font-medium mb-4">{selectedFeature}</p>
              <p className="text-gray-400 mb-8">
                {features.find(f => f.title === selectedFeature)?.desc}
              </p>
              <button 
                onClick={() => setSelectedFeature(null)}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all"
              >
                Awesome!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-white mb-6"
          >
            The Future of <span className="text-gradient">FloodGuard</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-gray-400 max-w-2xl mx-auto"
          >
            We are continuously evolving to build more resilient cities. Here is what's coming next on our roadmap.
          </motion.p>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-4"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={item}
              onClick={() => setSelectedFeature(feature.title)}
              whileHover={{ 
                y: -5, 
                scale: 1.05,
                borderColor: 'rgba(139, 92, 246, 0.5)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }}
              className="flex items-center gap-3 px-6 py-4 rounded-full glass-panel border border-white/10 text-gray-300 hover:text-white transition-all cursor-pointer"
            >
              <motion.span 
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: index * 0.5 }}
                className="text-purple-400"
              >
                {feature.icon}
              </motion.span>
              <span className="font-medium">{feature.title}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

