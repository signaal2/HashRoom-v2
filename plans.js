import { SUPABASE_URL, SUPABASE_KEY } from "./firebase.js";

const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
}

const user = tg?.initDataUnsafe?.user;

const planData = {
  Basic: {
    price: 130,
    hashrate: 120,
    duration: 30,
    daily: "0.00031 BTC"
  },

  Starter: {
    price: 320,
    hashrate: 250,
    duration: 30,
    daily: "0.00081 BTC"
  },

  Pro: {
    price: 599,
    hashrate: 510,
    duration: 30,
    daily: "0.00150 BTC"
  },

  Advanced: {
    price: 540,
    hashrate: 250,
    duration: 60,
    daily: "0.00081 BTC"
  },

  Premium: {
    price: 860,
    hashrate: 510,
    duration: 60,
    daily: "0.00150 BTC"
  },

  Elite: {
    price: 860,
    hashrate: 250,
    duration: 90,
    daily: "0.00081 BTC"
  },

  VIP: {
    price: 1040,
    hashrate: 510,
    duration: 90,
    daily: "0.00150 BTC"
  }
};

const msg = document.getElementById("msg");

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

async function submitPayment(plan) {

  if (!user?.id) {
    throw new Error(
      "Please open HashRoom inside Telegram."
    );
  }

  const info = planData[plan];

  if (!info) {
    throw new Error(
      "Invalid plan: " + plan
    );
  }

  await api("payments", {
    method: "POST",

    headers: {
      Prefer: "return=minimal"
    },

    body: JSON.stringify({
      telegram_id: Number(user.id),
      username: user.username || "",
      first_name: user.first_name || "",
      plan: plan,
      price: info.price,
      status: "pending"
    })
  });
}

function showMessage(text, type) {

  if (!msg) return;

  msg.textContent = text;
  msg.className = type || "";
}

function setButtonLoading(button, loading) {

  if (loading) {

    button.disabled = true;
    button.dataset.oldText = button.textContent;
    button.textContent = "Submitting...";

  } else {

    button.disabled = false;
    button.textContent =
      button.dataset.oldText || "BUY NOW";

  }
}


/*
  همه دکمه‌های BUY NOW
*/

const buttons =
  document.querySelectorAll(".plan-buy");


buttons.forEach(button => {

  button.addEventListener("click", async function () {

    const plan =
      this.getAttribute("data-plan");

    console.log(
      "BUY NOW clicked:",
      plan
    );

    try {

      setButtonLoading(this, true);

      showMessage(
        `Submitting ${plan} payment request...`,
        ""
      );

      await submitPayment(plan);

      showMessage(
        `${plan} payment request sent. Waiting for admin approval.`,
        "ok"
      );

    } catch (error) {

      console.error(
        "Payment error:",
        error
      );

      showMessage(
        "Error: " + error.message,
        "bad"
      );

    } finally {

      setButtonLoading(this, false);

    }

  });

});


/*
  بررسی اینکه دکمه‌ها واقعاً پیدا شده‌اند
*/

console.log(
  "HashRoom Plans loaded."
);

console.log(
  "Telegram user:",
  user
);

console.log(
  "BUY NOW buttons:",
  buttons.length
);
