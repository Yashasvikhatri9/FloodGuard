import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const rainfallData = [
  { time: '00:00', amount: 12 },
  { time: '04:00', amount: 25 },
  { time: '08:00', amount: 45 },
  { time: '12:00', amount: 80 },
  { time: '16:00', amount: 65 },
  { time: '20:00', amount: 30 },
  { time: '24:00', amount: 15 },
];

const riskData = [
  { day: 'Fri', risk: 25 },
  { day: 'Sat', risk: 15 },
  { day: 'Sun', risk: 10 },
  { day: 'Mon', risk: 20 },
  { day: 'Tue', risk: 35 },
  { day: 'Wed', risk: 85 },
  { day: 'Thu', risk: 60 },
];

export default function Insights() {
  const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 6);
  const dateRange = `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${nextWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  
  return (
    <section id="insights" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-white mb-6"
          >
            Metropolitan Flood <span className="text-gradient">Insights</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-gray-400 max-w-2xl mx-auto"
          >
            Predictive analytics for major urban centers as of <span className="text-blue-400 font-semibold">{currentDate}</span>.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="glass-panel p-6 rounded-2xl border border-white/10"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">24h Rainfall Forecast (mm)</h3>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">Next 24 Hours</span>
                <span className="text-[8px] text-blue-400/60 uppercase font-bold">Simulated Data</span>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rainfallData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="time" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#120A3A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glass-panel p-6 rounded-2xl border border-white/10"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">7-Day Flood Risk Probability (%)</h3>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">{dateRange}</span>
                <span className="text-[8px] text-pink-400/60 uppercase font-bold">Simulated Data</span>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={riskData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="day" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#120A3A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="risk" stroke="#EC4899" strokeWidth={3} dot={{ r: 4, fill: '#EC4899', strokeWidth: 2, stroke: '#120A3A' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] max-w-lg mx-auto leading-relaxed">
            * Data shown above is part of a predictive simulation model. Real-time accuracy depends on local sensor integration and historical data calibration.
          </p>
        </div>
      </div>
    </section>
  );
}
