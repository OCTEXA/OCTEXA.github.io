


import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Your Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyCwSgI3PQNErkWgxce4avRd2Fqw9SH1X_k",
    authDomain: "pictures-a451d.firebaseapp.com",
    projectId: "pictures-a451d",
    storageBucket: "pictures-a451d.firebasestorage.app",
    messagingSenderId: "38640417163",
    appId: "1:38640417163:web:362d31f74eb2ba7e62578e",
    measurementId: "G-QHJMWZBXJ4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export auth and db
export { auth, db };