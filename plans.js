const SUPABASE_URL = "https://rcftsmwuynpqrrosfkap.supabase.co";
const SUPABASE_KEY = "sb_publishable_xHnveIjt43xV1tA4683_HA_qZ8sS2PC";

const tg = window.Telegram?.WebApp;
tg?.expand();

const user = tg?.initDataUnsafe?.user || {
  id: 0,
  username: "",
  first_name: ""
};

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json"
};

const prices = {
  Basic: 130,
  Pro: 250,
  VIP: 500
};

async function supabase(path, options = {}) {
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

  if (!response.ok) {
    throw new Error(text || `HTTP ${response.status}`);
  }

  return text ? JSON.parse(text) : null;
}

function $(id) {
  return document.getElementById(id);
}

if ($("buy")) {
  $("buy").onclick = async () => {
    try {
      const plan = $("plan").value;
      const price = prices[plan];

      if (!user.id) {
        throw new Error("Telegram user not detected");
      }

      await supabase("payments", {
        method: "POST",
        headers: {
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          telegram_id: Number(user.id),
          username: user.username || null,
          first_name: user.first_name || null,
          plan: plan,
          price: price,
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
}
