import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyBYZqfjkZVPXRqxP-z0DDiR2EX1hP1feeY",
  authDomain: "reseller01-482b8.firebaseapp.com",
  projectId: "reseller01-482b8",
  storageBucket: "reseller01-482b8.firebasestorage.app",
  messagingSenderId: "1070054308884",
  appId: "1:1070054308884:web:4ca29a5c5997ddf4dafb01",
  measurementId: "G-5LTCT768CF"
};

// Initialize Firebase
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firebase Analytics safely (with browser support verification)
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Analytics is not supported in this environment
  });
}

export { signInWithPopup };
