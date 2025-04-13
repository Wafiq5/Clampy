// code-editor-room.js - Handles real-time code synchronization between room members

// Variables to store room information
let currentRoomId = null;
let isInitialLoad = true;
let lastUpdateTime = 0;
let debounceTimer = null;
let skipNextUpdate = false;
const DEBOUNCE_DELAY = 300; // ms delay for debouncing
const UPDATE_GUARD_TIME = 500; // ms to prevent update loops

// Function to initialize the room code editor
export async function initializeCodeEditorRoom() {
    // Get the room ID from the room-functions.js module or localStorage
    currentRoomId = getCurrentRoomId();
    
    if (!currentRoomId) {
        console.error("No room ID found. Real-time code syncing disabled.");
        updateRoomStatus("Not connected to a room");
        return;
    }
    
    console.log(`Initializing code editor for room: ${currentRoomId}`);
    updateRoomStatus(`Connected to room: ${currentRoomId}`);
    
    try {
        // Set up real-time listeners for code changes
        setupRoomCodeListeners();
        
        // Track users in the room
        trackUserInRoom();
        
        // Initial code load from the database
        const roomCode = await getRoomCode(currentRoomId);
        
        if (roomCode && (roomCode.html || roomCode.css || roomCode.js)) {
            // If code already exists for this room, use it
            window.setEditorCode(roomCode.html || '', roomCode.css || '', roomCode.js || '', null, true);
            console.log("Loaded existing code from room");
        } else {
            // Otherwise, create empty code for this room
            await updateRoomCode(currentRoomId, {
                html: '',
                css: '',
                js: ''
            });
            console.log("Created new empty code for room");
        }
        
        // After initial load, we're ready to start sending our own updates
        setTimeout(() => {
            isInitialLoad = false;
            console.log("Initial load complete, real-time sync active");
            updateRoomStatus(`Live editing in room: ${currentRoomId}`);
        }, 1000);
        
    } catch (error) {
        console.error("Error initializing room code editor:", error);
        updateRoomStatus(`Error connecting to room: ${error.message}`);
    }
}

// Function to get the current room ID
export function getCurrentRoomId() {
    // Try to get room ID from various sources
    
    // 1. Check if window.currentUserRoom exists (set by room-functions.js)
    if (window.currentUserRoom) {
        return window.currentUserRoom;
    }
    
    // 2. Check localStorage
    const storedRoom = localStorage.getItem("userRoom");
    if (storedRoom) {
        return storedRoom;
    }
    
    // 3. Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('roomId');
    if (roomParam) {
        return roomParam;
    }
    
    return null;
}

// Function to set up real-time listeners for code changes in the database
function setupRoomCodeListeners() {
    if (!currentRoomId) return;
    
    // Using the Firebase compatibility API directly
    if (!firebase || !firebase.database) {
        console.error("Firebase database not available");
        return;
    }
    
    const database = firebase.database();
    const roomCodeRef = database.ref(`rooms/${currentRoomId}/code`);
    
    // Listen for changes to the code in the database
    roomCodeRef.on('value', (snapshot) => {
        if (isInitialLoad) return; // Skip during initial load
        if (skipNextUpdate) {
            skipNextUpdate = false;
            return; // Skip this update as it was triggered by setEditorCode
        }
        
        const roomCode = snapshot.val();
        if (!roomCode) return;
        
        // Check if this update is too soon after our own update
        const now = Date.now();
        if (now - lastUpdateTime < UPDATE_GUARD_TIME) {
            return; // Skip updates that might be caused by our own changes
        }
        
        console.log("Received code update from another user");
        
        // Apply the changes to our editors without triggering another update
        setTimeout(() => {
            if (window.setEditorCode) {
                window.setEditorCode(roomCode.html, roomCode.css, roomCode.js, null, true);
            }
        }, 50);
    });
    
    // Also listen for active users to update the UI
    const activeUsersRef = database.ref(`rooms/${currentRoomId}/activeUsers`);
    activeUsersRef.on('value', (snapshot) => {
        const users = snapshot.val() || {};
        const activeCount = Object.values(users).filter(u => u.active).length;
        updateRoomStatus(`${activeCount} user${activeCount !== 1 ? 's' : ''} in room: ${currentRoomId}`);
    });
}

// Function to get the current code from the database
export async function getRoomCode(roomId) {
    if (!roomId) roomId = currentRoomId;
    if (!roomId) return null;
    
    return new Promise((resolve, reject) => {
        if (!firebase || !firebase.database) {
            reject(new Error("Firebase database not available"));
            return;
        }
        
        const database = firebase.database();
        const roomCodeRef = database.ref(`rooms/${roomId}/code`);
        
        roomCodeRef.once('value').then((snapshot) => {
            const roomCode = snapshot.val() || { html: '', css: '', js: '' };
            resolve(roomCode);
        }).catch((error) => {
            console.error("Error getting room code:", error);
            reject(error);
        });
    });
}

// Function to update the code in the database
export function updateRoomCode(roomId, code) {
    if (!roomId) roomId = currentRoomId;
    if (!roomId || isInitialLoad) return Promise.resolve();
    
    // Debounce updates to reduce database writes
    return new Promise((resolve, reject) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (!firebase || !firebase.database) {
                reject(new Error("Firebase database not available"));
                return;
            }
            
            const database = firebase.database();
            const roomCodeRef = database.ref(`rooms/${roomId}/code`);
            
            // Update the last update time to prevent update loops
            lastUpdateTime = Date.now();
            
            // Tell the listener to skip the next update (which will be our own)
            skipNextUpdate = true;
            
            // Write the code to the database
            roomCodeRef.set(code)
                .then(() => {
                    console.log("Code updated in database");
                    resolve();
                })
                .catch(error => {
                    console.error("Error updating code in database:", error);
                    reject(error);
                });
        }, DEBOUNCE_DELAY);
    });
}

// Track users in the room
export function trackUserInRoom() {
    if (!currentRoomId) return;
    
    const userId = localStorage.getItem("userId") || `anonymous-${Math.random().toString(36).substring(2, 9)}`;
    if (!userId) return;
    
    // Store userId even if it's anonymous, so we have a consistent ID
    if (!localStorage.getItem("userId")) {
        localStorage.setItem("userId", userId);
    }
    
    if (!firebase || !firebase.database) {
        console.error("Firebase database not available");
        return;
    }
    
    const database = firebase.database();
    const roomUsersRef = database.ref(`rooms/${currentRoomId}/activeUsers/${userId}`);
    
    // Set status to active
    roomUsersRef.update({
        active: true,
        lastActive: Date.now()
    });
    
    // Keep the user status active with a heartbeat
    const heartbeatInterval = setInterval(() => {
        roomUsersRef.update({
            lastActive: Date.now()
        });
    }, 30000); // Every 30 seconds
    
    // Clean up on page close/refresh
    window.addEventListener('beforeunload', () => {
        clearInterval(heartbeatInterval);
        roomUsersRef.update({
            active: false,
            lastActive: Date.now()
        });
    });
}

// Update room status in the UI
function updateRoomStatus(message) {
    const roomInfo = document.getElementById('room-info');
    if (roomInfo) {
        roomInfo.textContent = message;
    }
}