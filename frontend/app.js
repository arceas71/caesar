import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth,
    signInAnonymously
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


const firebaseConfig = {
    apiKey: "AIzaSyDE8Mraj8_lnhbDgffb9S51mt5rb8FSV4",
    authDomain: "caesar-e3fc3.firebaseapp.com",
    projectId: "caesar-e3fc3",
    storageBucket: "caesar-e3fc3.firebasestorage.app",
    messagingSenderId: "978699090575",
    appId: "1:978699090575:web:9bb0be22beb1a75acb0efa",
    measurementId: "G-94YPJ8DX07"
};


// ---------------- Firebase ----------------

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);


// ---------------- UI ----------------

const form = document.getElementById("message-form");
const input = document.getElementById("message-input");
const chat = document.getElementById("chat");
const sendButton = document.getElementById("send-button");
const welcome = document.getElementById("welcome");


// ---------------- Firebase login ----------------

async function initializeUser() {
    try {
        const result = await signInAnonymously(auth);

        console.log("Caesar Firebase connected.");
        console.log("Anonymous user ID:", result.user.uid);

        input.focus();

    } catch (error) {
        console.error("Firebase authentication failed:", error);
    }
}


// ---------------- Messages ----------------

function addMessage(text, type) {
    const message = document.createElement("div");

    message.classList.add(
        "message",
        `${type}-message`
    );

    message.textContent = text;

    chat.appendChild(message);

    chat.scrollTop = chat.scrollHeight;
}


function updateSendButton() {
    sendButton.disabled = input.value.trim() === "";
}


// ---------------- Sending ----------------

form.addEventListener("submit", function (event) {
    event.preventDefault();

    const text = input.value.trim();

    if (!text) {
        return;
    }

    if (welcome) {
        welcome.remove();
    }

    addMessage(text, "user");

    input.value = "";

    updateSendButton();

    input.focus();
});


input.addEventListener("input", updateSendButton);


// ---------------- Start ----------------

updateSendButton();

initializeUser();