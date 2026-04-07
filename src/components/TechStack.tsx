import { motion } from 'motion/react';
import { Cpu, Code, Database, Map, Cloud, Wifi } from 'lucide-react';

export default function TechStack() {
  const tech = [
    { icon: <Cpu className="w-12 h-12 text-purple-400" />, name: 'Artificial Intelligence', desc: 'Deep learning models for predictive analytics.' },
    { icon: <Code className="w-12 h-12 text-blue-400" />, name: 'Python & TensorFlow', desc: 'Core processing and machine learning frameworks.' },
    { icon: <Map className="w-12 h-12 text-green-400" />, name: 'GIS Mapping Tools', desc: 'Spatial data visualization and risk zoning.' },
    { icon: <Cloud className="w-12 h-12 text-cyan-400" />, name: 'Cloud Infrastructure', desc: 'Scalable backend for real-time data processing.' },
    { icon: <Wifi className="w-12 h-12 text-pink-400" />, name: 'IoT Sensors', desc: 'Network of water level and rainfall monitors.' },
    { icon: <Database className="w-12 h-12 text-orange-400" />, name: 'Big Data Analytics', desc: 'Processing historical and real-time climate data.' },
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
    hidden: { opacity: 0, scale: 0.9 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
  };

  return (
    <section className="py-24 bg-[#0D0221] relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-white mb-6"
          >
            Powered by <span className="text-gradient">Advanced Technology</span>
          </motion.h2>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-3 gap-8"
        >
          {tech.map((itemTech, index) => (
            <motion.div
              key={index}
              variants={item}
              whileHover={{ y: -5, scale: 1.05 }}
              className="flex flex-col items-center text-center p-6 glass-panel rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10">
                <div className="mb-4 group-hover:scale-110 transition-transform duration-300">
                  {itemTech.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">{itemTech.name}</h3>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{itemTech.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

