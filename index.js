import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Firebase configuration
import { firebaseConfig, IMGBB_API_KEY } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

// EmailJS Configuration - Set these up at https://www.emailjs.com/
const EMAILJS_SERVICE_ID = 'service_jv5lemv'; // Replace with your EmailJS service ID
const EMAILJS_WELCOME_TEMPLATE_ID = 'template_5h4ij5g'; // Replace with your welcome template ID  
const EMAILJS_PUBLIC_KEY = 'ZibaA4Tluk4GHqGOH'; // Replace with your EmailJS public key

let currentUser = null;
let isEmailJSInitialized = false;

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

// Initialize EmailJS function
async function initializeEmailJS() {
    if (isEmailJSInitialized) {
        console.log('EmailJS already initialized');
        return;
    }

    try {
        console.log('Initializing EmailJS...');
        
        // Load EmailJS if not already loaded
        if (!window.emailjs) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
            
            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

        // Initialize EmailJS with public key
        if (window.emailjs && EMAILJS_PUBLIC_KEY && EMAILJS_PUBLIC_KEY !== 'your_public_key') {
            emailjs.init(EMAILJS_PUBLIC_KEY);
            isEmailJSInitialized = true;
            console.log('EmailJS initialized successfully');
        } else {
            console.warn('EmailJS not configured. Please set up EmailJS credentials.');
        }
    } catch (error) {
        console.error('Error initializing EmailJS:', error);
    }
}

// Send welcome email function
async function sendWelcomeEmail(userEmail, firstName) {
    console.log('Attempting to send welcome email to:', userEmail);
    
    try {
        // Check if EmailJS is configured and initialized
        if (!window.emailjs || !isEmailJSInitialized) {
            console.warn('EmailJS not initialized. Attempting to initialize...');
            await initializeEmailJS();
        }

        if (!isEmailJSInitialized || EMAILJS_SERVICE_ID === 'your_service_id' || !EMAILJS_PUBLIC_KEY || EMAILJS_PUBLIC_KEY === 'your_public_key') {
            // Fallback: Log for demo/testing
            console.log('Demo Mode: Welcome email would be sent to:', userEmail);
            console.log('Welcome email content for:', firstName);
            return;
        }
        
        // Prepare template parameters for welcome email
        const templateParams = {
            // Primary parameters
            to_email: userEmail,
            to_name: firstName,
            user_name: firstName,
            username: firstName,
            recipient_name: firstName,
            from_name: 'Pixyshare Team',
            // Alternative parameter names for different template configurations
            recipient_email: userEmail,
            email: userEmail,
            user_email: userEmail,
            reply_to: userEmail,
            // Message content
            subject: 'Welcome to Pixyshare - Your Journey Begins!',
            message: `Welcome to Pixyshare, ${firstName}! We're excited to have you join our community.`
        };
        
        console.log('Sending welcome email with params:', {
            service: EMAILJS_SERVICE_ID,
            template: EMAILJS_WELCOME_TEMPLATE_ID,
            to_email: userEmail,
            username: firstName
        });
        
        // Send email using EmailJS
        const response = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_WELCOME_TEMPLATE_ID, templateParams);
        
        console.log('EmailJS welcome email response:', response);
        
        if (response.status === 200) {
            console.log('Welcome email sent successfully to:', userEmail);
        } else {
            throw new Error(`EmailJS returned status: ${response.status}`);
        }
        
    } catch (error) {
        console.error('Error sending welcome email:', error);
        
        // Enhanced error handling
        if (error.status === 422) {
            console.error('EmailJS Template Error - Check your welcome template configuration');
            console.error('Template might be missing recipient field or using different parameter names');
        } else if (error.status === 400) {
            console.error('EmailJS Bad Request - Check service ID and template ID');
        } else if (error.status === 403) {
            console.error('EmailJS Forbidden - Check your public key and service permissions');
        } else {
            console.error('General EmailJS error:', error.message || error);
        }
        
        // Log fallback information
        console.log('Welcome email fallback - would send to:', userEmail, 'for user:', firstName);
    }
}

// Show/hide forms with EmailJS initialization
document.getElementById('showSignUp').addEventListener('click', async () => {
    console.log('User clicked Sign Up - initializing EmailJS...');
    document.getElementById('signInForm').style.display = 'none';
    document.getElementById('signUpForm').style.display = 'block';
    
    // Initialize EmailJS when user shows interest in signing up
    await initializeEmailJS();
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

// Sign Up with Welcome Email
document.getElementById('submitSignUp').addEventListener('click', async (e) => {
    e.preventDefault();
    console.log('User clicked Create Account button');
    
    const email = document.getElementById('rEmail').value;
    const password = document.getElementById('rPassword').value;
    const firstName = document.getElementById('fName').value;
    const lastName = document.getElementById('lName').value;

    // Validate inputs
    if (!email || !password || !firstName || !lastName) {
        showMessage('Please fill in all fields', 'signUpMessage');
        return;
    }

    console.log('Creating account for:', email, 'Name:', firstName, lastName);

    try {
        // Send welcome email BEFORE creating the account (since page will refresh after account creation)
        console.log('Sending welcome email before account creation...');
        await sendWelcomeEmail(email, firstName);
        
        // Create user account
        console.log('Creating Firebase user account...');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        const userData = {
            email: email,
            firstName: firstName,
            lastName: lastName
        };
        
        // Save user data to Firestore
        console.log('Saving user data to Firestore...');
        await setDoc(doc(db, "users", user.uid), userData);
        
        console.log('Account created successfully for:', email);
        showMessage('Account Created Successfully! Welcome email sent.', 'signUpMessage');
        
        // Close modal after successful signup
        setTimeout(() => {
            loginModal.style.display = 'none';
        }, 1000);
        
    } catch (error) {
        console.error('Error during sign up process:', error);
        
        if (error.code === 'auth/email-already-in-use') {
            showMessage('Email Address Already Exists!', 'signUpMessage');
        } else if (error.code === 'auth/weak-password') {
            showMessage('Password should be at least 6 characters', 'signUpMessage');
        } else if (error.code === 'auth/invalid-email') {
            showMessage('Please enter a valid email address', 'signUpMessage');
        } else {
            showMessage('Unable to create user: ' + (error.message || 'Unknown error'), 'signUpMessage');
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
