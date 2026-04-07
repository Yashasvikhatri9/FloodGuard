import { motion } from 'motion/react';
import { CloudRain, Waves, AlertOctagon } from 'lucide-react';

export default function Problem() {
  const problems = [
    {
      icon: <CloudRain className="w-10 h-10 text-blue-400" />,
      title: 'Extreme Weather',
      description: 'Climate change is causing more frequent and intense rainfall events, overwhelming city infrastructure.',
    },
    {
      icon: <Waves className="w-10 h-10 text-cyan-400" />,
      title: 'Poor Drainage',
      description: 'Aging and inadequate drainage systems fail to channel water away from populated areas effectively.',
    },
    {
      icon: <AlertOctagon className="w-10 h-10 text-red-400" />,
      title: 'Lack of Early Warning',
      description: 'Without predictive systems, authorities and citizens are caught off guard, leading to property damage and loss of life.',
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <section id="problem" className="py-24 bg-[#120A3A]/50 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-white mb-6"
          >
            The Growing Challenge of <br />
            <span className="text-gradient">Urban Flooding</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-gray-400"
          >
            Urban flooding is a devastating consequence of rapid urbanization and climate change.
            Traditional monitoring systems are reactive, not proactive. We need a smarter way to predict and prepare.
          </motion.p>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8"
        >
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              variants={item}
              whileHover={{ y: -10, scale: 1.02 }}
              className="glass-panel p-8 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all group relative overflow-hidden"
            >
              {/* Card Glow Effect */}
              <div className="absolute -inset-px bg-gradient-to-br from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-300">
                  {problem.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-purple-300 transition-colors">{problem.title}</h3>
                <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">{problem.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

