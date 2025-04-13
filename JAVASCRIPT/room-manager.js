import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, arrayUnion, arrayRemove, onSnapshot } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js';
import { getDatabase, ref, onValue, set, update, get, push, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js';

// Firebase configuration
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

app = initializeApp(firebaseConfig);
database = getDatabase(app);
firestore = getFirestore(app);



