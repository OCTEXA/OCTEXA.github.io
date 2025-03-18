import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCFYIaJ-3yl-QTMWv3OVHIpaLjoRmDe5i8",
    authDomain: "scores-524a7.firebaseapp.com",
    projectId: "scores-524a7",
    storageBucket: "scores-524a7.firebaseapp.com",
    messagingSenderId: "575790497654",
    appId: "1:575790497654:web:2363f54cf8e1a8abb88457",
    measurementId: "G-FKS4PV3G56"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore();

const matchRef = doc(db, "scores", "match");

onSnapshot(matchRef, (docSnap) => {
    if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.live) {
            document.getElementById("matchStatus").innerText = "Match Live";
            document.getElementById("team1Name").innerText = data.team1;
            document.getElementById("team2Name").innerText = data.team2;
            document.getElementById("battingTeam").innerText = `Batting: ${data.battingTeam}`;
            document.getElementById("bestPlayer").innerText = `Best Player: ${data.bestPlayer}`;
            document.getElementById("scoreTeam1").innerText = `Score: ${data.runsTeam1}`;
            document.getElementById("scoreTeam2").innerText = `Score: ${data.runsTeam2}`;
            document.getElementById("overs").innerText = `Overs: ${data.overs}`;
            document.getElementById("remainingOvers").innerText = `Remaining Overs: ${data.remainingOvers}`;
            document.getElementById("currentBatter").innerText = `Current Batter: ${data.currentBatter}`;

            updatePlayerTable("team1Table", data.team1Players);
            updatePlayerTable("team2Table", data.team2Players);
        } else {
            document.getElementById("matchStatus").innerText = "Match Not Live";
        }
    }
});

function updatePlayerTable(tableId, players) {
    const tableBody = document.getElementById(tableId);
    tableBody.innerHTML = ""; 

    if (players && Array.isArray(players)) {
        players.sort((a, b) => b.runs - a.runs); 

        players.forEach((player) => {
            const row = document.createElement("tr");
            row.innerHTML = `<td>${player.name}</td><td>${player.runs}</td>`;
            tableBody.appendChild(row);
        });
    }
}