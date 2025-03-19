import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

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

// Keep track of whether gallery has been loaded
let galleryLoaded = false;

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

        // Load gallery with user credentials (only if not already loaded)
        loadGallery(user.email);
        
    } else {
        galleryHeading.innerHTML = "Welcome to our Gallery";
        authButtons.innerHTML = `<button class="sign-in" onclick="window.location.href='index.html'">Sign In</button>`;
        
        // Load gallery without user credentials (only if not already loaded)
        loadGallery(null);
    }
});

// Fetch & Display Images
async function loadGallery(userEmail) {
    // Prevent duplicate gallery loading
    if (galleryLoaded) {
        // If gallery already loaded but user changed, clear and reload
        if (userEmail === "megaplayzrbx@gmail.com") {
            // Only reload if admin user, to show delete buttons
            galleryLoaded = false;
        } else {
            return; // Don't reload for non-admin users
        }
    }
    
    const gallery = document.getElementById("gallery");
    gallery.innerHTML = ""; // Clear before adding new images

    try {
        const querySnapshot = await getDocs(collection(db, "user_uploads"));
        
        if (querySnapshot.empty) {
            gallery.innerHTML = "<p class='no-images'>No images found</p>";
            galleryLoaded = true;
            return;
        }
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const docId = doc.id;

            const galleryItem = document.createElement("div");
            galleryItem.classList.add("gallery-item");

            // Basic image and info HTML
            let itemHTML = `
                <img src="${data.image}" alt="Uploaded Image">
                <div class="image-info">
                    <p><strong>${data.username}</strong> (@${data.socialUsername})</p>
                    <p>Email: ${data.email}</p>
                </div>
            `;

            // Add delete button only for admin user
            if (userEmail === "megaplayzrbx@gmail.com") {
                itemHTML += `
                    <button class="delete-btn" data-id="${docId}">Delete</button>
                `;
            }

            galleryItem.innerHTML = itemHTML;
            gallery.appendChild(galleryItem);
        });

        // Add event listeners to delete buttons if they exist
        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                // Prevent event bubbling
                e.stopPropagation();
                
                const docId = button.getAttribute('data-id');
                try {
                    await deleteDoc(doc(db, "user_uploads", docId));
                    console.log("Document successfully deleted!");
                    
                    // Remove the gallery item from the DOM
                    const galleryItem = button.closest('.gallery-item');
                    if (galleryItem) {
                        galleryItem.style.opacity = '0';
                        setTimeout(() => {
                            galleryItem.remove();
                        }, 300);
                    }
                } catch (error) {
                    console.error("Error removing document: ", error);
                }
            });
        });
        
        // Mark gallery as loaded
        galleryLoaded = true;
    } catch (error) {
        console.error("Error getting documents: ", error);
        gallery.innerHTML = `<p class='error-message'>Error loading gallery: ${error.message}</p>`;
        // Still mark as loaded to prevent infinite retry attempts
        galleryLoaded = true;
    }
}

// Remove the initial load to prevent duplication
// The gallery will be loaded only from the onAuthStateChanged event