# FloodGuard ML Backend Guide

This guide explains how to build, train, and deploy a custom Machine Learning model for urban flood prediction to integrate with your React frontend.

## 1. The Architecture

Your system will consist of two parts:
1.  **Frontend (Current):** The React/Vite application you already have.
2.  **Backend (New):** A Python API (using FastAPI or Flask) that serves your trained ML model.

## 2. The Dataset

To train a model, you need a dataset containing historical weather and flooding events.

**Recommended Dataset Structure (CSV):**
*   `date`: YYYY-MM-DD
*   `rainfall_mm`: Daily rainfall amount.
*   `river_level_m`: Water level of the primary river/drainage.
*   `soil_moisture_pct`: Percentage of soil saturation.
*   `elevation_m`: Average elevation of the ward/area.
*   `flood_occurred`: `1` (Yes) or `0` (No) - **This is your target variable.**

**Where to find data:**
*   **Kaggle:** Search for "Kerala Flood Dataset", "Bangladesh Flood Dataset", or "Rainfall Prediction".
*   **NOAA / OpenWeatherMap:** For historical weather data.

## 3. Training the Model (Python)

You will use Python with `scikit-learn` to train a **Random Forest Classifier** or **XGBoost** model. These are excellent for tabular data.

### Setup your Python Environment
```bash
mkdir floodguard-ml
cd floodguard-ml
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install pandas scikit-learn fastapi uvicorn joblib
```

### `train_model.py` (Example Script)
Create this file to train and save your model.

```python
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib

# 1. Load your dataset (replace with your actual CSV)
# Example data: rainfall, river_level, soil_moisture, flood_occurred
data = {
    'rainfall_mm': [10, 50, 120, 5, 80, 200, 0, 15],
    'river_level_m': [1.0, 1.5, 2.5, 0.8, 2.0, 3.5, 0.5, 1.2],
    'soil_moisture_pct': [40, 60, 90, 30, 85, 95, 20, 50],
    'flood_occurred': [0, 0, 1, 0, 1, 1, 0, 0] # 1 = Flood, 0 = No Flood
}
df = pd.DataFrame(data)

# 2. Prepare features (X) and target (y)
X = df[['rainfall_mm', 'river_level_m', 'soil_moisture_pct']]
y = df['flood_occurred']

# 3. Split data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 4. Train the Random Forest model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 5. Evaluate the model
predictions = model.predict(X_test)
print(f"Accuracy: {accuracy_score(y_test, predictions) * 100:.2f}%")

# 6. Save the trained model to a file
joblib.dump(model, 'flood_prediction_model.pkl')
print("Model saved as 'flood_prediction_model.pkl'")
```

Run this script: `python train_model.py`. It will generate a file named `flood_prediction_model.pkl`.

## 4. Serving the Model via API (FastAPI)

Now, create an API that your React app can talk to.

### `main.py` (FastAPI Server)
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np

app = FastAPI()

# Enable CORS so your React app can make requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your React app's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the trained model
model = joblib.load('flood_prediction_model.pkl')

# Define the input data structure
class FloodData(BaseModel):
    rainfall_mm: float
    river_level_m: float
    soil_moisture_pct: float

@app.post("/api/predict")
def predict_flood(data: FloodData):
    # Format data for the model
    features = np.array([[data.rainfall_mm, data.river_level_m, data.soil_moisture_pct]])
    
    # Get prediction (0 or 1) and probability (e.g., [0.2, 0.8])
    prediction = int(model.predict(features)[0])
    probability = model.predict_proba(features)[0][1] * 100 # Probability of class 1 (Flood)
    
    # Determine risk level
    risk_level = "Low"
    if probability > 70:
        risk_level = "High"
    elif probability > 40:
        risk_level = "Medium"
        
    return {
        "flood_predicted": bool(prediction),
        "probability_percent": round(probability, 2),
        "risk_level": risk_level
    }
```

Run the API: `uvicorn main:app --reload`
Your API is now running at `http://localhost:8000`.

## 5. Connecting React to the Python API

In your React app (e.g., `src/components/Dashboard.tsx`), you will fetch predictions from this API.

```typescript
// Example React integration
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/predict', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rainfall_mm: 120,
            river_level_m: 2.5,
            soil_moisture_pct: 85
          }),
        });
        const data = await response.json();
        setPrediction(data);
      } catch (error) {
        console.error("Error fetching prediction:", error);
      }
    };

    fetchPrediction();
  }, []);

  return (
    <div>
      {prediction && (
        <div>
          <h3>Flood Risk: {prediction.risk_level}</h3>
          <p>Probability: {prediction.probability_percent}%</p>
        </div>
      )}
    </div>
  );
}
```

## 7. Using Official Indian Data Sources (IMD, CWC, ISRO)

For a production-grade app in India, you should move from static Kaggle datasets to official government feeds.

### A. IMD (Rainfall Data)
*   **Source:** [Mausam (IMD)](https://mausam.imd.gov.in/)
*   **Prototype Strategy:** Use the **OpenWeatherMap API** as a proxy. It provides high-quality meteorological data for all Indian coordinates that closely matches IMD's ground stations.
*   **Production Strategy:** Apply for IMD's **Gridded Rainfall Data** (available in `.nc` or `.grd` formats). You will need a Python library like `xarray` or `netCDF4` to process this data into your ML features.

### B. CWC (River Levels)
*   **Source:** [India-WRIS (Water Resources Information System)](https://india-wris.gov.in/)
*   **Prototype Strategy:** Manually export historical river level CSVs for your target basins (e.g., Yamuna, Ganga) from the India-WRIS portal to train your model.
*   **Production Strategy:** Use the CWC's **Flood Forecasting API** (requires government authorization) to get real-time "Inflow" and "Level" data.

### C. ISRO Bhuvan (Flood Hazard Maps)
*   **Source:** [Bhuvan NRSC](https://bhuvan.nrsc.gov.in/)
*   **Integration:** You can overlay Bhuvan's official flood hazard zonation maps directly onto your React-Leaflet map using **WMS (Web Map Service)**.
*   **Example Code (React):**
    ```tsx
    <WMSTileLayer
      url="https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms"
      layers="flood_hazard_layer"
      format="image/png"
      transparent={true}
      attribution='&copy; ISRO Bhuvan'
    />
    ```

## 8. Pan-India Model Strategy

Since India has diverse climates, a single model might not be enough.
1.  **Regional Encoding:** Include `Subdivision_ID` as a feature in your ML model so it learns that 100mm in Rajasthan is different from 100mm in Assam.
2.  **Threshold-Based Logic:** Combine ML with "Return Period" analysis. If rainfall exceeds the "1-in-50-year" event for that specific Indian district, trigger a high-priority alert.
