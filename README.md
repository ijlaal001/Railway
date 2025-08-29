# Railway Info App - Deployment Guide

## Quick Deploy Options

### Option 1: Deploy to Render (Recommended for Flask)
1. Push all files to your GitHub repository
2. Go to [render.com](https://render.com) and create account
3. Connect your GitHub repository
4. Create new "Web Service"
5. Use these settings:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python app.py`
   - **Environment:** Python 3

### Option 2: Deploy to Railway
1. Push to GitHub
2. Go to [railway.app](https://railway.app)
3. Connect GitHub repository
4. Deploy automatically detects Flask app

### Option 3: Deploy to Vercel (Need to modify for serverless)
- Vercel works better with Node.js, but can work with Python using serverless functions

## Firebase Setup (Required)

### Step 1: Create Firebase Project
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create new project
3. Enable Authentication:
   - Go to Authentication → Sign-in method
   - Enable Google and Email/Password
4. Enable Firestore:
   - Go to Firestore Database
   - Create database in production mode

### Step 2: Get Firebase Config
1. Go to Project Settings → General
2. Scroll to "Your apps" section
3. Add web app
4. Copy the Firebase config object

### Step 3: Update app.js
Replace the firebaseConfig object in `static/js/app.js` with your actual config:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project.firebaseapp.com", 
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};
```

## Project Structure for GitHub
```
railway-app/
├── templates/
│   ├── index.html
│   ├── pnr.html
│   ├── status.html
│   └── favorites.html
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── app.py
├── requirements.txt
└── README.md
```

## Environment Variables (Optional)
If you want to keep Firebase config secure, you can use environment variables:

1. In your deployment platform, add these environment variables:
   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - etc.

2. Modify app.js to use: `process.env.FIREBASE_API_KEY` (though this requires build step)

## Post-Deployment Steps
1. Update Firebase Auth settings:
   - Add your deployment domain to Authorized domains
   - Example: `your-app.onrender.com`
2. Test all functionality
3. Check browser console for any Firebase errors

## Troubleshooting
- **Firebase errors:** Check console for authentication domain issues
- **CORS errors:** Make sure your deployment domain is added to Firebase Auth
- **Build failures:** Check requirements.txt and Python version compatibility

The app will work immediately after deployment once Firebase is configured!
