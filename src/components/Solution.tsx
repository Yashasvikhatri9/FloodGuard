import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrainCircuit, Activity, Map, BellRing, Search, MapPin } from 'lucide-react';

const getWeatherCondition = (code: number) => {
  if (code === 0) return 'Clear sky';
  if (code === 1 || code === 2 || code === 3) return 'Partly cloudy';
  if (code === 45 || code === 48) return 'Fog';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 65) return 'Rain';
  if (code >= 71 && code <= 75) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Unknown';
};

export default function Solution() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState({
    name: 'Kolkata, India',
    temp: '28°C',
    condition: 'Mostly Clear',
    humidity: '65%',
    wind: '12 km/h',
    visibility: '8 km'
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setIsLoading(true);
        try {
          // Fetch results via server proxy to avoid CORS
          const res = await fetch(`/api/geocoding?name=${searchQuery}`);
          const data = await res.json();
          
          if (data.results) {
            setSearchResults(data.results);
          } else {
            setSearchResults([]);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectCity = async (city: any) => {
    const cityName = `${city.name}, ${city.country || ''}`.replace(/,\s*$/, '');
    setSearchQuery('');
    setShowDropdown(false);
    setSelectedCity(prev => ({ ...prev, name: cityName, condition: 'Loading...' }));

    try {
      const res = await fetch(`/api/weather?lat=${city.latitude}&lon=${city.longitude}`);
      const data = await res.json();
      const current = data.current;
      
      setSelectedCity({
        name: cityName,
        temp: `${Math.round(current.temperature_2m)}°C`,
        condition: getWeatherCondition(current.weather_code),
        humidity: `${current.relative_humidity_2m}%`,
        wind: `${Math.round(current.wind_speed_10m)} km/h`,
        visibility: current.visibility ? `${(current.visibility / 1000).toFixed(1)} km` : 'N/A'
      });
    } catch (e) {
      console.error(e);
      setSelectedCity(prev => ({ ...prev, condition: 'Error loading data' }));
    }
  };

  const steps = [
    {
      icon: <Activity className="w-8 h-8 text-blue-400" />,
      title: 'Real-Time Data Collection',
      desc: 'IoT sensors placed across the city continuously monitor water levels, rainfall, and drainage flow.',
    },
    {
      icon: <BrainCircuit className="w-8 h-8 text-purple-400" />,
      title: 'AI Prediction Engine',
      desc: 'Machine learning models analyze historical data and current sensor readings to predict flood probabilities.',
    },
    {
      icon: <Map className="w-8 h-8 text-pink-400" />,
      title: 'GIS Risk Mapping',
      desc: 'Predictions are visualized on interactive city maps, highlighting high-risk zones and safe routes.',
    },
    {
      icon: <BellRing className="w-8 h-8 text-red-400" />,
      title: 'Early Warning Alerts',
      desc: 'Automated alerts are sent to authorities and citizens, providing crucial time to prepare and evacuate.',
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { duration: 0.5 } }
  };

  return (
    <section id="solution" className="py-24 relative overflow-hidden">
      <div className="absolute top-1/2 right-0 w-1/2 h-full bg-gradient-to-l from-purple-900/20 to-transparent pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-white mb-6"
            >
              Real-Time <br />
              <span className="text-gradient">Weather Monitoring</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-gray-400 mb-10 leading-relaxed"
            >
              FloodGuard transforms reactive disaster management into proactive risk mitigation.
              By combining real-time sensor networks with advanced AI, we provide accurate,
              localized flood forecasts hours before the water rises.
            </motion.p>

            <motion.div 
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="space-y-8"
            >
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  variants={item}
                  className="flex gap-4 group"
                >
                  <div className="flex-shrink-0 w-14 h-14 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-purple-500/50 group-hover:bg-purple-500/10 transition-all duration-300">
                    <div className="group-hover:scale-110 transition-transform duration-300">
                      {step.icon}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">{step.title}</h4>
                    <p className="text-gray-400 group-hover:text-gray-300 transition-colors">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative h-[400px] md:h-[600px] rounded-3xl overflow-hidden glass-panel border border-purple-500/20 group"
          >
            {/* Weather App Mockup Image */}
            <img 
              src="https://images.unsplash.com/photo-1516912481808-3406841bd33c?auto=format&fit=crop&w=1000&q=80" 
              alt="Weather App Background" 
              className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-1000"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D0221] via-[#0D0221]/40 to-transparent"></div>
            
            <div className="absolute bottom-8 left-8 right-8">
              <div className="glass-panel p-6 rounded-2xl border border-white/10 backdrop-blur-xl bg-black/40">
                <div className="flex flex-col gap-4">
                  {/* City Search Bar */}
                  <div className="relative" ref={dropdownRef}>
                    <input 
                      type="text" 
                      placeholder="Search city (e.g., Mumbai, Delhi)..." 
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-gray-400"
                    />
                    <div className="absolute right-3 top-3 text-gray-400">
                      <Search className="w-5 h-5" />
                    </div>

                    {/* Dropdown */}
                    <AnimatePresence>
                      {showDropdown && searchQuery.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-full left-0 right-0 mb-2 bg-[#1A103C] border border-white/20 rounded-xl overflow-hidden z-50 shadow-2xl backdrop-blur-xl max-h-60 overflow-y-auto"
                        >
                          {isLoading ? (
                            <div className="px-4 py-3 text-sm text-gray-400">Searching...</div>
                          ) : searchQuery.length < 3 ? (
                            <div className="px-4 py-3 text-sm text-gray-400">Type at least 3 characters...</div>
                          ) : searchResults.length > 0 ? (
                            searchResults.map((city, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSelectCity(city)}
                                className="w-full text-left px-4 py-3 hover:bg-white/10 text-sm text-gray-200 hover:text-white transition-colors flex items-center gap-3 border-b border-white/5 last:border-0"
                              >
                                <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                <div className="flex flex-col">
                                  <span>{city.name}</span>
                                  {city.admin1 || city.country ? (
                                    <span className="text-[10px] text-gray-400">
                                      {[city.admin1, city.country].filter(Boolean).join(', ')}
                                    </span>
                                  ) : null}
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-gray-500">No cities found</div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Activity className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h5 className="text-white font-bold text-lg">{selectedCity.name}</h5>
                        <p className="text-xs text-gray-400">Localized weather tracking</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-white">{selectedCity.temp}</span>
                      <p className="text-[10px] text-blue-400 uppercase tracking-wider font-bold mt-1">{selectedCity.condition}</p>
                    </div>
                  </div>

                  {/* Weather Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/10">
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Humidity</p>
                      <p className="text-sm font-bold text-white">{selectedCity.humidity}</p>
                    </div>
                    <div className="text-center border-x border-white/10">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Wind</p>
                      <p className="text-sm font-bold text-white">{selectedCity.wind}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Visibility</p>
                      <p className="text-sm font-bold text-white">{selectedCity.visibility}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

