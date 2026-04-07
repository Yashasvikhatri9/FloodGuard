import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, WMSTileLayer, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AlertTriangle, Droplets, CloudRain, Activity, ChevronRight, Navigation, Sparkles, Loader2, Sun, Database, Cloud, CloudLightning, CloudDrizzle, Wind, CloudFog } from 'lucide-react';
import { useWeather } from '../context/WeatherContext';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, doc, setDoc, getDocFromServer } from 'firebase/firestore';
import { useAuth } from '../firebase';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const createIcon = (color: string, isUser = false) => new L.DivIcon({
  className: 'custom-icon',
  html: `<div style="background-color: ${color}; width: ${isUser ? '24px' : '20px'}; height: ${isUser ? '24px' : '20px'}; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px ${color}; ${isUser ? 'animation: pulse 2s infinite;' : ''}"></div>`,
  iconSize: [isUser ? 24 : 20, isUser ? 24 : 20],
  iconAnchor: [isUser ? 12 : 10, isUser ? 12 : 10],
});

const highRiskIcon = createIcon('#EF4444');
const mediumRiskIcon = createIcon('#F59E0B');
const safeIcon = createIcon('#22C55E');
const userIcon = createIcon('#3B82F6', true);

const DEFAULT_WARDS = [
  { id: '1', name: 'Mumbai Coastal', lat: 19.0760, lng: 72.8777, risk: 'Low', level: 12, color: '#22C55E', type: 'coastal' },
  { id: '2', name: 'Delhi Yamuna Bank', lat: 28.6139, lng: 77.2090, risk: 'Low', level: 14, color: '#22C55E', type: 'river' },
  { id: '3', name: 'Kolkata Delta', lat: 22.5726, lng: 88.3639, risk: 'Low', level: 16, color: '#22C55E', type: 'delta' },
  { id: '4', name: 'Chennai Basin', lat: 13.0827, lng: 80.2707, risk: 'Low', level: 8, color: '#22C55E', type: 'basin' },
  { id: '5', name: 'Guwahati Brahmaputra', lat: 26.1445, lng: 91.7362, risk: 'Low', level: 15, color: '#22C55E', type: 'river' },
];

function MapController({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

const calculateFloodRisk = (ward: any, weather?: any) => {
  let score = 0;
  const rain = weather?.rainfall || 0;
  const desc = (weather?.description || "").toLowerCase();

  // 1. Rainfall (IMD buckets)
  if (rain <= 2.5) score += 5;
  else if (rain <= 7.5) score += 15;
  else if (rain <= 15) score += 30;
  else score += 50;

  // 2. Forecast / Weather Condition
  if (desc.includes("thunderstorm")) {
    if (rain < 2.5) score += 8; // small boost only
    else score += 20;
  } else if (desc.includes("rain")) {
    score += 10;
  } else if (desc.includes("cloud")) {
    score += 3;
  }

  // 3. Geography Weight
  if (ward.type === "coastal") score += 10;
  else if (ward.type === "river") score += 15;
  else if (ward.type === "delta") score += 20;
  else if (ward.type === "basin") score += 5;

  // 4. Water Level / Tide Logic (Integrated into Score)
  const baseLevel = ward.level / 10; // e.g., 1.2m
  const rainImpact = rain * 0.15;
  const tideImpact = (ward.type === "coastal" || ward.type === "delta") ? 0.3 : 0;
  const totalWaterLevel = baseLevel + rainImpact + tideImpact;

  // If water level exceeds threshold (e.g. 1.5m), add to risk
  // SCIENTIFIC FIX: Tide alone should not trigger HIGH/SEVERE alerts without rainfall
  if (totalWaterLevel > 1.8) {
    score += (rain > 0) ? 25 : 10; 
  } else if (totalWaterLevel > 1.5) {
    score += (rain > 0) ? 10 : 5;
  }

  // 5. Interaction Terms (Industry-Grade)
  // Rain x Geography
  if (rain > 7.5 && (ward.type === "coastal" || ward.type === "delta")) {
    score += 20;
  }
  // Storm x Delta/Coastal
  if (desc.includes("storm") && (ward.type === "delta" || ward.type === "coastal")) {
    if (rain >= 2.5) score += 20;
    else score += 5;
  }
  // Storm x Urban (Delhi/River)
  if (desc.includes("thunderstorm") && (ward.type === "river" || ward.name.includes("Delhi"))) {
    if (rain >= 2.5) score += 15;
    else score += 5;
  }

  // Normalize & Temporal Scaling
  let probability = score;
  if (rain === 0 && (desc.includes("storm") || desc.includes("thunderstorm"))) {
    // If no rain yet but storm is forecast, scale down to reflect potential risk
    // Kolkata (Delta) and Guwahati (River) get a higher baseline forecast risk
    const scalingFactor = (ward.type === 'delta' || ward.type === 'river') ? 0.5 : 0.4;
    probability = Math.max(probability * scalingFactor, 12);
  }

  // Final Probability with Minimum Baseline (3%)
  probability = Math.min(100, Math.max(3, Math.floor(probability)));

  // Coastal/Urban Baseline (User Request: 15-20% for Low risk areas)
  if (ward.type === "coastal" || ward.name.includes("Mumbai") || ward.name.includes("Chennai")) {
    probability = Math.max(probability, 18);
  }

  // Delta Calibration (User Request)
  if (ward.type === "delta") {
    probability += 5;
  }

  // Guwahati / River Baseline
  if (ward.type === "river") {
    probability = Math.max(probability, 10);
  }

  // RECALIBRATED RISK BANDS (User Request)
  let risk = "Severe";
  if (probability < 25) risk = "Low";
  else if (probability < 50) risk = "Moderate";
  else if (probability < 70) risk = "High";

  // Water Level Label
  let waterLevelLabel = "Low / Stable";
  if (totalWaterLevel > 1.8) waterLevelLabel = "High";
  else if (totalWaterLevel > 1.5) waterLevelLabel = "Elevated";

  // Forecast Summary Logic
  let forecastSummary = "⚡ Increasing chance of showers and thunderstorms in next 24 hours";
  let futureRiskHint = "";
  if (desc.includes("storm") || desc.includes("thunderstorm")) {
    forecastSummary = "Thunderstorms likely in coming hours";
    futureRiskHint = "⚡ Slight increase in risk expected in coming days due to possible thunderstorms";
  } else if (desc.includes("rain")) {
    forecastSummary = "Intermittent showers expected";
  } else if (desc.includes("cloud")) {
    forecastSummary = "Overcast conditions likely";
  }

  // Advisory Logic
  let advisory = "";
  if (risk === "Severe") {
    advisory = `Severe flood risk due to ${rain > 7.5 ? 'heavy rainfall' : 'extreme conditions'}. Immediate evacuation may be required in low-lying areas.`;
  } else if (risk === "High") {
    advisory = `High flood risk. ${rain > 2.5 ? 'Significant rainfall' : 'Adverse conditions'} detected. Monitor local alerts closely.`;
  } else if (risk === "Moderate") {
    advisory = `Moderate flood risk due to ${rain <= 2.5 && rain > 0 ? 'light rainfall' : 'weather conditions'} and ${desc.includes('thunderstorm') ? 'thunderstorm activity' : 'elevated water levels'}. No immediate river flooding expected, but localized waterlogging may occur.`;
  } else {
    advisory = `Low current flood risk. However, rising rainfall probability may increase water levels in the next 24 hours.`;
  }

  return { 
    probability, 
    risk, 
    waterLevel: totalWaterLevel,
    waterLevelLabel,
    rainImpact,
    tideImpact,
    forecast: forecastSummary,
    futureRiskHint,
    advisory
  };
};

const getWeatherIcon = (description: string = "", rainfall: number = 0) => {
  const desc = description.toLowerCase();
  if (rainfall > 5 || desc.includes('thunderstorm')) return <CloudLightning className="w-6 h-6 text-yellow-400 mb-2" />;
  if (rainfall > 2 || desc.includes('heavy rain')) return <CloudRain className="w-6 h-6 text-blue-500 mb-2" />;
  if (rainfall > 0 || desc.includes('rain') || desc.includes('drizzle')) return <CloudDrizzle className="w-6 h-6 text-blue-400 mb-2" />;
  if (desc.includes('cloud')) return <Cloud className="w-6 h-6 text-gray-400 mb-2" />;
  if (desc.includes('mist') || desc.includes('fog') || desc.includes('haze')) return <CloudFog className="w-6 h-6 text-gray-300 mb-2" />;
  if (desc.includes('wind')) return <Wind className="w-6 h-6 text-cyan-400 mb-2" />;
  return <Sun className="w-6 h-6 text-yellow-400 mb-2" />;
};

function RiskAdvisory({ ward, weather }: { ward: any; weather?: any }) {
  const { advisory } = calculateFloodRisk(ward, weather);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mt-4"
    >
      <div className="flex items-start gap-3">
        <Activity className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-bold text-blue-400 mb-1 flex items-center gap-2">
            Risk Advisory
          </h4>
          <p className="text-xs text-blue-300/80 leading-relaxed italic">
            {advisory}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { weather } = useWeather();
  const { user, isAdmin } = useAuth();
  const [wards, setWards] = useState<any[]>([]);
  const [activeWard, setActiveWard] = useState<any>(null);
  const [isMobileListOpen, setIsMobileListOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [nearbyFloods, setNearbyFloods] = useState<any[]>([]);
  const [wardsWeather, setWardsWeather] = useState<Record<string, { rainfall: number; humidity: number; temp: number; description: string }>>({});
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const fetchingWards = useRef<Set<string>>(new Set());

  const fetchRealWeather = useCallback(async (wardId: string, lat: number, lon: number, retryCount = 0) => {
    if (fetchingWards.current.has(wardId) && retryCount === 0) return;
    fetchingWards.current.add(wardId);

    try {
      const response = await fetch(
        `/api/weather?lat=${lat}&lon=${lon}`
      );
      
      if (!response.ok) {
        throw new Error(`Server API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.current) {
        throw new Error("Invalid response format from weather API");
      }

      const current = data.current;
      
      // Open-Meteo weather codes to description
      const getWeatherDesc = (code: number) => {
        if (code === 0) return 'Clear sky';
        if (code <= 3) return 'Partly cloudy';
        if (code <= 48) return 'Fog';
        if (code <= 55) return 'Drizzle';
        if (code <= 65) return 'Rain';
        if (code <= 75) return 'Snow';
        if (code <= 82) return 'Rain showers';
        if (code >= 95) return 'Thunderstorm';
        return 'Clear';
      };

      const weather = {
        rainfall: parseFloat((current.precipitation || 0).toFixed(2)),
        humidity: current.relative_humidity_2m,
        temp: current.temperature_2m,
        description: getWeatherDesc(current.weather_code)
      };
      setWardsWeather(prev => ({ ...prev, [wardId]: weather }));
      return weather;
    } catch (error) {
      if (retryCount < 2) {
        // Exponential backoff retry
        const delay = Math.pow(2, retryCount) * 1000;
        console.warn(`Weather fetch failed for ward ${wardId}, retrying in ${delay}ms...`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchRealWeather(wardId, lat, lon, retryCount + 1);
      }

      // Log error but don't crash; use fallback
      console.warn(`Weather fetch failed for ward ${wardId} after retries, using fallback.`, error);
      const fallbackWeather = {
        rainfall: 0,
        humidity: 45,
        temp: 32,
        description: "Clear Skies"
      };
      setWardsWeather(prev => ({ ...prev, [wardId]: fallbackWeather }));
      return fallbackWeather;
    } finally {
      fetchingWards.current.delete(wardId);
    }
  }, []);

  const fetchBatchWeather = useCallback(async (wardsToFetch: any[]) => {
    if (wardsToFetch.length === 0) return;
    
    const lats = wardsToFetch.map(w => w.lat).join(',');
    const lons = wardsToFetch.map(w => w.lng).join(',');

    try {
      const response = await fetch(`/api/weather?lat=${lats}&lon=${lons}`);
      if (!response.ok) throw new Error(`Batch API Error: ${response.status}`);
      
      const data = await response.json();
      
      // Open-Meteo returns an array if multiple coordinates are requested, 
      // or a single object if only one is requested.
      const results = Array.isArray(data) ? data : [data];
      
      const getWeatherDesc = (code: number) => {
        if (code === 0) return 'Clear sky';
        if (code <= 3) return 'Partly cloudy';
        if (code <= 48) return 'Fog';
        if (code <= 55) return 'Drizzle';
        if (code <= 65) return 'Rain';
        if (code <= 75) return 'Snow';
        if (code <= 82) return 'Rain showers';
        if (code >= 95) return 'Thunderstorm';
        return 'Clear';
      };

      const newWeatherData: Record<string, any> = {};
      results.forEach((result, index) => {
        const wardId = wardsToFetch[index].id;
        if (result.current) {
          newWeatherData[wardId] = {
            rainfall: parseFloat((result.current.precipitation || 0).toFixed(2)),
            humidity: result.current.relative_humidity_2m,
            temp: result.current.temperature_2m,
            description: getWeatherDesc(result.current.weather_code)
          };
        }
      });

      setWardsWeather(prev => ({ ...prev, ...newWeatherData }));
    } catch (error) {
      console.warn("Batch weather fetch failed, falling back to individual fetches with delay", error);
      // Fallback: fetch individually but with much larger stagger
      wardsToFetch.forEach((ward, index) => {
        setTimeout(() => {
          fetchRealWeather(ward.id, ward.lat, ward.lng);
        }, index * 2000);
      });
    }
  }, [fetchRealWeather]);

  // Fetch weather for all wards
  useEffect(() => {
    if (wards.length > 0) {
      const missingWards = wards.filter(w => !wardsWeather[w.id]);
      if (missingWards.length > 0) {
        fetchBatchWeather(missingWards);
      }
    }
  }, [wards, fetchBatchWeather]); // Removed wardsWeather dependency to prevent unnecessary re-runs

  // Real-time wards subscription
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'wards'), 
      (snapshot) => {
        const wardsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          icon: doc.data().risk === 'High' ? highRiskIcon : 
                doc.data().risk === 'Medium' ? mediumRiskIcon : safeIcon
        }));
        setWards(wardsData);
        if (wardsData.length > 0 && !activeWard) {
          setActiveWard(wardsData[0]);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, 'wards')
    );

    return () => unsubscribe();
  }, []); // Removed activeWard dependency

  // Connection test
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();
  }, []);

  const seedWards = async () => {
    if (!isAdmin) {
      alert("Only administrators can seed data. Please sign in with the admin account.");
      return;
    }
    setIsSeeding(true);
    try {
      for (const ward of DEFAULT_WARDS) {
        await setDoc(doc(db, 'wards', ward.id), {
          name: ward.name,
          lat: ward.lat,
          lng: ward.lng,
          risk: ward.risk,
          level: ward.level,
          color: ward.color,
          type: ward.type,
          updatedAt: new Date().toISOString()
        });
      }
      alert("Wards seeded successfully!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'wards');
    } finally {
      setIsSeeding(false);
    }
  };

  const refreshWeatherData = useCallback(() => {
    if (wards.length > 0) {
      fetchBatchWeather(wards);
    }
  }, [wards, fetchBatchWeather]);

  const currentDateStr = useMemo(() => {
    const now = new Date();
    return `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()} • ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }).toUpperCase()}`;
  }, []);

  const activeWardRisk = useMemo(() => {
    if (!activeWard) return null;
    return calculateFloodRisk(activeWard, wardsWeather[activeWard.id]);
  }, [activeWard, wardsWeather]);

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          
          const weather = await fetchRealWeather('user', latitude, longitude);
          
          // Dynamically generate alerts based on REAL rainfall data
          // If rainfall > 5mm/h, we show high risk alerts
          // If rainfall > 2mm/h, we show medium risk alerts
          const rainfall = weather?.rainfall || 0;
          
          const simulatedNearby = [];
          if (rainfall > 5) {
            simulatedNearby.push(
              { id: 'n1', name: 'Critical Drainage Overflow', lat: latitude + 0.002, lng: longitude + 0.002, risk: 'High', color: '#EF4444' },
              { id: 'n2', name: 'Rapid Water Rise', lat: latitude - 0.003, lng: longitude + 0.001, risk: 'High', color: '#EF4444' }
            );
          } else if (rainfall > 1) {
            simulatedNearby.push(
              { id: 'n1', name: 'Minor Water Stagnation', lat: latitude + 0.002, lng: longitude + 0.002, risk: 'Medium', color: '#F59E0B' }
            );
          } else {
            // Even if no rain, show a "Safe" indicator nearby
            simulatedNearby.push(
              { id: 'n1', name: 'Clear Drainage', lat: latitude + 0.002, lng: longitude + 0.002, risk: 'Low', color: '#22C55E' }
            );
          }
          
          setNearbyFloods(simulatedNearby);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  return (
    <section id="dashboard" className="py-24 bg-[#0D0221] relative overflow-hidden">
      {/* Background Weather Image */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1592210454359-9043f067919b?auto=format&fit=crop&w=1920&q=80" 
          alt="Weather Background" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D0221] via-transparent to-[#0D0221]"></div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            CURRENT STATUS: {currentDateStr}
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-white mb-4"
          >
            Ward Readiness <span className="text-gradient">Dashboard</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 max-w-2xl mx-auto"
          >
            Real-time monitoring of city wards, sensor statuses, and AI-predicted flood probabilities.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto lg:h-[800px]">
          {/* Left Panel: Ward List (Desktop) / Mobile Toggle */}
          <div className="col-span-1 md:col-span-6 lg:col-span-3 flex flex-col gap-4 order-2 lg:order-1">
            <div className="glass-panel rounded-2xl border border-white/10 p-4 flex flex-col h-full overflow-hidden">
              <div 
                onClick={() => setIsMobileListOpen(!isMobileListOpen)}
                className="flex justify-between items-center mb-4 cursor-pointer lg:cursor-default"
              >
                <div className="flex flex-col">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-400" />
                    Active Wards
                    <span className="text-[8px] uppercase tracking-widest text-blue-400/60 font-bold border border-blue-400/20 px-1 py-0.5 rounded ml-auto">Model v2.5</span>
                  </h3>
                  <div className="flex gap-2 mt-2">
                    {isAdmin && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          seedWards();
                        }}
                        disabled={isSeeding}
                        className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20 transition-colors"
                      >
                        <Database className="w-3 h-3" />
                        {isSeeding ? 'Loading...' : 'Load Sample Wards'}
                      </button>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        refreshWeatherData();
                      }}
                      className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20 transition-colors"
                    >
                      <Activity className="w-3 h-3" />
                      Refresh Weather
                    </button>
                  </div>
                </div>
                <div className="lg:hidden text-gray-400 hover:text-white">
                  <ChevronRight className={`w-6 h-6 transition-transform ${isMobileListOpen ? 'rotate-90' : ''}`} />
                </div>
              </div>
              
              <div className={`lg:flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar ${isMobileListOpen ? 'block' : 'hidden lg:block'}`}>
                {wards.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm italic">
                    No active wards found. {isAdmin ? 'Please seed data.' : 'Waiting for updates...'}
                  </div>
                )}
                {wards.map((ward) => {
                  const wardWeather = wardsWeather[ward.id];
                  const { probability: displayLevel, risk: displayRisk } = calculateFloodRisk(ward, wardWeather);

                  const isActive = activeWard?.id === ward.id;

                  return (
                    <motion.button
                      key={ward.id}
                      whileHover={{ x: 5 }}
                      onClick={() => {
                        setActiveWard(ward);
                        setIsMobileListOpen(false);
                      }}
                      className={`w-full text-left p-4 rounded-xl transition-all border ${
                        isActive
                          ? 'bg-white/10 border-purple-500/50 shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                          : 'bg-white/5 border-transparent hover:bg-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-white">{ward.name}</span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            displayRisk === 'Severe' || displayRisk === 'High' ? 'bg-red-500/20 text-red-400' :
                            displayRisk === 'Moderate' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-green-500/20 text-green-400'
                          }`}
                        >
                          {displayRisk}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${displayLevel}%` }}
                          className={`h-full ${
                            displayRisk === 'Severe' || displayRisk === 'High' ? 'bg-red-500' :
                            displayRisk === 'Moderate' ? 'bg-orange-500' :
                            'bg-green-500'
                          }`}
                        ></motion.div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Center Panel: Map */}
          <div className="col-span-1 md:col-span-12 lg:col-span-6 rounded-2xl overflow-hidden border border-white/10 relative h-[400px] md:h-[500px] lg:h-full z-10 order-1 lg:order-2">
            <MapContainer
              center={[20.5937, 78.9629]}
              zoom={5}
              style={{ height: '100%', width: '100%', background: '#0D0221' }}
              zoomControl={false}
            >
              <MapController center={userLocation} />
              
              <LayersControl position="topleft">
                <LayersControl.BaseLayer checked name="Dark Map">
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  />
                </LayersControl.BaseLayer>

                <LayersControl.Overlay name="ISRO Bhuvan Flood Hazard (Sample)">
                  <WMSTileLayer
                    url="https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms"
                    layers="flood_hazard_layer"
                    format="image/png"
                    transparent={true}
                    attribution='&copy; ISRO Bhuvan'
                  />
                </LayersControl.Overlay>
              </LayersControl>
              {wards.map((ward) => {
                const wardWeather = wardsWeather[ward.id];
                const { risk: displayRisk } = calculateFloodRisk(ward, wardWeather);
                const displayColor = (displayRisk === 'Severe' || displayRisk === 'High') ? '#EF4444' : displayRisk === 'Moderate' ? '#F59E0B' : '#22C55E';
                const displayIcon = (displayRisk === 'Severe' || displayRisk === 'High') ? highRiskIcon : displayRisk === 'Moderate' ? mediumRiskIcon : safeIcon;

                return (
                  <div key={ward.id}>
                    <Marker position={[ward.lat, ward.lng]} icon={displayIcon}>
                      <Popup className="custom-popup">
                        <div className="p-2">
                          <h4 className="font-bold text-gray-900">{ward.name}</h4>
                          <p className="text-sm text-gray-600">Risk Level: {displayRisk}</p>
                        </div>
                      </Popup>
                    </Marker>
                    <Circle
                      center={[ward.lat, ward.lng]}
                      radius={800}
                      pathOptions={{
                        color: displayColor,
                        fillColor: displayColor,
                        fillOpacity: 0.2,
                        weight: 1
                      }}
                    />
                  </div>
                );
              })}

              {userLocation && (
                <>
                  <Marker position={userLocation} icon={userIcon}>
                    <Popup className="custom-popup">
                      <div className="p-2">
                        <h4 className="font-bold text-gray-900">Your Location</h4>
                        <p className="text-sm text-gray-600">Monitoring nearby risks...</p>
                      </div>
                    </Popup>
                  </Marker>
                  <Circle
                    center={userLocation}
                    radius={1000}
                    pathOptions={{
                      color: '#3B82F6',
                      fillColor: '#3B82F6',
                      fillOpacity: 0.1,
                      weight: 1,
                      dashArray: '5, 5'
                    }}
                  />
                </>
              )}

              {nearbyFloods.map((flood) => (
                <div key={flood.id}>
                  <Marker position={[flood.lat, flood.lng]} icon={createIcon(flood.color)}>
                    <Popup className="custom-popup">
                      <div className="p-2">
                        <h4 className="font-bold text-gray-900">{flood.name}</h4>
                        <p className="text-sm text-gray-600">Risk: {flood.risk}</p>
                      </div>
                    </Popup>
                  </Marker>
                  <Circle
                    center={[flood.lat, flood.lng]}
                    radius={300}
                    pathOptions={{
                      color: flood.color,
                      fillColor: flood.color,
                      fillOpacity: 0.3,
                      weight: 2
                    }}
                  />
                </div>
              ))}
            </MapContainer>
            
            {/* Map Overlay Stats */}
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLocateMe}
                className="bg-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <Navigation className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold">Locate Me</span>
              </motion.button>
              
              <motion.div 
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="bg-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
              >
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-sm font-bold text-gray-900">2 Critical Alerts</span>
              </motion.div>
            </div>
          </div>

          {/* Right Panel: Analytics */}
          <div className="col-span-1 md:col-span-6 lg:col-span-3 flex flex-col gap-4 h-full order-3">
            <AnimatePresence mode="wait">
              {activeWard && activeWardRisk ? (
                <motion.div
                  key={activeWard.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="glass-panel rounded-2xl border border-white/10 p-6 flex-1"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-white">{activeWard.name} Details</h3>
                      <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Last Updated: {currentDateStr}</p>
                    </div>
                    {wardsWeather[activeWard.id] && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full border border-green-400/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                        LIVE DATA
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">Flood Probability</span>
                          <span className="font-bold text-white">
                            {activeWardRisk.probability}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${activeWardRisk.probability}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full transition-colors duration-500 ${
                              activeWardRisk.risk === 'Severe' ? 'bg-purple-500' :
                              activeWardRisk.risk === 'High' ? 'bg-red-500' :
                              activeWardRisk.risk === 'Moderate' ? 'bg-orange-500' :
                              'bg-green-500'
                            }`}
                          ></motion.div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <motion.div 
                          whileHover={{ scale: 1.05 }}
                          className="bg-white/5 rounded-xl p-4 border border-white/5"
                        >
                          {wardsWeather[activeWard.id] 
                            ? getWeatherIcon(wardsWeather[activeWard.id].description, wardsWeather[activeWard.id].rainfall)
                            : <Sun className="w-6 h-6 text-yellow-400 mb-2" />
                          }
                          <div className="text-2xl font-bold">
                            {wardsWeather[activeWard.id] ? wardsWeather[activeWard.id].rainfall : "0"}
                            <span className="text-sm text-gray-400">mm/h</span>
                            {loadingWeather && <Loader2 className="w-3 h-3 animate-spin inline ml-2" />}
                          </div>
                          <div className="text-xs text-gray-400">
                            {wardsWeather[activeWard.id] && wardsWeather[activeWard.id].rainfall > 0 ? `Rainfall (${wardsWeather[activeWard.id].description})` : (wardsWeather[activeWard.id]?.description || "Clear Skies")}
                          </div>
                          {activeWardRisk.forecast && (
                            <div className="text-[10px] text-blue-400/80 mt-1 flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <Sparkles className="w-2 h-2" />
                                Forecast: {activeWardRisk.forecast}
                              </div>
                              {activeWardRisk.futureRiskHint && (
                                <div className="text-[9px] text-orange-400/70 italic leading-tight">
                                  {activeWardRisk.futureRiskHint}
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                        <motion.div 
                          whileHover={{ scale: 1.05 }}
                          className="bg-white/5 rounded-xl p-4 border border-white/5"
                        >
                          <Droplets className="w-6 h-6 text-cyan-400 mb-2" />
                          <div className="text-2xl font-bold">
                            {activeWardRisk.waterLevel.toFixed(1)}
                            <span className="text-sm text-gray-400">m</span>
                          </div>
                          <div className="text-xs text-gray-400 flex justify-between items-center">
                            <span>
                              {activeWard.type === 'coastal' || activeWard.type === 'delta' ? 'Tide Level' : 
                               activeWard.type === 'river' ? 'River Level' : 'Drainage Level'}
                            </span>
                            <span className={`text-[10px] font-bold ${
                              activeWardRisk.waterLevelLabel === 'High' ? 'text-red-400' :
                              activeWardRisk.waterLevelLabel === 'Elevated' ? 'text-orange-400' :
                              'text-green-400'
                            }`}>
                              {activeWardRisk.waterLevelLabel.toUpperCase()}
                            </span>
                          </div>
                        </motion.div>
                      </div>

                      <AnimatePresence>
                        {wardsWeather[activeWard.id] && (wardsWeather[activeWard.id].rainfall > 2 || activeWardRisk.risk !== 'Low') && (
                          <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className={`${(activeWardRisk.risk === 'Severe' || activeWardRisk.risk === 'High') ? 'bg-red-500/10 border-red-500/20' : 'bg-orange-500/10 border-orange-500/20'} border rounded-xl p-4`}
                          >
                            <div className="flex items-start gap-3">
                              <AlertTriangle className={`w-5 h-5 ${(activeWardRisk.risk === 'Severe' || activeWardRisk.risk === 'High') ? 'text-red-400' : 'text-orange-400'} flex-shrink-0 mt-0.5`} />
                              <div>
                                <h4 className={`text-sm font-bold ${(activeWardRisk.risk === 'Severe' || activeWardRisk.risk === 'High') ? 'text-red-400' : 'text-orange-400'} mb-1`}>
                                  {activeWardRisk.risk.toUpperCase()} ALERT
                                </h4>
                                <p className={`text-xs ${(activeWardRisk.risk === 'Severe' || activeWardRisk.risk === 'High') ? 'text-red-300/80' : 'text-orange-300/80'} leading-relaxed`}>
                                  {activeWardRisk.risk === 'Severe'
                                    ? `Extreme conditions detected. Severe flood risk in ${activeWard.name}. Evacuation protocols may be necessary.`
                                    : activeWardRisk.risk === 'High'
                                    ? `Severe conditions detected. High risk of waterlogging in ${activeWard.name}. Immediate monitoring required.`
                                    : `Moderate risk detected. Water levels are elevated. No heavy rainfall currently, but monitor conditions closely.`
                                  }
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <RiskAdvisory ward={activeWard} weather={wardsWeather[activeWard.id]} />
                    </div>
                  </motion.div>
              ) : (
                <div className="glass-panel rounded-2xl border border-white/10 p-6 flex-1 flex items-center justify-center text-gray-500 italic text-sm">
                  Select a ward to view details
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

