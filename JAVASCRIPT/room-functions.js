

let roomRef;
let currentUserRoom = null;

const prompts = [
    "Make a rectangle with length 20px",
    "Make a circle with a radius of 20px",
    "Make a button with content, “Click me”",
    "Use an inline style to make a paragraph element, “Hello” red",
    "Create a paragraph element, “I love dogs” with “love” being colored red",
    "Log something to the console using JS",
    "Add an image with width and height = 500px",
    "Write a poem using <br> elements, and <p> elements",
    "Make a form that allows the user to enter their name and submit",
    "Make two red circles that are tangent to each other",
    "Make three circles that are tangent to each other",
    "Make an equilateral triangle with side lengths of 20px",
    "Make a navbar",
    "Make rainbow texts",
    "Hide an item from the user, and when the user accidentally hovers over it, uncover it. (Use CSS)",
    "Make an animated button, the button should scale after the user hovers over it",
    "Add shadow animations to button, the button should have an inset shadow",
    "Make an animated circle, and use the radius from earlier",
    "Make an animated rectangle, and use the length from earlier",
    "Change the background color with a click of a button",
    "Generate the fibonacci numbers in a JS file, and display it on a paragraph element",
    "Generate prime numbers from 1–100, and display it on a paragraph element",
    "Delete a div from the DOM",
    "Center a div"
];


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
    const randomPromptIndex = Math.floor(Math.random() * prompts.length);
    const selectedPrompt = prompts[randomPromptIndex];
    
    const roomData = {
        users: { [firstUserId]: true },
        prompt: selectedPrompt,
        createdAt: Date.now()
    };
    
    database.ref(`rooms/${roomName}`).set(roomData);
}


function displayRoomPrompt() {
    const room = getCurrentUserRoom();
    const promptElement = document.getElementById('prompt');
    
    if (!room || !promptElement) return;
    
    const database = firebase.database();
    database.ref(`rooms/${room}/prompt`).once('value', (snapshot) => {
        const roomPrompt = snapshot.val();
        if (roomPrompt) {
            promptElement.textContent = roomPrompt;
        } else {
            promptElement.textContent = "No prompt assigned to this room";
        }
    });
}

// Add this to your initialization code
document.addEventListener('DOMContentLoaded', () => {
    setupRoomFunctions();
    
    // If we're on the code editor page, display the room prompt
    if (window.displayRoomPrompt) {
        window.displayRoomPrompt();
    } else {
        // Fallback if the function isn't loaded yet
        setTimeout(() => {
            if (window.displayRoomPrompt) {
                window.displayRoomPrompt();
            }
        }, 1000);
    }
});



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