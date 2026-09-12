// Firebase Initialization Module for INDUSHI
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported, logEvent } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAJDKUnekNOuEsxoVe3dm5NdPrxYs-B65w",
  authDomain: "indushi.firebaseapp.com",
  projectId: "indushi",
  storageBucket: "indushi.firebasestorage.app",
  messagingSenderId: "988014744863",
  appId: "1:988014744863:web:194364ce95b0ea234a4c2a",
  measurementId: "G-9J4YBH4QY7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Analytics conditionally based on browser support
let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

function trackPageView(pagePath, pageTitle) {
  if (analytics) {
    try {
      logEvent(analytics, 'page_view', {
        page_path: pagePath,
        page_title: pageTitle,
        page_location: window.location.href
      });
    } catch (err) {
      console.debug("Firebase Analytics page_view track:", err);
    }
  }
}

export { app, auth, db, analytics, firebaseConfig, trackPageView };


