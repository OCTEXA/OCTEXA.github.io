import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, deleteUser, reauthenticateWithCredential, EmailAuthProvider, sendEmailVerification } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, getDocs, query, where, serverTimestamp, deleteDoc, writeBatch } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Firebase configuration
import { firebaseConfig, IMGBB_API_KEY } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

// EmailJS Configuration - You need to set these up at https://www.emailjs.com/
const EMAILJS_SERVICE_ID = 'service_jv5lemv'; // Replace with your EmailJS service ID
const EMAILJS_TEMPLATE_ID = 'template_m2v2cez'; // Replace with your EmailJS template ID  
const EMAILJS_PUBLIC_KEY = 'ZibaA4Tluk4GHqGOH'; // Replace with your EmailJS public key

let currentUser = null;
let deleteVerificationCode = null;

// DOM Elements
const loginModal = document.getElementById('loginModal');
const uploadModal = document.getElementById('uploadModal');
const resetPasswordModal = document.getElementById('resetPasswordModal');
const deleteWarningModal = document.getElementById('deleteWarningModal');
const emailVerificationModal = document.getElementById('emailVerificationModal');
const loginBtn = document.getElementById('loginBtn');
const uploadBtn = document.getElementById('uploadBtn');
const logoutBtn = document.getElementById('logoutBtn');
const homeBtn = document.getElementById('homeBtn');
const loginPrompt = document.getElementById('loginPrompt');
const guestView = document.getElementById('guestView');
const userView = document.getElementById('userView');

// Initialize EmailJS when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Load EmailJS
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
    script.onload = () => {
        if (window.emailjs && EMAILJS_PUBLIC_KEY !== 'your_public_key') {
            emailjs.init(EMAILJS_PUBLIC_KEY);
            console.log('EmailJS initialized');
        } else {
            console.warn('EmailJS not configured. Please set up EmailJS credentials.');
        }
    };
    document.head.appendChild(script);
});

// Navigation
homeBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
});

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

document.getElementById('guestLoginBtn').addEventListener('click', () => {
    loginModal.style.display = 'flex';
});

uploadBtn.addEventListener('click', () => {
    uploadModal.style.display = 'flex';
});

document.getElementById('uploadNewBtn').addEventListener('click', () => {
    uploadModal.style.display = 'flex';
});

document.getElementById('resetPasswordBtn').addEventListener('click', () => {
    if (currentUser && currentUser.email) {
        document.getElementById('resetEmail').value = currentUser.email;
    }
    resetPasswordModal.style.display = 'flex';
});

// Delete Account Button Event Listener
document.getElementById('deleteAccountBtn').addEventListener('click', () => {
    deleteWarningModal.style.display = 'flex';
});

// Delete Warning Modal Events
document.getElementById('cancelDelete').addEventListener('click', () => {
    deleteWarningModal.style.display = 'none';
});

document.getElementById('confirmDelete').addEventListener('click', () => {
    deleteWarningModal.style.display = 'none';
    initiateAccountDeletion();
});

// Email Verification Modal Events
document.getElementById('resendCode').addEventListener('click', () => {
    sendVerificationCode();
});

document.getElementById('verifyAndDelete').addEventListener('click', () => {
    verifyCodeAndDeleteAccount();
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
        guestView.style.display = 'none';
        userView.style.display = 'block';
        
        // Update profile information
        updateUserProfile();
        loadUserImages();
        
    } else {
        currentUser = null;
        // Update UI for logged out user
        loginBtn.style.display = 'block';
        uploadBtn.style.display = 'none';
        logoutBtn.style.display = 'none';
        loginPrompt.style.display = 'flex';
        guestView.style.display = 'block';
        userView.style.display = 'none';
    }
});

// Update user profile display
function updateUserProfile() {
    if (currentUser && currentUser.userData) {
        const fullName = `${currentUser.userData.firstName} ${currentUser.userData.lastName}`;
        const initials = `${currentUser.userData.firstName.charAt(0)}${currentUser.userData.lastName.charAt(0)}`;
        
        document.getElementById('userName').textContent = fullName;
        document.getElementById('userEmail').textContent = currentUser.userData.email;
        document.getElementById('userInitials').textContent = initials.toUpperCase();
    }
}

// Message display function
function showMessage(message, elementId, isSuccess = false) {
    const messageDiv = document.getElementById(elementId);
    if (!messageDiv) return;
    
    messageDiv.style.display = "block";
    messageDiv.innerHTML = message;
    
    // Change color for success messages
    if (isSuccess) {
        messageDiv.style.background = "rgba(34, 197, 94, 0.2)";
        messageDiv.style.color = "#22c55e";
        messageDiv.style.borderColor = "rgba(34, 197, 94, 0.3)";
    } else {
        messageDiv.style.background = "rgba(255, 68, 68, 0.2)";
        messageDiv.style.color = "#ff6b6b";
        messageDiv.style.borderColor = "rgba(255, 107, 107, 0.3)";
    }
    
    setTimeout(() => {
        messageDiv.style.display = "none";
    }, 5000);
}

// Generate random 6-digit verification code
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send verification code via EmailJS
async function sendVerificationCode() {
    if (!currentUser || !currentUser.email) {
        showMessage('User not found', 'verificationMessage');
        return;
    }

    try {
        // Generate verification code
        deleteVerificationCode = generateVerificationCode();
        
        // Display user's email
        document.getElementById('verificationEmail').textContent = currentUser.email;
        
        // Check if EmailJS is configured and initialized
        if (!window.emailjs || EMAILJS_SERVICE_ID === 'your_service_id' || !EMAILJS_PUBLIC_KEY || EMAILJS_PUBLIC_KEY === 'your_public_key') {
            // Fallback: Show code in alert for demo/testing
            console.log('Verification Code:', deleteVerificationCode);
            alert(`Demo Mode: Your verification code is ${deleteVerificationCode}\n\nTo enable real email sending, please configure EmailJS in the code.`);
            showMessage('Demo: Verification code shown in alert! (Configure EmailJS for real emails)', 'verificationMessage', true);
            return;
        }
        
        // Prepare template parameters with multiple variations to handle different template setups
        const templateParams = {
            // Primary parameters
            to_email: currentUser.email,
            to_name: currentUser.userData?.firstName || 'User',
            user_name: currentUser.userData?.firstName || 'User',
            verification_code: deleteVerificationCode,
            from_name: 'Photo Gallery App',
            // Alternative parameter names for different template configurations
            recipient_email: currentUser.email,
            email: currentUser.email,
            user_email: currentUser.email,
            reply_to: currentUser.email,
            // Message content
            message: `Your verification code for account deletion is: ${deleteVerificationCode}`,
            subject: 'Account Deletion Verification Code'
        };
        
        console.log('Sending email with params:', {
            service: EMAILJS_SERVICE_ID,
            template: EMAILJS_TEMPLATE_ID,
            to_email: currentUser.email,
            verification_code: deleteVerificationCode
        });
        
        // Send email using EmailJS
        const response = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
        
        console.log('EmailJS response:', response);
        
        if (response.status === 200) {
            showMessage('Verification code sent to your email!', 'verificationMessage', true);
        } else {
            throw new Error(`EmailJS returned status: ${response.status}`);
        }
        
    } catch (error) {
        console.error('Error sending verification code:', error);
        
        // Enhanced error handling
        if (error.status === 422) {
            console.error('EmailJS Template Error - Check your template configuration');
            console.error('Template might be missing recipient field or using different parameter names');
            showMessage('Email template configuration error. Using demo mode instead.', 'verificationMessage');
        } else if (error.status === 400) {
            console.error('EmailJS Bad Request - Check service ID and template ID');
            showMessage('Email service configuration error. Using demo mode instead.', 'verificationMessage');
        } else if (error.status === 403) {
            console.error('EmailJS Forbidden - Check your public key and service permissions');
            showMessage('Email service permissions error. Using demo mode instead.', 'verificationMessage');
        } else {
            console.error('General EmailJS error:', error.message || error);
            showMessage('Email service temporarily unavailable. Using demo mode instead.', 'verificationMessage');
        }
        
        // Always provide fallback with verification code
        console.log('Verification Code (fallback):', deleteVerificationCode);
        
        // Show code in alert as fallback
        setTimeout(() => {
            alert(`Email Error - Your verification code is: ${deleteVerificationCode}\n\nPlease use this code to proceed with account deletion.`);
        }, 1000);
    }
}

// Re-authentication helper function
async function reauthenticateUser() {
    return new Promise((resolve, reject) => {
        const password = prompt('For security, please enter your current password:');
        if (!password) {
            reject(new Error('Password required for account deletion'));
            return;
        }
        
        const credential = EmailAuthProvider.credential(currentUser.email, password);
        reauthenticateWithCredential(currentUser, credential)
            .then(() => {
                console.log('User re-authenticated successfully');
                resolve();
            })
            .catch((error) => {
                console.error('Re-authentication failed:', error);
                reject(error);
            });
    });
}

// Initiate account deletion process
async function initiateAccountDeletion() {
    if (!currentUser) {
        alert('No user logged in');
        return;
    }

    // Send verification code and show email verification modal
    await sendVerificationCode();
    emailVerificationModal.style.display = 'flex';
}

// Verify code and delete account
async function verifyCodeAndDeleteAccount() {
    const enteredCode = document.getElementById('verificationCode').value.trim();
    
    if (!enteredCode) {
        showMessage('Please enter the verification code', 'verificationMessage');
        return;
    }
    
    if (enteredCode !== deleteVerificationCode) {
        showMessage('Invalid verification code. Please try again.', 'verificationMessage');
        return;
    }
    
    // Code is correct, proceed with account deletion
    try {
        // Show loading state
        const verifyButton = document.getElementById('verifyAndDelete');
        const originalText = verifyButton.textContent;
        verifyButton.textContent = 'Deleting Account...';
        verifyButton.disabled = true;
        
        // Try to re-authenticate user for security
        try {
            await reauthenticateUser();
        } catch (reauthError) {
            if (reauthError.message !== 'Password required for account deletion') {
                console.log('Re-authentication failed, but proceeding with deletion...');
            } else {
                // Reset button and return
                verifyButton.textContent = originalText;
                verifyButton.disabled = false;
                return;
            }
        }
        
        // Delete all user's uploaded images from Firestore
        await deleteUserData();
        
        // Delete user account from Firebase Auth
        await deleteUser(currentUser);
        
        // Close modal and redirect
        emailVerificationModal.style.display = 'none';
        
        // Show success message and redirect
        alert('Account deleted successfully. You will be redirected to the home page.');
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Error deleting account:', error);
        
        // Reset button
        const verifyButton = document.getElementById('verifyAndDelete');
        verifyButton.textContent = 'Verify & Delete Account';
        verifyButton.disabled = false;
        
        if (error.code === 'auth/requires-recent-login') {
            showMessage('For security reasons, please sign out and sign back in, then try deleting your account again.', 'verificationMessage');
        } else if (error.code === 'auth/user-not-found') {
            showMessage('User account not found. You may already be signed out.', 'verificationMessage');
        } else {
            showMessage(`Failed to delete account: ${error.message || 'Please try again.'}`, 'verificationMessage');
        }
    }
}

// Delete all user data from Firestore
async function deleteUserData() {
    if (!currentUser) return;
    
    try {
        // Get all user's uploaded images
        const q = query(
            collection(db, "user_uploads"), 
            where("email", "==", currentUser.email)
        );
        const querySnapshot = await getDocs(q);
        
        // Create batch for deletion
        const batch = writeBatch(db);
        
        // Add all user's images to batch deletion
        querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });
        
        // Delete user profile document
        const userDocRef = doc(db, "users", currentUser.uid);
        batch.delete(userDocRef);
        
        // Commit the batch
        await batch.commit();
        
        console.log('User data deleted successfully');
        
    } catch (error) {
        console.error('Error deleting user data:', error);
        throw error;
    }
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
        showMessage('Account Created Successfully', 'signUpMessage', true);
        
        // Close modal after successful signup
        setTimeout(() => {
            loginModal.style.display = 'none';
        }, 1000);
        
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            showMessage('Email Address Already Exists!', 'signUpMessage');
        } else if (error.code === 'auth/weak-password') {
            showMessage('Password should be at least 6 characters', 'signUpMessage');
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
        showMessage('Login successful', 'signInMessage', true);
        
        // Close modal after successful login
        setTimeout(() => {
            loginModal.style.display = 'none';
        }, 1000);
        
    } catch (error) {
        if (error.code === 'auth/invalid-credential') {
            showMessage('Incorrect Email or Password', 'signInMessage');
        } else if (error.code === 'auth/too-many-requests') {
            showMessage('Too many failed attempts. Please try again later.', 'signInMessage');
        } else {
            showMessage('Account does not exist', 'signInMessage');
        }
    }
});

// Reset Password
document.getElementById('submitResetPassword').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('resetEmail').value;

    if (!email) {
        showMessage('Please enter your email address', 'resetMessage');
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        showMessage('Password reset link sent to your email!', 'resetMessage', true);
        
        setTimeout(() => {
            resetPasswordModal.style.display = 'none';
        }, 2000);
        
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            showMessage('No account found with this email address', 'resetMessage');
        } else {
            showMessage('Failed to send reset email. Please try again.', 'resetMessage');
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
                
                const docRef = await addDoc(collection(db, "user_uploads"), {
                    userId: currentUser.uid,
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
                
                // Close modal and reload user images
                setTimeout(() => {
                    uploadModal.style.display = 'none';
                    loadUserImages();
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

// Load user's images
async function loadUserImages() {
    const userGallery = document.getElementById('userGallery');
    const imageCountElement = document.getElementById('imageCount');
    
    if (!currentUser || !currentUser.email) {
        userGallery.innerHTML = '<p class="loading">Please log in to view your images</p>';
        imageCountElement.textContent = '0';
        return;
    }

    userGallery.innerHTML = '<p class="loading">Loading your images...</p>';

    try {
        // Query by email instead of userId for better consistency
        const q = query(
            collection(db, "user_uploads"), 
            where("email", "==", currentUser.email)
        );
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            userGallery.innerHTML = `
                <div class="no-images">
                    <h4>No images uploaded yet</h4>
                    <p>Start sharing your amazing photos with the world!</p>
                    <button onclick="document.getElementById('uploadModal').style.display = 'flex'">
                        Upload Your First Image
                    </button>
                </div>
            `;
            imageCountElement.textContent = '0';
            return;
        }
        
        userGallery.innerHTML = '';
        let imageCount = 0;
        
        // Convert to array and sort by timestamp (newest first)
        const docs = [];
        querySnapshot.forEach((doc) => {
            docs.push({ id: doc.id, data: doc.data() });
        });
        
        // Sort by timestamp (newest first)
        docs.sort((a, b) => {
            const timeA = a.data.timestamp?.toDate?.() || new Date(0);
            const timeB = b.data.timestamp?.toDate?.() || new Date(0);
            return timeB - timeA;
        });
        
        docs.forEach(({ id: docId, data }) => {
            imageCount++;
            
            const galleryItem = document.createElement('div');
            galleryItem.className = 'user-gallery-item';
            
            // Format timestamp
            let timeString = 'Recently';
            if (data.timestamp && data.timestamp.toDate) {
                const date = data.timestamp.toDate();
                timeString = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            }
            
            // Get social username display
            const socialDisplay = data.socialUsername && data.socialUsername !== "Not Provided" 
                ? `@${data.socialUsername}` 
                : 'No Instagram';
            
            galleryItem.innerHTML = `
                <img src="${data.image}" alt="Your uploaded image" loading="lazy">
                <div class="user-gallery-overlay">
                    <div class="image-info">
                        <small>Uploaded on ${timeString}</small>
                        <br>
                        <small>Instagram: ${socialDisplay}</small>
                    </div>
                    <div class="image-actions">
                        <button class="image-btn download" onclick="downloadImage('${data.image}', '${data.username || 'image'}')">
                            Download
                        </button>
                        <button class="image-btn delete" onclick="deleteImage('${docId}', this)">
                            Delete
                        </button>
                    </div>
                </div>
            `;
            
            userGallery.appendChild(galleryItem);
        });
        
        imageCountElement.textContent = imageCount.toString();
        
    } catch (error) {
        console.error("Error loading user images: ", error);
        userGallery.innerHTML = '<p class="loading">Error loading your images. Please try refreshing the page.</p>';
        imageCountElement.textContent = '0';
    }
}

// Delete image function
window.deleteImage = async function(docId, buttonElement) {
    if (!confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
        return;
    }
    
    const originalText = buttonElement.textContent;
    buttonElement.textContent = 'Deleting...';
    buttonElement.disabled = true;
    
    try {
        await deleteDoc(doc(db, "user_uploads", docId));
        
        // Remove the gallery item from DOM with animation
        const galleryItem = buttonElement.closest('.user-gallery-item');
        galleryItem.style.transition = 'all 0.3s ease';
        galleryItem.style.opacity = '0';
        galleryItem.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            galleryItem.remove();
            
            // Update image count
            const currentCount = parseInt(document.getElementById('imageCount').textContent);
            const newCount = Math.max(0, currentCount - 1);
            document.getElementById('imageCount').textContent = newCount.toString();
            
            // Check if no images left
            if (newCount === 0) {
                loadUserImages(); // Reload to show no images message
            }
        }, 300);
        
    } catch (error) {
        console.error("Error deleting image: ", error);
        buttonElement.textContent = originalText;
        buttonElement.disabled = false;
        alert('Failed to delete image. Please try again.');
    }
};

// Download image function
window.downloadImage = function(imageUrl, username) {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${username}_image_${Date.now()}.jpg`;
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
    if (e.target === resetPasswordModal) {
        resetPasswordModal.style.display = 'none';
    }
    if (e.target === deleteWarningModal) {
        deleteWarningModal.style.display = 'none';
    }
    if (e.target === emailVerificationModal) {
        emailVerificationModal.style.display = 'none';
    }
});

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            guestView.style.display = 'block';
            userView.style.display = 'none';
        }
    });
});