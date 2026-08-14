import { SUPABASE_URL, SUPABASE_KEY } from "./firebase.js";

const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

const telegramUser = tg?.initDataUnsafe?.user;

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

if (!telegramUser) {
  if (statusEl) statusEl.textContent = "● Open HashRoom inside Telegram";
  if (startBtn) {
    startBtn.disabled = true;
    startBtn.textContent = "Open in Telegram";
  }
  throw new Error("Telegram user not detected");
}

const user = telegramUser;

if (usernameEl) {
  usernameEl.textContent =
    user.first_name || user.username || "User";
}

if (useridEl) {
  useridEl.textContent = String(user.id);
}

let profile = null;
let timer = null;
let loading = false;

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json"
};

async function api(path, options = {}) {

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${path}`,
    {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {})
      }
    }
  );

  const text = await response.text();

  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.hint ||
      text ||
      `HTTP ${response.status}`
    );
  }

  return data;
}


/* =========================
   GET USER
========================= */

async function getUser() {

  const rows = await api(
    `users?telegram_id=eq.${encodeURIComponent(user.id)}&select=*`
  );

  return rows?.[0] || null;
}


/* =========================
   CREATE USER
========================= */

async function createUser() {

  const referrer =
    new URLSearchParams(location.search).get("ref") || null;

  const row = {

    telegram_id: Number(user.id),

    username:
      user.username || "",

    first_name:
      user.first_name || "",

    balance: 0,

    approved: false,

    mining: false,

    plan: "",

    referrals: 0,

    referral_earned: 0,

    referrer:
      referrer && /^\d+$/.test(referrer)
        ? Number(referrer)
        : null
  };

  await api(
    "users",
    {
      method: "POST",

      headers: {
        Prefer: "return=minimal"
      },

      body: JSON.stringify(row)
    }
  );

  return row;
}


/* =========================
   SAVE USER
========================= */

async function saveUser(patch) {

  await api(
    `users?telegram_id=eq.${encodeURIComponent(user.id)}`,
    {
      method: "PATCH",

      headers: {
        Prefer: "return=minimal"
      },

      body: JSON.stringify(patch)
    }
  );

  profile = {
    ...profile,
    ...patch
  };
}


/* =========================
   RENDER HOME
========================= */

function render() {

  if (!profile) return;

  const balance =
    Number(profile.balance || 0);

  const approved =
    profile.approved === true;

  const mining =
    profile.mining === true;

  const plan =
    profile.plan || "No Plan";


  if (balanceEl) {
    balanceEl.textContent =
      `${balance.toFixed(8)} BTC`;
  }


  if (usdEl) {
    usdEl.textContent =
      `≈ $${(balance * 60000).toFixed(2)}`;
  }


  if (planEl) {
    planEl.textContent =
      plan;
  }


  if (hashrateEl) {

  const hashRates = {
    Basic: "120 TH/s",
    Starter: "250 TH/s",
    Pro: "510 TH/s",
    Advanced: "250 TH/s",
    Premium: "510 TH/s",
    Elite: "250 TH/s",
    VIP: "510 TH/s"
  };

  hashrateEl.textContent =
    mining
      ? (hashRates[profile.plan] || "0 TH/s")
      : "0 TH/s";
  }


  if (dailyEl) {
    dailyEl.textContent =
      mining
        ? "0.00043200 BTC"
        : "0 BTC";
  }


  if (earnedEl) {
    earnedEl.textContent =
      `${balance.toFixed(8)} BTC`;
  }


  /* =========================
     NOT APPROVED
  ========================= */

  if (!approved) {

    if (startBtn) {

      startBtn.disabled = true;

      startBtn.textContent =
        "Waiting Admin";
    }

    if (statusEl) {

      statusEl.textContent =
        "● Waiting Admin";
    }

    stopTimer();

    return;
  }


  /* =========================
     APPROVED + MINING
  ========================= */

  if (mining) {

    if (startBtn) {

      startBtn.disabled = false;

      startBtn.textContent =
        "⛏ Mining...";
    }

    if (statusEl) {

      statusEl.textContent =
        "● Mining Active";
    }

    startTimer();

    return;
  }


  /* =========================
     APPROVED BUT NOT MINING
  ========================= */

  if (startBtn) {

    startBtn.disabled = false;

    startBtn.textContent =
      "⚡ Start Mining";
  }

  if (statusEl) {

    statusEl.textContent =
      "● Ready";
  }

  stopTimer();
}


/* =========================
   MINING TIMER
========================= */

function startTimer() {

  if (
    timer ||
    !profile?.approved ||
    !profile?.mining
  ) {
    return;
  }


  timer = setInterval(
    async () => {

      if (loading) return;

      loading = true;

      try {

        const nextBalance =
          Number(profile.balance || 0)
          + 0.00000001;


        await saveUser({

          balance:
            nextBalance,

          mining:
            true
        });


        render();

      } catch (error) {

        console.error(
          "Mining update failed:",
          error
        );

      } finally {

        loading = false;
      }

    },
    10000
  );
}


/* =========================
   STOP TIMER
========================= */

function stopTimer() {

  if (timer) {

    clearInterval(timer);

  }

  timer = null;
}


/* =========================
   START / STOP MINING
========================= */

async function toggleMining() {

  if (!profile?.approved) {

    return;
  }


  try {

    await saveUser({

      mining:
        !profile.mining
    });


    render();

  } catch (error) {

    console.error(error);

    alert(
      "Mining update failed:\n" +
      error.message
    );
  }
}


/* =========================
   LOAD USER
========================= */

async function load() {

  try {

    profile =
      await getUser();


    if (!profile) {

      profile =
        await createUser();
    }


    render();

  } catch (error) {

    console.error(
      "Home database error:",
      error
    );


    if (statusEl) {

      statusEl.textContent =
        "● Database Error";
    }


    if (startBtn) {

      startBtn.disabled = true;

      startBtn.textContent =
        "Database Error";
    }
  }
}


/* =========================
   BUTTONS
========================= */

startBtn?.addEventListener(
  "click",
  toggleMining
);


$("depositBtn")?.addEventListener(
  "click",
  () => {

    location.href =
      "plans.html";
  }
);


$("withdrawBtn")?.addEventListener(
  "click",
  () => {

    location.href =
      "wallet.html";
  }
);


window.addEventListener(
  "pagehide",
  stopTimer
);


/* =========================
   START
========================= */

load();
