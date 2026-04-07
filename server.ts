import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// For Vercel, we need to export the app directly
const app = express();
const PORT = 3000;

// Simple in-memory cache
const weatherCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// API Route for Weather Proxy (Supports Batching)
app.get("/api/weather", async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: "Lat/Lon required" });

  const cacheKey = `${lat}-${lon}`;
  const cached = weatherCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return res.json(cached.data);
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code&wind_speed_unit=ms&timezone=auto`;
    
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FloodGuard-App/1.0'
      }
    });

    // Cache the result
    weatherCache.set(cacheKey, { data: response.data, timestamp: Date.now() });
    
    res.json(response.data);
  } catch (error: any) {
    console.error("Server-side weather fetch error:", error.message);
    const status = error.response?.status || 500;
    const message = error.response?.data || error.message;
    
    if (cached) {
      console.warn("Returning expired cache due to API error");
      return res.json(cached.data);
    }

    res.status(status).json({ 
      error: "Weather fetch failed", 
      message: message 
    });
  }
});

// API Route for Geocoding Proxy
app.get("/api/geocoding", async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: "Name is required" });

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${name}&count=5&language=en&format=json`;
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FloodGuard-App/1.0'
      }
    });
    res.json(response.data);
  } catch (error: any) {
    console.error("Server-side geocoding error:", error.message);
    const status = error.response?.status || 500;
    res.status(status).json({ error: "Geocoding failed" });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  }).then((vite) => {
    app.use(vite.middlewares);
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

export default app;
