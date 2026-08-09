import { SUPABASE_URL, SUPABASE_KEY } from "./firebase.js";

const tg = window.Telegram?.WebApp;
tg?.expand();

const fallbackUser = { id: 0, first_name: "Guest", username: "" };
const user = tg?.initDataUnsafe?.user || fallbackUser;

const $ = (id) => document.getElementById(id);
const balanceEl = $("balance");
const usdEl = $("usd");
const startBtn = $("startBtn");
const planEl = $("plan");
const usernameEl = $("username");
const useridEl = $("userid");
const statusEl = $("mineStatus");
const hashrateEl = $("hashrate");
const dailyEl = $("daily");
const earnedEl = $("earned");

if (usernameEl) usernameEl.textContent = user.first_name || user.username || "User";
if (useridEl) useridEl.textContent = String(user.id);

let profile = null;
let timer = null;
let loading = false;

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json"
};

async function api(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) }
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) throw new Error(data?.message || data?.hint || text || `HTTP ${response.status}`);
  return data;
}

async function getUser() {
  const rows = await api(`users?id=eq.${encodeURIComponent(user.id)}&select=*`);
  return rows?.[0] || null;
}

async function createUser() {
  const referrer = new URLSearchParams(location.search).get("ref") || null;
  const row = {
    id: Number(user.id),
    username: user.username || "",
    first_name: user.first_name || "",
    balance: 0,
    approved: false,
    mining: false,
    plan: "",
    referrer: referrer && /^\d+$/.test(referrer) ? Number(referrer) : null,
    referrals: 0
  };
  await api("users", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(row)
  });
  return row;
}

async function saveUser(patch) {
  await api(`users?id=eq.${encodeURIComponent(user.id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(patch)
  });
  profile = { ...profile, ...patch };
}

function render() {
  if (!profile) return;
  const balance = Number(profile.balance || 0);
  const approved = Boolean(profile.approved);
  const mining = Boolean(profile.mining);
  const plan = profile.plan || "No Plan";

  if (balanceEl) balanceEl.textContent = `${balance.toFixed(8)} BTC`;
  if (usdEl) usdEl.textContent = `≈ $${(balance * 60000).toFixed(2)}`;
  if (planEl) planEl.textContent = plan;
  if (hashrateEl) hashrateEl.textContent = mining ? "100 TH/s" : "0 TH/s";
  if (dailyEl) dailyEl.textContent = mining ? "0.00043200 BTC" : "0 BTC";
  if (earnedEl) earnedEl.textContent = `${balance.toFixed(8)} BTC`;

  if (!approved) {
    if (startBtn) { startBtn.disabled = true; startBtn.textContent = "Waiting Admin"; }
    if (statusEl) statusEl.textContent = "● Waiting Admin";
    stopTimer();
    return;
  }

  if (startBtn) startBtn.disabled = false;
  if (mining) {
    if (startBtn) startBtn.textContent = "⛏ Mining...";
    if (statusEl) statusEl.textContent = "● Mining Active";
    startTimer();
  } else {
    if (startBtn) startBtn.textContent = "⚡ Start Mining";
    if (statusEl) statusEl.textContent = "● Ready";
    stopTimer();
  }
}

function startTimer() {
  if (timer || !profile?.approved || !profile?.mining) return;
  timer = setInterval(async () => {
    if (loading) return;
    loading = true;
    try {
      const next = Number(profile.balance || 0) + 0.00000001;
      await saveUser({ balance: next, mining: true });
      render();
    } catch (e) {
      console.error("Mining update failed:", e);
    } finally { loading = false; }
  }, 2000);
}

function stopTimer() {
  if (timer) clearInterval(timer);
  timer = null;
}

async function toggleMining() {
  if (!profile?.approved) return;
  try {
    if (profile.mining) await saveUser({ mining: false });
    else await saveUser({ mining: true });
    render();
  } catch (e) {
    console.error(e);
    alert("Mining update failed. Check Supabase permissions.");
  }
}

async function load() {
  try {
    profile = await getUser();
    if (!profile) profile = await createUser();
    render();
  } catch (e) {
    console.error(e);
    if (statusEl) statusEl.textContent = "● Database Error";
    if (startBtn) { startBtn.disabled = true; startBtn.textContent = "Database Error"; }
  }
}

startBtn?.addEventListener("click", toggleMining);

$("depositBtn")?.addEventListener("click", () => {
  location.href = "plans.html";
});

$("withdrawBtn")?.addEventListener("click", () => {
  location.href = "wallet.html";
});

window.addEventListener("pagehide", stopTimer);
load();
