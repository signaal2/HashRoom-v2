import {
db,
doc,
getDoc,
setDoc,
updateDoc
} from "./firebase.js";

const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe.user;

let mining = false;
let miningInterval = null;
let balance = 0;
let approved = false;

const balanceEl = document.getElementById("balance");
const startBtn = document.getElementById("startBtn");
const planEl = document.getElementById("plan");
const usernameEl = document.getElementById("username");
const useridEl = document.getElementById("userid");

usernameEl.innerHTML = user.first_name;
useridEl.innerHTML = user.id;

const userRef = doc(db, "users", String(user.id));

async function loadUser() {

const snap = await getDoc(userRef);

if (!snap.exists()) {

await setDoc(userRef, {

id: user.id,

username: user.username || "",

name: user.first_name,

balance: 0,

approved: false,

mining: false,

hashrate: 0,

plan: "",

lastUpdate: Date.now()

});

balance = 0;

approved = false;

return;

}

const data = snap.data();

balance = data.balance || 0;

approved = data.approved || false;

mining = data.mining || false;

balanceEl.innerHTML = balance.toFixed(8) + " BTC";

planEl.innerHTML = data.plan || "No Plan";

if (approved) {

startBtn.disabled = false;

startBtn.innerHTML = "⚡ Start Mining";

} else {

startBtn.disabled = true;

startBtn.innerHTML = "Waiting Admin";

}

}

async function saveUser() {

await updateDoc(userRef, {

balance: balance,

approved: approved,

mining: mining,

lastUpdate: Date.now()

});

}

async function startMining() {

if (!approved) return;

if (mining) return;

mining = true;

startBtn.innerHTML = "⛏ Mining...";

await saveUser();

miningInterval = setInterval(async () => {

balance += 0.00000001;

balanceEl.innerHTML = balance.toFixed(8) + " BTC";

await saveUser();

}, 2000);

}

async function stopMining() {

mining = false;

clearInterval(miningInterval);

miningInterval = null;

startBtn.innerHTML = "⚡ Start Mining";

await saveUser();

}

startBtn.onclick = async () => {

if (!approved) return;

if (!mining) {

await startMining();

} else {

await stopMining();

}

};

async function resumeMining() {

const snap = await getDoc(userRef);

if (!snap.exists()) return;

const data = snap.data();

balance = data.balance || 0;
approved = data.approved || false;
mining = data.mining || false;

balanceEl.innerHTML = balance.toFixed(8) + " BTC";

if (approved) {

startBtn.disabled = false;

if (mining) {

startBtn.innerHTML = "⛏ Mining...";

miningInterval = setInterval(async () => {

balance += 0.00000001;

balanceEl.innerHTML = balance.toFixed(8) + " BTC";

await saveUser();

}, 2000);

} else {

startBtn.innerHTML = "⚡ Start Mining";

}

} else {

startBtn.disabled = true;
startBtn.innerHTML = "Waiting Admin";

}

}

window.addEventListener("beforeunload", async () => {

await saveUser();

});

setInterval(async () => {

await resumeMining();

}, 5000);

document.addEventListener("DOMContentLoaded", async () => {

await loadUser();

await resumeMining();

});

console.log("HashRoom V2 Ready");

function startMining() {

    setInterval(async () => {

        const ref = doc(db, "users", uid);

        const snap = await getDoc(ref);

        const data = snap.data();

        let earned = Number(data.earned);

        let balance = Number(data.balance);

        earned += 0.00000250;

        balance += 0.00000250;

        await updateDoc(ref, {

            earned: earned.toFixed(8),

            balance: balance.toFixed(8)

        });

        document.getElementById("earned").innerText = earned.toFixed(8) + " BTC";

        document.getElementById("balance").innerText = balance.toFixed(8) + " BTC";

    },1000);

}

loadUser();
