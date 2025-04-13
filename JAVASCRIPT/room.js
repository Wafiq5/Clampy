import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase, ref } from "firebase/database";
import { onValue, set, update } from "firebase/database";

console.log("Hello from room.js module");
const firebaseConfig = {
    apiKey: "AIzaSyB4U13Kf-PP--im4SI0TER656-jPMS9iQ0",
    authDomain: "clampy-b04e2.firebaseapp.com",
    databaseURL: "https://clampy-b04e2-default-rtdb.firebaseio.com",
    projectId: "clampy-b04e2",
    storageBucket: "clampy-b04e2.firebasestorage.app",
    messagingSenderId: "77812734289",
    appId: "1:77812734289:web:f35835e2d88de31e45db70",
    measurementId: "G-28MJKFRFS1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const database = getDatabase(app);

const roomRef = ref(database, 'rooms');

// Current user's room variable
let currentUserRoom = null;

// Helper function to create a new room with the enhanced structure
function createNewRoom(roomName, firstUserId) {
    const newRoomRef = ref(database, `rooms/${roomName}/users`);
    set(newRoomRef, { [firstUserId]: true });
}

// This will be used by the module version
function moduleAddToRoom() {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    onValue(roomRef, (snapshot) => {
        const rooms = snapshot.val();

        if (rooms) {
            const roomNames = Object.keys(rooms);
            const lastRoomName = roomNames[roomNames.length - 1];
            const lastRoom = rooms[lastRoomName];

            // Check if the room has less than 4 users
            const users = lastRoom.users || {};
            const userCount = Object.keys(users).length;

            if (userCount < 4) {
                const userRef = ref(database, `rooms/${lastRoomName}/users`);
                update(userRef, { [userId]: true });
                
                // Store the room assignment
                localStorage.setItem("userRoom", lastRoomName);
                currentUserRoom = lastRoomName;
            } else {
                // Create a new room if last one is full
                const newRoomName = `room_${roomNames.length + 1}`;
                createNewRoom(newRoomName, userId);
                
                // Store the room assignment
                localStorage.setItem("userRoom", newRoomName);
                currentUserRoom = newRoomName;
            }
        } else {
            // No rooms exist yet — create room_1
            createNewRoom('room_1', userId);
            
            // Store the room assignment
            localStorage.setItem("userRoom", "room_1");
            currentUserRoom = "room_1";
        }
        
        // Make the current room available globally
        window.currentUserRoom = currentUserRoom;
        
    }, { onlyOnce: true });
    
    // Navigate to room page
    window.location.href = "https://wafiq5.github.io/Clampy/HTML/code.html";
}

// Function to get the current user's room
function moduleGetCurrentUserRoom() {
    // First check the variable
    if (currentUserRoom) {
        return currentUserRoom;
    }
    
    // Then check localStorage
    const storedRoom = localStorage.getItem("userRoom");
    if (storedRoom) {
        currentUserRoom = storedRoom;
        return storedRoom;
    }
    
    return null;
}

// Make Firebase globally available for the non-module version
window.firebase = {
    database: () => database
};

// Export the module version of the functions
window.moduleAddToRoom = moduleAddToRoom;
window.moduleGetCurrentUserRoom = moduleGetCurrentUserRoom;
