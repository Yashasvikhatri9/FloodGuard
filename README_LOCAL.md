# FloodGuard - Local Setup & Deployment Guide

This guide explains how to run the application on your local machine and deploy it to Vercel.

## 1. Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Steps
1. **Download the Code**: Export the ZIP from AI Studio and extract it.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Environment Variables**:
   Create a `.env` file in the root directory and add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_FIRESTORE_DATABASE_ID=your_database_id
   ```
4. **Start the App**:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

## 2. Deploying to Vercel

### Steps
1. **Push to GitHub**: Create a new repository and push your code.
2. **Import to Vercel**:
   - Go to [Vercel](https://vercel.com/) and click **"Add New Project"**.
   - Import your GitHub repository.
3. **Configure Environment Variables**:
   In the Vercel dashboard, add the variables from your `.env` file.
4. **Build Settings**:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Deploy**: Click **Deploy**.

### How it works on Vercel
The `api/index.ts` file is automatically detected by Vercel as a serverless function. The `vercel.json` file handles the routing between your React frontend and the Express backend.
