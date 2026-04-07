import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, ArrowRight, ShieldAlert, CheckCircle2, X } from 'lucide-react';

export default function Contact() {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'contact' | 'join'>('contact');

  const handleAction = (type: 'contact' | 'join') => {
    setFeedbackType(type);
    setShowFeedback(true);
  };

  return (
    <section id="contact" className="py-24 bg-[#0D0221] relative border-t border-white/5">
      <AnimatePresence>
        {showFeedback && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFeedback(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative glass-panel p-8 rounded-3xl border border-purple-500/50 shadow-[0_0_50px_rgba(139,92,246,0.3)] flex flex-col items-center text-center max-w-sm w-full"
            >
              <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-purple-400" />
              </div>
              <h4 className="text-2xl font-bold text-white mb-2">
                {feedbackType === 'contact' ? 'Message Received' : 'Application Sent'}
              </h4>
              <p className="text-gray-400 mb-8">
                {feedbackType === 'contact' 
                  ? "Thank you for reaching out! Our team will contact you within 24 hours to discuss how we can work together."
                  : "We're excited to have you! We'll review your profile and get back to you soon regarding your interest in the project."}
              </p>
              <button 
                onClick={() => setShowFeedback(false)}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all"
              >
                Got it!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(139,92,246,0.1)_0%,transparent_50%)] pointer-events-none"></div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="glass-panel p-12 rounded-[3rem] border border-white/10 shadow-[0_0_50px_rgba(139,92,246,0.1)]"
        >
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_20px_rgba(139,92,246,0.5)]">
            <ShieldAlert className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-white mb-6">
            Building Flood Resilient <span className="text-gradient">Cities</span>
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Partner with us to implement AI-powered flood prediction in your municipality.
            Together, we can protect communities and save lives.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.button 
              onClick={() => handleAction('contact')}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-full bg-white text-[#0D0221] font-bold text-lg hover:bg-gray-100 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
            >
              <Mail className="w-5 h-5" />
              Contact Us
            </motion.button>
            <motion.button 
              onClick={() => handleAction('join')}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="group px-8 py-4 rounded-full glass-panel border border-purple-500/30 text-purple-300 font-bold text-lg hover:bg-purple-500/10 transition-all flex items-center gap-2"
            >
              Join the Project
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </motion.div>

        <div className="mt-24 text-gray-500 text-sm flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-gray-600" />
            <span className="font-heading font-bold text-gray-400">FloodGuard</span>
          </div>
          <p>&copy; {new Date().getFullYear()} FloodGuard AI. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </section>
  );
}
