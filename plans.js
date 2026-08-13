import { SUPABASE_URL, SUPABASE_KEY } from "./firebase.js";

const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

const user = tg?.initDataUnsafe?.user;

const prices = {
  Basic: 100,
  Pro: 250,
  VIP: 500
};

function $(id) {
  return document.getElementById(id);
}

async function api(path, options = {}) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${path}`,
    {
      ...options,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    }
  );

  const text = await response.text();

  if (!response.ok) {
    throw new Error(text);
  }

  return text ? JSON.parse(text) : null;
}

$("buy").onclick = async () => {
  try {
    if (!user?.id) {
      $("msg").textContent =
        "این صفحه باید داخل Telegram WebApp باز شود.";
      $("msg").className = "bad";
      return;
    }

    const plan = $("plan").value;
    const amount = prices[plan];

    await api("payments", {
      method: "POST",
      headers: {
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        telegram_id: Number(user.id),
        username: user.username || null,
        first_name: user.first_name || null,
        plan: plan,
        price: amount,
        status: "pending"
      })
    });

    $("msg").textContent =
      "Payment request sent. Waiting for admin approval.";
    $("msg").className = "ok";

  } catch (error) {
    console.error(error);

    $("msg").textContent =
      "Error: " + error.message;

    $("msg").className = "bad";
  }
};
