import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, onSnapshot, query, orderBy, where } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyCFYIaJ-3yl-QTMWv3OVHIpaLjoRmDe5i8",
    authDomain: "scores-524a7.firebaseapp.com",
    projectId: "scores-524a7",
    storageBucket: "scores-524a7.firebaseestorage.app",
    messagingSenderId: "575790497654",
    appId: "1:575790497654:web:2363f54cf8e1a8abb88457",
    measurementId: "G-FKS4PV3G56"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

let currentUser = null;
let currentChatRoom = null;
let userFullName = null;

// UI Elements
const userNameElement = document.getElementById("userName");
const chatRoomsDiv = document.getElementById("chatRooms");
const chatRoomsList = document.getElementById("chatroomsList");
const chatRoomUI = document.getElementById("chatRoomUI");
const chatRoomTitle = document.getElementById("chatRoomTitle");
const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendMessageBtn = document.getElementById("sendMessage");
const createChatRoomBtn = document.getElementById("createChatRoomBtn");
const createChatRoomModal = document.getElementById("createChatRoomModal");
const createChatRoom = document.getElementById("createChatRoom");
const deleteChatRoomBtn = document.getElementById("deleteChatRoom");
const backToRoomsBtn = document.getElementById("backToRooms");
const logoutBtn = document.getElementById("logout");
const chatRoomNameInput = document.getElementById("chatRoomName");
const closeModal = document.getElementsByClassName("close-modal")[0];
const bodyElement = document.body;

// Auth State
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        userNameElement.textContent = "Welcome, ...";
        
        // Get user data from Firestore
        await fetchUserData(user.email);
        
        // Load chatrooms after user data is fetched
        loadChatRooms();
    } else {
        console.log("User not signed in.");
        window.location.href = "index.html"; // Redirect to login
    }
});

// Fetch user data from Firestore
async function fetchUserData(email) {
    try {
        // Using query to find user by email
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            // User found with matching email
            const userData = querySnapshot.docs[0].data();
            userFullName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim();
            
            // Update UI with full name
            userNameElement.textContent = `Welcome, ${userFullName || email}`;
            console.log("User data loaded:", userFullName);
        } else {
            // No user found with this email, try searching without the query
            console.log("No user found with email query, trying full collection search");
            const usersSnapshot = await getDocs(collection(db, "users"));
            let userFound = false;
            
            usersSnapshot.forEach((userDoc) => {
                const userData = userDoc.data();
                if (userData.email === email) {
                    userFound = true;
                    userFullName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim();
                    userNameElement.textContent = `Welcome, ${userFullName || email}`;
                    console.log("User data loaded from full search:", userFullName);
                }
            });
            
            if (!userFound) {
                console.log("No user found in database, using email");
                userFullName = email;
                userNameElement.textContent = `Welcome, ${email}`;
            }
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        userFullName = email;
        userNameElement.textContent = `Welcome, ${email}`;
    }
}

// Logout Function
logoutBtn.addEventListener("click", () => {
    signOut(auth).then(() => {
        window.location.href = "index.html";
    }).catch((error) => {
        console.error("Error signing out:", error);
    });
});

// Load Chatrooms
async function loadChatRooms() {
    chatRoomsList.innerHTML = "";
    const querySnapshot = await getDocs(collection(db, "Chatrooms"));
    querySnapshot.forEach((doc) => {
        const chatroom = doc.data();
        const chatroomDiv = document.createElement("div");
        chatroomDiv.classList.add("chatroom-item");
        chatroomDiv.textContent = chatroom.name;
        chatroomDiv.onclick = () => enterChatRoom(doc.id, chatroom);
        chatRoomsList.appendChild(chatroomDiv);
    });
}

// Modal Functions
createChatRoomBtn.addEventListener("click", () => {
    createChatRoomModal.style.display = "block";
    chatRoomNameInput.focus();
});

closeModal.addEventListener("click", () => {
    createChatRoomModal.style.display = "none";
});

// Close modal when clicking outside of it
window.addEventListener("click", (event) => {
    if (event.target === createChatRoomModal) {
        createChatRoomModal.style.display = "none";
    }
});

// Create New Chatroom
createChatRoom.addEventListener("click", async () => {
    const chatRoomName = chatRoomNameInput.value.trim();
    if (!chatRoomName) {
        alert("Enter a chatroom name!");
        return;
    }

    try {
        await addDoc(collection(db, "Chatrooms"), {
            name: chatRoomName,
            creator: currentUser.email,
            timestamp: Date.now()
        });

        chatRoomNameInput.value = ""; // Clear input
        createChatRoomModal.style.display = "none"; // Close modal
        loadChatRooms(); // Refresh chatroom list
    } catch (error) {
        console.error("Error creating chatroom:", error);
    }
});

// Enter Chatroom
async function enterChatRoom(chatRoomId, chatroom) {
    currentChatRoom = chatRoomId;
    
    // Hide header and make chatroom fullscreen
    bodyElement.classList.add("chatroom-mode");
    
    chatRoomUI.style.display = "block";
    chatRoomsDiv.style.display = "none";
    chatRoomTitle.textContent = chatroom.name;

    // Show delete button only for creator
    deleteChatRoomBtn.style.display = (currentUser.email === chatroom.creator) ? "block" : "none";

    loadMessages(chatRoomId);
    
    // Focus on message input
    setTimeout(() => {
        messageInput.focus();
    }, 300);
}

// Format timestamp
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Load Messages in Chatroom
function loadMessages(chatRoomId) {
    messagesDiv.innerHTML = "";

    const chatRoomRef = collection(db, `Chatrooms/${chatRoomId}/messages`);
    // Create a query with orderBy to sort messages by timestamp
    const messagesQuery = query(chatRoomRef, orderBy("timestamp", "asc"));
    
    onSnapshot(messagesQuery, (snapshot) => {
        messagesDiv.innerHTML = "";
        snapshot.forEach((doc) => {
            const message = doc.data();
            const messageDiv = document.createElement("div");
            const time = formatTimestamp(message.timestamp);
            
            // Determine if message is from current user to style differently
            const isCurrentUser = message.username === userFullName || 
                                 (message.username === currentUser.email && !userFullName);
            
            if (isCurrentUser) {
                messageDiv.style.marginLeft = "auto";
                messageDiv.style.backgroundColor = "rgba(0, 122, 255, 0.5)";
                messageDiv.style.borderTopRightRadius = "4px";
            } else {
                messageDiv.style.marginRight = "auto";
                messageDiv.style.borderTopLeftRadius = "4px";
            }
            
            messageDiv.innerHTML = `<strong>${message.username}</strong> <span style="color: #999; font-size: 0.8em;">[${time}]</span>: ${message.text}`;
            messagesDiv.appendChild(messageDiv);
        });
        
        // Auto scroll to the bottom of messages
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
}

// Send Message
sendMessageBtn.addEventListener("click", async () => {
    sendMessage();
});

// Also send message on Enter key press
messageInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        sendMessage();
    }
});

// Send message function
async function sendMessage() {
    const messageText = messageInput.value.trim();
    if (!messageText) return;

    // Use the userFullName variable that was set during fetchUserData
    const username = userFullName || currentUser.email || "User";

    await addDoc(collection(db, `Chatrooms/${currentChatRoom}/messages`), {
        username: username,
        text: messageText,
        timestamp: Date.now()
    });

    messageInput.value = "";
    messageInput.focus();
}

// Delete Chatroom (Only if user is the creator)
deleteChatRoomBtn.addEventListener("click", async () => {
    if (confirm("Are you sure you want to delete this chatroom?")) {
        try {
            await deleteDoc(doc(db, "Chatrooms", currentChatRoom));
            exitChatRoom();
            loadChatRooms(); // Refresh list
        } catch (error) {
            console.error("Error deleting chatroom:", error);
        }
    }
});

// Exit chatroom function (to keep code DRY)
function exitChatRoom() {
    chatRoomUI.style.display = "none";
    chatRoomsDiv.style.display = "block";
    bodyElement.classList.remove("chatroom-mode"); // Show header elements again
}

// Back to Chatrooms
backToRoomsBtn.addEventListener("click", () => {
    exitChatRoom();
});