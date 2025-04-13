import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js';
import { getDatabase, ref, get, update, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js';

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
const database = getDatabase(app);

const loginBtn = document.getElementById("loginUiFormSubmitButton");

// Function to get user data from the database
const getUserData = async (userId) => {
    const userRef = ref(database, 'users/' + userId);
    try {
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            console.log("No user data available");
            return null;
        }
    } catch (error) {
        console.error("Error getting user data:", error);
        return null;
    }
};

// Function to update user's login status
const updateLoginStatus = async (userId) => {
    const userRef = ref(database, 'users/' + userId);
    try {
        await update(userRef, {
            isLoggedIn: true,
            lastLogin: serverTimestamp(),
            lastSeen: serverTimestamp()
        });
        console.log("User login status updated");
    } catch (error) {
        console.error("Error updating login status:", error);
    }
};

const Authenticate = () => {
    const password = document.getElementById("loginUiFormUserPassword").value;
    const email = document.getElementById("loginUiFormUserEmail").value;

    signInWithEmailAndPassword(auth, email, password)
        .then(async (userCredentials) => {
            const user = userCredentials.user;
            console.log('Login successful, setting localStorage...');
            localStorage.setItem('userEmail', user.email);
            localStorage.setItem('userId', user.uid);

            // Update login status in the database
            await updateLoginStatus(user.uid);

            // Fetch additional user data from the database
            const userData = await getUserData(user.uid);
            if (userData && userData.username) {
                localStorage.setItem('username', userData.username);
                console.log("Username retrieved:", userData.username);
            }

            console.log("Redirecting to index.html...");
            window.location.href = "./index.html";
        }).catch((error) => {
            alert(error.message);
        });
};

if (loginBtn) {
    loginBtn.addEventListener("click", Authenticate);
} else {
    console.error("Login button not found");
}