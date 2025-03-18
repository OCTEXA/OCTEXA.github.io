import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, setDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCFYIaJ-3yl-QTMWv3OVHIpaLjoRmDe5i8",
    authDomain: "scores-524a7.firebaseapp.com",
    projectId: "scores-524a7",
    storageBucket: "scores-524a7.firebasestorage.app",
    messagingSenderId: "575790497654",
    appId: "1:575790497654:web:2363f54cf8e1a8abb88457",
    measurementId: "G-FKS4PV3G56"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const loggedInUserId = localStorage.getItem('loggedInUserId');
        if (loggedInUserId) {
            const docRef = doc(db, "users", loggedInUserId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const userData = docSnap.data();
                document.getElementById('adminName').innerText = userData.firstName;
                if (userData.firstName !== "shreyansh") {
                    alert("Access Denied");
                    window.location.href = "index.html";
                }
            }
        }
    } else {
        window.location.href = "index.html";
    }
});

// Toggle Match Live Status
document.getElementById("liveMatchToggle").addEventListener("change", async (e) => {
    const isLive = e.target.checked;
    document.getElementById("matchDetails").style.display = isLive ? "block" : "none";
    await setDoc(doc(db, "scores", "match"), { live: isLive }, { merge: true });
});

// Save Match Data
document.getElementById("saveData").addEventListener("click", async () => {
    const team1Players = getPlayersData("team1Table");
    const team2Players = getPlayersData("team2Table");

    const matchData = {
        live: document.getElementById("liveMatchToggle").checked,
        team1: document.getElementById("team1").value,
        team2: document.getElementById("team2").value,
        battingTeam: document.getElementById("battingTeam").value,
        runsTeam1: parseInt(document.getElementById("runsTeam1").value) || 0,
        runsTeam2: parseInt(document.getElementById("runsTeam2").value) || 0,
        bestPlayer: document.getElementById("bestPlayer").value,
        totalOvers: parseInt(document.getElementById("totalOvers").value) || 0,
        remainingOvers: parseInt(document.getElementById("remainingOvers").value) || 0,
        team1Players,
        team2Players
    };

    await setDoc(doc(db, "scores", "match"), matchData, { merge: true });
    alert("Match data updated");
});

// Function to Get Players Data
function getPlayersData(tableId) {
    const table = document.getElementById(tableId);
    const rows = table.getElementsByTagName("tr");
    const players = [];

    for (let i = 1; i < rows.length; i++) {
        const name = rows[i].cells[0].querySelector("input").value;
        const runs = parseInt(rows[i].cells[1].querySelector("input").value) || 0;
        if (name) players.push({ name, runs });
    }

    return players;
}

// Populate Player Tables from Firestore
async function loadMatchData() {
    const docRef = doc(db, "scores", "match");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        document.getElementById("liveMatchToggle").checked = data.live || false;
        document.getElementById("matchDetails").style.display = data.live ? "block" : "none";

        document.getElementById("team1").value = data.team1 || "";
        document.getElementById("team2").value = data.team2 || "";
        document.getElementById("battingTeam").value = data.battingTeam || "";
        document.getElementById("runsTeam1").value = data.runsTeam1 || 0;
        document.getElementById("runsTeam2").value = data.runsTeam2 || 0;
        document.getElementById("bestPlayer").value = data.bestPlayer || "";
        document.getElementById("totalOvers").value = data.totalOvers || 0;
        document.getElementById("remainingOvers").value = data.remainingOvers || 0;

        populatePlayersTable("team1Table", data.team1Players || []);
        populatePlayersTable("team2Table", data.team2Players || []);
    }
}

// Function to Populate Players Table
function populatePlayersTable(tableId, players) {
    const table = document.getElementById(tableId);
    table.innerHTML = `<tr><th>Player Name</th><th>Runs</th></tr>`; 
    for (let i = 0; i < 11; i++) {
        const player = players[i] || { name: "", runs: 0 };
        table.innerHTML += `
            <tr>
                <td><input type="text" value="${player.name}"></td>
                <td><input type="number" value="${player.runs}"></td>
            </tr>
        `;
    }
}

// Load match data on page load
loadMatchData();

// Logout
document.getElementById("logout").addEventListener("click", () => {
    localStorage.removeItem("loggedInUserId");
    signOut(auth).then(() => window.location.href = "index.html");
});