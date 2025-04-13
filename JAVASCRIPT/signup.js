import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js';
import { getDatabase, ref, set, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js';

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Get the signup button
const signUpBtn = document.getElementById("signUpUiFormSubmitButton");

// Function to save user data to the database
const saveUserData = (userId, username, email) => {
    set(ref(database, 'users/' + userId), {
        username: username,
        email: email,
        isLoggedIn: true,
        createdAt: new Date().toISOString(),
        lastLogin: serverTimestamp(),
        lastSeen: serverTimestamp()
    })
        .then(() => {
            console.log("User data saved successfully");
        })
        .catch((error) => {
            console.error("Error saving user data:", error);
        });
};

// Function to handle user registration
const registerUser = () => {
    const username = document.getElementById("signUpUiFormUsername").value.trim();
    const email = document.getElementById("signUpUiFormUserEmail").value.trim();
    const password = document.getElementById("signUpUiFormUserPassword").value;
    const confirmPassword = document.getElementById("signUpUiFormUserConfirmPassword").value;

    // Validate that username is provided
    if (!username) {
        alert("Please enter a username");
        return;
    }

    // Validate that passwords match
    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    // Validate password strength (minimum 6 characters)
    if (password.length < 6) {
        alert("Password should be at least 6 characters long");
        return;
    }

    // Create the user with Firebase
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // User created successfully
            const user = userCredential.user;
            console.log("User registered successfully:", user.email);

            // Save additional user data to the database
            saveUserData(user.uid, username, user.email);

            console.log('Setting localStorage values...');
            // Store user information in localStorage
            localStorage.setItem('userEmail', user.email);
            localStorage.setItem('username', username);
            localStorage.setItem('userId', user.uid);

            console.log('Redirecting to index.html...');
            // Redirect to homepage
            window.location.href = "./index.html";
        })
        .catch((error) => {
            // Handle errors
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Registration error:", errorCode, errorMessage);

            // Show appropriate error messages to user
            if (errorCode === 'auth/email-already-in-use') {
                alert("This email is already registered. Please use a different email or try logging in.");
            } else if (errorCode === 'auth/invalid-email') {
                alert("Please enter a valid email address.");
            } else {
                alert(errorMessage);
            }
        });
};

// Add event listener to the signup button
if (signUpBtn) {
    signUpBtn.addEventListener("click", registerUser);
} else {
    console.error("Signup button not found");
}