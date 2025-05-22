// firebase-config.js
// Firebase configuration - safe to expose in client-side applications
export const firebaseConfig = {
  apiKey: "AIzaSyCVQyptr2P7C0pAKBWwq4vhkJ-NhmfkNzU",
  authDomain: "pixyshare-c918c.firebaseapp.com",
  projectId: "pixyshare-c918c",
  storageBucket: "pixyshare-c918c.firebasestorage.app",
  messagingSenderId: "906028747090",
  appId: "1:906028747090:web:077d619bb5615e9645528b",
  measurementId: "G-4PFTVLTB4N"
};

// Other configuration constants
export const IMGBB_API_KEY = "4f4d9f58466506463ea37dce6f973243";

// You can also add environment-specific configs if needed
export const CONFIG = {
  isDevelopment: window.location.hostname === 'localhost',
  isProduction: window.location.hostname.includes('github.io') || window.location.hostname.includes('pages.dev')
};