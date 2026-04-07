import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Camera, MapPin, UploadCloud, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { db, useAuth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function ReportFlood() {
  const { user } = useAuth();
  const [severity, setSeverity] = useState('Medium');
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please sign in to submit a report.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'reports'), {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        description,
        location,
        severity,
        imageUrl: preview, // Storing base64 for now as a demo, in production use Firebase Storage
        status: 'Pending',
        createdAt: serverTimestamp(),
      });
      setIsSuccess(true);
      setDescription('');
      setLocation('');
      setPreview(null);
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reports');
    } finally {
      setIsSubmitting(false);
    }
  };

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
    <section id="report" className="py-24 bg-[#120A3A]/50 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-white mb-6"
          >
            Citizen <span className="text-gradient">Flood Reporting</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-gray-400"
          >
            Your reports help us improve our AI models and alert communities faster.
            Upload photos or videos to provide real-time ground truth data.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-panel p-8 md:p-10 rounded-3xl border border-white/10 shadow-[0_0_40px_rgba(139,92,246,0.1)]"
        >
          {isSuccess ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Report Submitted!</h3>
              <p className="text-gray-400">Thank you for contributing to community safety. Our AI is reviewing your report.</p>
              <button 
                onClick={() => setIsSuccess(false)}
                className="mt-6 text-purple-400 hover:text-purple-300 font-medium"
              >
                Submit another report
              </button>
            </motion.div>
          ) : (
            <form className="space-y-8" onSubmit={handleSubmit}>
              <motion.div 
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="grid md:grid-cols-2 gap-8"
              >
                <div className="space-y-6">
                  <motion.div variants={item}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                    <input
                      type="text"
                      disabled
                      value={user?.displayName || 'Anonymous'}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/50 cursor-not-allowed"
                    />
                  </motion.div>
                  <motion.div variants={item}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                        placeholder="Enter location or auto-detect..."
                      />
                      <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                      <button 
                        type="button" 
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition((pos) => {
                              setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
                            });
                          }
                        }}
                        className="absolute right-3 top-2.5 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium text-white transition-colors"
                      >
                        Locate Me
                      </button>
                    </div>
                  </motion.div>
                  <motion.div variants={item}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <textarea
                      rows={4}
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none"
                      placeholder="Describe the situation (e.g., water level up to knees, road blocked)..."
                    ></textarea>
                  </motion.div>
                </div>

                <div className="space-y-6">
                  <motion.div variants={item}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Severity Level</label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Low', 'Medium', 'High'].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setSeverity(level)}
                          className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                            severity === level
                              ? level === 'High' ? 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                                : level === 'Medium' ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                                : 'bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </motion.div>

                  <motion.div variants={item}>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Upload Photo/Video</label>
                    <div className="relative group">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className={`w-full h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden ${
                        preview ? 'border-purple-500' : 'border-white/20 group-hover:border-purple-500/50 bg-white/5 group-hover:bg-white/10'
                      }`}>
                        {preview ? (
                          <div className="relative w-full h-full">
                            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-white font-medium flex items-center gap-2">
                                <Camera className="w-5 h-5" /> Change Photo
                              </span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <UploadCloud className="w-10 h-10 text-gray-400 mb-3 group-hover:text-purple-400 transition-colors" />
                            <p className="text-sm text-gray-400 group-hover:text-gray-300">Drag & drop or click to upload</p>
                            <p className="text-xs text-gray-500 mt-1">Supports JPG, PNG, MP4 (Max 50MB)</p>
                          </>
                        )}
                      </div>
                    </div>
                    {preview && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 flex items-start gap-2 text-xs text-purple-300 bg-purple-500/10 p-3 rounded-lg border border-purple-500/20"
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <p>AI is analyzing the image to estimate water depth. This report will be prioritized based on findings.</p>
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="pt-6 border-t border-white/10 flex justify-end"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isSubmitting || !user}
                  type="submit"
                  className={`px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center gap-2 ${
                    isSubmitting || !user
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:shadow-[0_0_30px_rgba(139,92,246,0.8)]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      Submitting...
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </>
                  ) : (
                    <>
                      {user ? 'Submit Report' : 'Sign in to Report'}
                      <UploadCloud className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
