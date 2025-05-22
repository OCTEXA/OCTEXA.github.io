import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Firebase configuration
import { firebaseConfig, IMGBB_API_KEY } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

// ImgBB API key


let currentUser = null;

// DOM Elements
const loginModal = document.getElementById('loginModal');
const uploadModal = document.getElementById('uploadModal');
const loginBtn = document.getElementById('loginBtn');
const uploadBtn = document.getElementById('uploadBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginPrompt = document.getElementById('loginPrompt');

// Modal controls
document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        closeBtn.closest('.modal').style.display = 'none';
    });
});

// Show/hide forms
document.getElementById('showSignUp').addEventListener('click', () => {
    document.getElementById('signInForm').style.display = 'none';
    document.getElementById('signUpForm').style.display = 'block';
});

document.getElementById('showSignIn').addEventListener('click', () => {
    document.getElementById('signUpForm').style.display = 'none';
    document.getElementById('signInForm').style.display = 'block';
});

// Button event listeners
loginBtn.addEventListener('click', () => {
    loginModal.style.display = 'flex';
});

uploadBtn.addEventListener('click', () => {
    uploadModal.style.display = 'flex';
});

logoutBtn.addEventListener('click', () => {
    signOut(auth);
});

// Authentication state observer
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            currentUser.userData = docSnap.data();
        }
        
        // Update UI for logged in user
        loginBtn.style.display = 'none';
        uploadBtn.style.display = 'block';
        logoutBtn.style.display = 'block';
        loginPrompt.style.display = 'none';
    } else {
        currentUser = null;
        // Update UI for logged out user
        loginBtn.style.display = 'block';
        uploadBtn.style.display = 'none';
        logoutBtn.style.display = 'none';
        loginPrompt.style.display = 'flex';
    }
    
    // Load gallery
    loadGallery();
});

// Message display function
function showMessage(message, elementId) {
    const messageDiv = document.getElementById(elementId);
    messageDiv.style.display = "block";
    messageDiv.innerHTML = message;
    setTimeout(() => {
        messageDiv.style.display = "none";
    }, 5000);
}

// Sign Up
document.getElementById('submitSignUp').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('rEmail').value;
    const password = document.getElementById('rPassword').value;
    const firstName = document.getElementById('fName').value;
    const lastName = document.getElementById('lName').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        const userData = {
            email: email,
            firstName: firstName,
            lastName: lastName
        };
        
        await setDoc(doc(db, "users", user.uid), userData);
        showMessage('Account Created Successfully', 'signUpMessage');
        
        // Close modal after successful signup
        setTimeout(() => {
            loginModal.style.display = 'none';
        }, 1000);
        
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            showMessage('Email Address Already Exists!', 'signUpMessage');
        } else {
            showMessage('Unable to create user', 'signUpMessage');
        }
    }
});

// Sign In
document.getElementById('submitSignIn').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        showMessage('Login successful', 'signInMessage');
        
        // Close modal after successful login
        setTimeout(() => {
            loginModal.style.display = 'none';
        }, 1000);
        
    } catch (error) {
        if (error.code === 'auth/invalid-credential') {
            showMessage('Incorrect Email or Password', 'signInMessage');
        } else {
            showMessage('Account does not exist', 'signInMessage');
        }
    }
});

// File upload preview
document.getElementById('imageFile').addEventListener('change', function() {
    const fileName = this.files[0]?.name || "Click to select image";
    document.getElementById('fileName').textContent = fileName;
    
    if (this.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('previewImage').src = e.target.result;
            document.getElementById('imagePreview').style.display = 'block';
        }
        reader.readAsDataURL(this.files[0]);
    } else {
        document.getElementById('imagePreview').style.display = 'none';
    }
});

// Upload image
document.getElementById('uploadSubmit').addEventListener('click', async () => {
    const fileInput = document.getElementById('imageFile');
    const socialUsername = document.getElementById('socialUsername').value.trim();
    const statusDiv = document.getElementById('uploadStatus');

    if (!fileInput.files || fileInput.files.length === 0) {
        statusDiv.innerHTML = "Please select an image file";
        return;
    }

    if (!currentUser || !currentUser.userData) {
        statusDiv.innerHTML = "Please log in to upload images";
        return;
    }

    statusDiv.innerHTML = '<span class="loading">Uploading...</span>';
    
    const file = fileInput.files[0];
    
    try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = async function() {
            try {
                let base64Image = reader.result.split(',')[1];
                
                const formData = new FormData();
                formData.append("key", IMGBB_API_KEY);
                formData.append("image", base64Image);
                
                const response = await fetch("https://api.imgbb.com/1/upload", {
                    method: "POST",
                    body: formData
                });
                
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.error?.message || "Failed to upload image");
                }
                
                const imageUrl = data.data.url;
                
                await addDoc(collection(db, "user_uploads"), {
                    username: currentUser.userData.firstName,
                    email: currentUser.userData.email,
                    socialUsername: socialUsername || "Not Provided",
                    image: imageUrl,
                    thumbnail: data.data.thumb?.url || imageUrl,
                    delete_url: data.data.delete_url || null,
                    timestamp: serverTimestamp()
                });
        
                statusDiv.innerHTML = "Image uploaded successfully!";
                
                // Reset form
                fileInput.value = "";
                document.getElementById('socialUsername').value = "";
                document.getElementById('fileName').textContent = "Click to select image";
                document.getElementById('imagePreview').style.display = "none";
                
                // Close modal and reload gallery
                setTimeout(() => {
                    uploadModal.style.display = 'none';
                    loadGallery();
                }, 1500);
                
            } catch (error) {
                console.error("Error uploading image: ", error);
                statusDiv.innerHTML = "Failed to upload image: " + error.message;
            }
        };
        
    } catch (error) {
        console.error("Error preparing image: ", error);
        statusDiv.innerHTML = "Failed to prepare image. Please try again.";
    }
});

// Load and display gallery
async function loadGallery() {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '<p class="loading">Loading images...</p>';

    try {
        const querySnapshot = await getDocs(collection(db, "user_uploads"));
        
        if (querySnapshot.empty) {
            gallery.innerHTML = '<p class="loading">No images uploaded yet</p>';
            return;
        }
        
        gallery.innerHTML = '';
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            
            galleryItem.innerHTML = `
                <img src="${data.image}" alt="User uploaded image" loading="lazy">
                <div class="gallery-overlay">
                    <div class="user-info">
                        <div>
                            <strong>${data.username}</strong>
                            <br>
                            <small>@${data.socialUsername}</small>
                        </div>
                    </div>
                    <button class="download-btn" onclick="downloadImage('${data.image}', '${data.username}')">
                        Download
                    </button>
                </div>
            `;
            
            gallery.appendChild(galleryItem);
        });
        
    } catch (error) {
        console.error("Error loading gallery: ", error);
        gallery.innerHTML = '<p class="loading">Error loading images</p>';
    }
}

// Download image function
window.downloadImage = function(imageUrl, username) {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${username}_image.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.style.display = 'none';
    }
    if (e.target === uploadModal) {
        uploadModal.style.display = 'none';
    }
});

// Initial gallery load
loadGallery();
