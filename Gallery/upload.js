import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Firebase configuration
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

let userData = {};

// Check if user is logged in
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userId = user.uid;
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            userData = docSnap.data();
            document.getElementById('loggedUserFName').innerText = userData.firstName || "Unknown";
            document.getElementById('loggedUserEmail').innerText = userData.email || "Unknown";
        } else {
            console.log("User document not found");
        }
    } else {
        console.log("No user logged in");
    }
});

// Upload image link to Firestore
document.getElementById("uploadBtn").addEventListener("click", async () => {
    // No need for e.preventDefault() as this isn't a form submission

    const imageUrl = document.getElementById("imageURL").value.trim();  // Note: "imageURL" not "imageUrl"
    const socialUsername = document.getElementById("socialUsername").value.trim();

    // Validate image URL
    if (!imageUrl.match(/\.(jpeg|jpg|png)$/i)) {
        document.getElementById("statusMessage").innerText = "Please enter a valid image URL ending with .jpeg, .jpg, or .png";
        return;
    }

    // Ensure user data is available
    if (!userData.firstName || !userData.email) {
        document.getElementById("statusMessage").innerText = "User data not found. Please log in again.";
        return;
    }

    try {
        await addDoc(collection(db, "user_uploads"), {
            username: userData.firstName,
            email: userData.email,
            socialUsername: socialUsername || "Not Provided",
            image: imageUrl,
            timestamp: serverTimestamp()
        });

        document.getElementById("statusMessage").innerText = "Image uploaded successfully!";
        document.getElementById("imageURL").value = "";
        document.getElementById("socialUsername").value = "";
    } catch (error) {
        console.error("Error uploading image: ", error);
        document.getElementById("statusMessage").innerText = "Failed to upload image. Please try again.";
    }
});

// You might also want to add a logout function
document.getElementById("logout").addEventListener("click", () => {
    auth.signOut()
        .then(() => {
            window.location.href = "index.html"; // Redirect to login page
        })
        .catch((error) => {
            console.error("Error signing out: ", error);
        });
});
