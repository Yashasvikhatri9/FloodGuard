import express from "express";
import axios from "axios";

const app = express();

// Simple in-memory cache
const weatherCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// 🌦️ Weather API
app.get("/api/weather", async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: "Lat/Lon required" });
  }

  const cacheKey = `${lat}-${lon}`;
  const cached = weatherCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return res.json(cached.data);
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code&wind_speed_unit=ms&timezone=auto`;

    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        Accept: "application/json",
        "User-Agent": "FloodGuard-App/1.0",
      },
    });

    // Cache response
    weatherCache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now(),
    });

    return res.json(response.data);
  } catch (error: any) {
    console.error("Weather API error:", error.message);

    if (cached) {
      console.warn("Returning cached data");
      return res.json(cached.data);
    }

    return res.status(500).json({
      error: "Weather fetch failed",
      message: error.message,
    });
  }
});

// 📍 Geocoding API
app.get("/api/geocoding", async (req, res) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${name}&count=5&language=en&format=json`;

    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        Accept: "application/json",
        "User-Agent": "FloodGuard-App/1.0",
      },
    });

    return res.json(response.data);
  } catch (error: any) {
    console.error("Geocoding error:", error.message);

    return res.status(500).json({
      error: "Geocoding failed",
    });
  }
});

export default app;