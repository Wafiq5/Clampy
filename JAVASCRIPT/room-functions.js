let roomRef;
let currentUserRoom = null;

function setupRoomFunctions() {
    if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
        const database = firebase.database();
        roomRef = database.ref('rooms');
        console.log("Room functions initialized using existing Firebase instance");
    } else {
        console.log("Firebase not initialized yet. Room functions will initialize when Firebase is ready.");
    }
}

function addToRoom() {
    console.log("addToRoom function called");
    
    const userId = localStorage.getItem("userId");
    if (!userId) {
        console.log("No userId found in localStorage");
        alert("Please log in first to join a room");
        return;
    }

    if (window.firebase && window.firebase.database) {
        const database = firebase.database();
        const roomRef = database.ref('rooms');
        
        roomRef.once('value', (snapshot) => {
            const rooms = snapshot.val();

            if (rooms) {
                const roomNames = Object.keys(rooms);
                const lastRoomName = roomNames[roomNames.length - 1];
                const lastRoom = rooms[lastRoomName];

                const users = lastRoom.users || {};
                const userCount = Object.keys(users).length;

                if (userCount < 4) {
                    const userRef = database.ref(`rooms/${lastRoomName}/users`);
                    userRef.update({ [userId]: true });
                    console.log(`Added user to existing room: ${lastRoomName}`);
                    
                    localStorage.setItem("userRoom", lastRoomName);
                    currentUserRoom = lastRoomName;
                } else {
                    const newRoomName = `room_${roomNames.length + 1}`;
                    createNewRoom(database, newRoomName, userId);
                    console.log(`Created new room: ${newRoomName}`);
                    
                    localStorage.setItem("userRoom", newRoomName);
                    currentUserRoom = newRoomName;
                }
            } else {
                createNewRoom(database, 'room_1', userId);
                console.log("Created first room: room_1");
                
                localStorage.setItem("userRoom", "room_1");
                currentUserRoom = "room_1";
            }
            
            // Make room ID available globally
            window.currentUserRoom = currentUserRoom;
            
            // Redirect to room page
            window.location.href = "https://wafiq5.github.io/Clampy/HTML/code.html";
        });
    } else {
        console.log("Firebase not initialized yet, trying module version...");
        // Try to use the function from the module version as a fallback
        if (window.moduleAddToRoom) {
            window.moduleAddToRoom();
        } else {
            console.error("Firebase not initialized and module function not available");
            alert("Could not connect to rooms. Please try again later.");
        }
    }
}

// Create a new room with the enhanced structure including prompts and code branches
function createNewRoom(database, roomName, firstUserId) {
    const newRoomRef = database.ref(`rooms/${roomName}/users`);
    newRoomRef.set({ [firstUserId]: true });
}

// Get the current user's room
function getCurrentUserRoom() {
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
    
    // If no room is found, return null
    return null;
}

// Initialize when the script loads
document.addEventListener('DOMContentLoaded', setupRoomFunctions);

// Also try to initialize right away in case the DOM is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setupRoomFunctions();
}

// Export the getCurrentUserRoom function
window.getCurrentUserRoom = getCurrentUserRoom;