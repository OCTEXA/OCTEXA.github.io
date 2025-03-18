import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Firebase Config
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
const auth = getAuth();
const db = getFirestore();

// Authentication & UI Updates
onAuthStateChanged(auth, (user) => {
    const authButtons = document.getElementById("authButtons");
    const galleryHeading = document.getElementById("galleryHeading");

    if (user) {
        
        authButtons.innerHTML = `
            <button class="upload" onclick="window.location.href='upload.html'">Upload</button>
            <button class="logout" id="logoutBtn">Logout</button>
        `;

        document.getElementById("logoutBtn").addEventListener("click", () => {
            signOut(auth);
        });

    } else {
        galleryHeading.innerHTML = "Welcome to our Gallery";
        authButtons.innerHTML = `<button class="sign-in" onclick="window.location.href='index.html'">Sign In</button>`;
    }
});

// Fetch & Display Images
async function loadGallery() {
    const gallery = document.getElementById("gallery");
    gallery.innerHTML = ""; // Clear before adding new images

    const querySnapshot = await getDocs(collection(db, "user_uploads"));
    querySnapshot.forEach((doc) => {
        const data = doc.data();

        const galleryItem = document.createElement("div");
        galleryItem.classList.add("gallery-item");

        galleryItem.innerHTML = `
            <img src="${data.image}" alt="Uploaded Image">
            <div class="image-info">
                <p><strong>${data.username}</strong> (@${data.socialUsername})</p>
                <p>Email: ${data.email}</p>
            </div>
        `;

        gallery.appendChild(galleryItem);
    });
}

loadGallery();