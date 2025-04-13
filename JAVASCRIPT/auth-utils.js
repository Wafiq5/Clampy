import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getDatabase, ref, set, onDisconnect, serverTimestamp, update, get, onValue } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js';

// Initialize Firebase if not already initialized
let database;
try {
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
    database = getDatabase(app);
} catch (error) {
    database = getDatabase();
}

async function logActiveUsers() {
    try {
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);
        const activeUsers = [];

        snapshot.forEach((childSnapshot) => {
            const userData = childSnapshot.val();
            if (userData.isLoggedIn === true) {
                activeUsers.push({
                    userId: childSnapshot.key,
                    username: userData.username,
                    email: userData.email,
                    lastLogin: userData.lastLogin
                });
            }
        });

        console.log('==== CURRENTLY ACTIVE USERS ====');
        console.log(`Total active users: ${activeUsers.length}`);
        activeUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.username} (${user.email})`);
        });
        console.log('===============================');

        return activeUsers;
    } catch (error) {
        console.error("Error fetching active users:", error);
        return [];
    }
}

// Function to track user's online status - handles tab/browser close detection
export function trackUserPresence(userId, userData) {
    return trackUser(userId, userData);
}

export function trackUser(userId, userData) {
    if (!userId) return;

    const userStatusRef = ref(database, `status/${userId}`);
    const userSessionRef = ref(database, `activeSessions/${userId}`);
    const userRef = ref(database, `users/${userId}`);

    const sessionInfo = {
        username: userData?.username || localStorage.getItem('username') || 'Unknown',
        email: userData?.email || localStorage.getItem('userEmail') || 'Unknown',
        loginTime: serverTimestamp(),
        lastActive: serverTimestamp(),
        browser: navigator.userAgent,
        online: true
    };

    // Set user as online and create session
    set(userStatusRef, { online: true, lastActive: serverTimestamp() });
    set(userSessionRef, sessionInfo);

    // Update user record with isLoggedIn flag
    get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
            update(userRef, {
                isLoggedIn: true,
                lastLogin: serverTimestamp()
            }).then(() => {
                // Log active users after successful login
                logActiveUsers();
            });
        }
    }).catch(error => {
        console.error("Error updating user login status:", error);
    });

    // Setup disconnect handlers for all references
    onDisconnect(userStatusRef).update({
        online: false,
        lastActive: serverTimestamp()
    });

    onDisconnect(userSessionRef).update({
        online: false,
        lastActive: serverTimestamp()
    });

    onDisconnect(userRef).update({
        isLoggedIn: false,
        lastSeen: serverTimestamp()
    });

    // Heartbeat to keep session fresh (every 5 minutes)
    const intervalId = setInterval(() => {
        if (localStorage.getItem('userId')) {
            update(userSessionRef, { lastActive: serverTimestamp() });
        } else {
            clearInterval(intervalId);
        }
    }, 5 * 60 * 1000);

    // Store interval ID to clear it on logout
    window.presenceIntervalId = intervalId;
}

export function logoutUser() {
    const userId = localStorage.getItem('userId');

    if (userId) {
        const userStatusRef = ref(database, `status/${userId}`);
        const userSessionRef = ref(database, `activeSessions/${userId}`);
        const userRef = ref(database, `users/${userId}`);

        update(userStatusRef, {
            online: false,
            lastActive: serverTimestamp()
        }).catch(error => {
            console.error("Error updating status on logout:", error);
        });

        update(userSessionRef, {
            online: false,
            lastActive: serverTimestamp()
        }).catch(error => {
            console.error("Error closing session on logout:", error);
        });

        update(userRef, {
            isLoggedIn: false,
            lastSeen: serverTimestamp()
        }).then(() => {
            logActiveUsers();
        }).catch(error => {
            console.error("Error updating user login status on logout:", error);
        });

        if (window.presenceIntervalId) {
            clearInterval(window.presenceIntervalId);
        }
    }

    localStorage.clear();

    return true;
}

export async function checkUserLoginStatus(userId) {
    if (!userId) return false;

    try {
        const userRef = ref(database, `users/${userId}`);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
            const userData = snapshot.val();
            return userData.isLoggedIn === true;
        }
        return false;
    } catch (error) {
        console.error("Error checking user login status:", error);
        return false;
    }
}

const setupActiveUsersListener = () => {
    const usersRef = ref(database, 'users');
    onValue(usersRef, (snapshot) => {
        logActiveUsers();
    });
};

// Initialize presence tracking when this module is loaded
const initPresenceTracking = () => {
    const userId = localStorage.getItem('userId');
    if (userId) {
        trackUser(userId);
        console.log('Presence tracking initialized for user:', userId);
    }
};

setupActiveUsersListener();
initPresenceTracking();