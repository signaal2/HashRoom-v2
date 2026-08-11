const SUPABASE_URL =
  "https://rcftsmwuynpqrrosfkap.supabase.co";

const SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY";

const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

const user = tg?.initDataUnsafe?.user;

if (!user) {
  alert("لطفاً برنامه را از داخل Telegram باز کنید.");
  throw new Error("Telegram user not found");
}

const params = new URLSearchParams(location.search);
const planId = params.get("plan");

const plans = {
  basic:    { name: "Basic", price: 130 },
  starter:  { name: "Starter", price: 320 },
  pro:      { name: "Pro", price: 590 },
  advanced: { name: "Advanced", price: 540 },
  premium:  { name: "Premium", price: 860 },
  elite:    { name: "Elite", price: 860 },
  vip:      { name: "VIP", price: 1040 }
};

const plan = plans[planId];

if (!plan) {
  alert("Plan not found");
  throw new Error("Invalid plan");
}

document.getElementById("planName").textContent = plan.name;
document.getElementById("planPrice").textContent =
  plan.price + " USDT";

document.getElementById("paidBtn").onclick = async () => {

  const btn = document.getElementById("paidBtn");
  btn.disabled = true;
  btn.textContent = "Sending...";

  try {

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/payments`,
      {
        method: "POST",

        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },

        body: JSON.stringify({
          telegram_id: user.id,
          username: user.username || null,
          first_name: user.first_name || "",
          plan: plan.name,
          price: plan.price,
          status: "pending"
        })
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text);
    }

    alert(
      "درخواست خرید ثبت شد.\n\n" +
      "بعد از تأیید ادمین، Mining فعال می‌شود."
    );

  } catch (error) {

    console.error(error);

    alert(
      "خطا در ثبت درخواست:\n" +
      error.message
    );

    btn.disabled = false;
    btn.textContent = "I've Paid";
  }
};
