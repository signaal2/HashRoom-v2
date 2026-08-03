import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
getFirestore,
doc,
getDoc,
setDoc,
updateDoc,
onSnapshot,
collection,
query,
orderBy
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
apiKey: "AIzaSyCb33maMPYDgLQLYV6puLxy9gwQ6OvcEzc",
authDomain: "hashroom-f8eee.firebaseapp.com",
projectId: "hashroom-f8eee",
storageBucket: "hashroom-f8eee.firebasestorage.app",
messagingSenderId: "693332836528",
appId: "1:693332836528:web:b88877825fd09b1d7cbb75"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export {
doc,
getDoc,
setDoc,
updateDoc,
onSnapshot,
collection,
query,
orderBy
};
